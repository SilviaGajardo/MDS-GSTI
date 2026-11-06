"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Citizen } from "@/lib/types";

type ResultadoLlamada =
  | "pendiente"
  | "exito"
  | "no_contestada"
  | "vuelta_mesa_ayuda";

type DatosAtencion = {
  subject: string;
  description: string;
  department?: string;
  area?: string;
  staff?: string;
  attentionMode?: "normal" | "llamada_transferida";
  callOutcome?: ResultadoLlamada;
  pendingInformation?: boolean;
};

interface Step3CreateTicketProps {
  citizen: Citizen;
  ticketType: "consulta" | "requerimiento";
  onSubmit: (data: DatosAtencion) => void | Promise<void>;
  onBack: () => void;
}

type Departamento = {
  id: number;
  nombre: string;
};

type Formulario = {
  subject: string;
  description: string;
  department: string;
  area: string;
  attentionMode: "normal" | "llamada_transferida";
  callOutcome: ResultadoLlamada;
  pendingInformation: boolean;
};

const MOTIVOS_CONSULTA = [
  "Horarios de atención",
  "Requisitos para trámites",
  "Información de programas municipales",
  "Otro",
];

const CLASE_CAMPO =
  "mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60";

export function Step3CreateTicket({
  citizen,
  ticketType,
  onSubmit,
  onBack,
}: Step3CreateTicketProps) {
  const esConsulta = ticketType === "consulta";
  const esAnonimo = String(citizen.id).startsWith("anon-");

  const ciudadano = citizen as Citizen & {
    nombre?: string;
    apellido?: string;
  };

  const nombreCiudadano = esAnonimo
    ? "Anónimo"
    : ciudadano.name ||
      [ciudadano.nombre, ciudadano.apellido]
        .filter(Boolean)
        .join(" ") ||
      "Ciudadano registrado";

  const [formData, setFormData] = useState<Formulario>({
    subject: "",
    description: "",
    department: "",
    area: "",
    attentionMode: "normal",
    callOutcome: "pendiente",
    pendingInformation: false,
  });

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargandoDepartamentos, setCargandoDepartamentos] = useState(true);
  const [errorDepartamentos, setErrorDepartamentos] = useState("");
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const envioEnCurso = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();

    setCargandoDepartamentos(true);
    setErrorDepartamentos("");

    async function cargarDepartamentos() {
      try {
        const respuesta = await fetch("/api/ti/departamentos", {
          cache: "no-store",
          signal: controlador.signal,
        });

        const datos = await respuesta.json();

        if (
          !respuesta.ok ||
          datos?.ok !== true ||
          !Array.isArray(datos.departamentos)
        ) {
          throw new Error(
            datos?.mensaje ||
              datos?.error ||
              "No se pudieron cargar los departamentos."
          );
        }

        const catalogoValido = datos.departamentos.every(
          (departamento: unknown) => {
            if (
              !departamento ||
              typeof departamento !== "object"
            ) {
              return false;
            }

            const item = departamento as Departamento;

            return (
              Number.isSafeInteger(item.id) &&
              item.id > 0 &&
              typeof item.nombre === "string" &&
              item.nombre.trim().length > 0
            );
          }
        );

        if (!catalogoValido) {
          throw new Error(
            "El servidor devolvió un catálogo de departamentos inválido."
          );
        }

        if (controlador.signal.aborted) return;

        setDepartamentos(datos.departamentos);
      } catch (error: unknown) {
        if (controlador.signal.aborted) return;

        setErrorDepartamentos(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los departamentos."
        );
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoDepartamentos(false);
        }
      }
    }

    void cargarDepartamentos();

    return () => controlador.abort();
  }, [intentoCatalogo]);

  const descripcionObligatoria =
    !esConsulta || formData.subject === "Otro";

  const catalogoNoDisponible =
    cargandoDepartamentos ||
    !!errorDepartamentos ||
    departamentos.length === 0;

  function limpiarError(campo: string) {
    setErrors((actuales) => ({
      ...actuales,
      [campo]: "",
    }));
  }

  function validar() {
    const nuevosErrores: Record<string, string> = {};

    if (!esConsulta && esAnonimo) {
      nuevosErrores.citizen =
        "Para registrar un requerimiento debe identificar al ciudadano.";
    }

    if (!formData.subject.trim()) {
      nuevosErrores.subject = esConsulta
        ? "Seleccione el motivo de la consulta."
        : "Ingrese el asunto del requerimiento.";
    } else if (
      esConsulta &&
      !MOTIVOS_CONSULTA.includes(formData.subject)
    ) {
      nuevosErrores.subject = "Seleccione un motivo válido.";
    }

    if (descripcionObligatoria && !formData.description.trim()) {
      nuevosErrores.description = "Ingrese una descripción.";
    }

    if (!formData.department) {
      nuevosErrores.department = "Seleccione un departamento.";
    } else if (
      !departamentos.some(
        (departamento) =>
          String(departamento.id) === formData.department
      )
    ) {
      nuevosErrores.department =
        "Seleccione un departamento disponible.";
    }

    if (!esConsulta && !formData.area.trim()) {
      nuevosErrores.area = "Ingrese el área del requerimiento.";
    }

    setErrors(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (
      envioEnCurso.current ||
      catalogoNoDisponible ||
      !validar()
    ) {
      return;
    }

    envioEnCurso.current = true;
    setGuardando(true);
    setErrorEnvio("");

    try {
      await onSubmit({
        subject: formData.subject.trim(),
        description:
          formData.description.trim() || formData.subject.trim(),
        department: formData.department,
        area: esConsulta ? undefined : formData.area.trim(),
        attentionMode: esConsulta
          ? undefined
          : formData.attentionMode,
        callOutcome:
          !esConsulta &&
          formData.attentionMode === "llamada_transferida"
            ? formData.callOutcome
            : undefined,
        pendingInformation: esConsulta
          ? undefined
          : formData.pendingInformation,
      });
    } catch (error: unknown) {
      setErrorEnvio(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la atención."
      );
    } finally {
      envioEnCurso.current = false;
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {esConsulta ? "Nueva Consulta" : "Nuevo Requerimiento"}
        </h2>

        <p className="mt-2 text-muted-foreground">
          {esConsulta
            ? "Registre la consulta atendida por teléfono."
            : "Complete los detalles del requerimiento."}
        </p>
      </div>

      <div className="rounded-lg bg-secondary/30 p-4">
        <p className="text-sm text-foreground">
          <span className="font-medium">Ciudadano:</span>{" "}
          {nombreCiudadano}
        </p>

        {esAnonimo && (
          <p className="mt-1 text-xs text-muted-foreground">
            La atención se guardará sin asociar datos personales.
          </p>
        )}
      </div>

      {errors.citizen && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {errors.citizen}
        </p>
      )}

      {errorEnvio && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {errorEnvio}
        </p>
      )}

      <fieldset disabled={guardando} className="min-w-0 space-y-4">
        <div>
          <label
            htmlFor="atencion-asunto"
            className="block text-sm font-medium text-foreground"
          >
            {esConsulta ? "Motivo de la consulta *" : "Asunto *"}
          </label>

          {esConsulta ? (
            <select
              id="atencion-asunto"
              value={formData.subject}
              onChange={(evento) => {
                const valor = evento.target.value;

                setFormData((actual) => ({
                  ...actual,
                  subject: valor,
                }));

                limpiarError("subject");
                limpiarError("description");
              }}
              className={CLASE_CAMPO}
              aria-invalid={!!errors.subject}
              aria-describedby={
                errors.subject ? "error-asunto" : undefined
              }
            >
              <option value="">
                Seleccione el motivo de la consulta
              </option>

              {MOTIVOS_CONSULTA.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="atencion-asunto"
              type="text"
              maxLength={50}
              value={formData.subject}
              onChange={(evento) => {
                const valor = evento.target.value;

                setFormData((actual) => ({
                  ...actual,
                  subject: valor,
                }));

                limpiarError("subject");
              }}
              placeholder="Ingrese el asunto del requerimiento"
              className={CLASE_CAMPO}
              aria-invalid={!!errors.subject}
              aria-describedby={
                errors.subject ? "error-asunto" : undefined
              }
            />
          )}

          <p className="mt-1 text-right text-xs text-muted-foreground">
  {formData.subject.length} / 50 caracteres
</p>

          {errors.subject && (
            <p
              id="error-asunto"
              className="mt-1 text-sm text-red-600"
            >
              {errors.subject}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="atencion-descripcion"
            className="block text-sm font-medium text-foreground"
          >
            Descripción {descripcionObligatoria ? "*" : "(opcional)"}
          </label>

          <textarea
            id="atencion-descripcion"
            value={formData.description}
            maxLength={200}
            onChange={(evento) => {
              const valor = evento.target.value;

              setFormData((actual) => ({
                ...actual,
                description: valor,
              }));

              limpiarError("description");
            }}
            placeholder={
              esConsulta
                ? "Puede indicar qué preguntó la persona y qué información se le entregó."
                : "Describa el requerimiento."
            }
            rows={4}
            className={CLASE_CAMPO}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "error-descripcion" : undefined
            }
          />

          <p className="mt-1 text-right text-xs text-muted-foreground">
  {formData.description.length} / 200 caracteres
</p>

          {errors.description && (
            <p
              id="error-descripcion"
              className="mt-1 text-sm text-red-600"
            >
              {errors.description}
            </p>
          )}
        </div>

        {!esConsulta && !esAnonimo && (
          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <label
              htmlFor="atencion-transferida"
              className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground"
            >
              <input
                id="atencion-transferida"
                type="checkbox"
                checked={
                  formData.attentionMode === "llamada_transferida"
                }
                onChange={(evento) => {
                  const marcada = evento.target.checked;

                  setFormData((actual) => ({
                    ...actual,
                    attentionMode: marcada
                      ? "llamada_transferida"
                      : "normal",
                    callOutcome: "pendiente",
                  }));
                }}
                className="h-4 w-4"
              />

              Llamada transferida
            </label>

            {formData.attentionMode === "llamada_transferida" && (
  <div className="mt-4">
    <label
      htmlFor="atencion-resultado"
      className="block text-sm font-medium text-foreground"
    >
      Resultado de la llamada *
    </label>

    <select
      id="atencion-resultado"
      value={formData.callOutcome}
      onChange={(evento) => {
        const resultado =
          evento.target.value as ResultadoLlamada;

        setFormData((actual) => ({
          ...actual,
          callOutcome: resultado,
        }));
      }}
      className={CLASE_CAMPO}
    >
      <option value="pendiente">
        Pendiente de confirmar
      </option>
      <option value="exito">
        Llamada transferida con éxito
      </option>
      <option value="no_contestada">
        No contestada
      </option>
      <option value="vuelta_mesa_ayuda">
        Llamada vuelta a mesa de ayuda
      </option>
    </select>
  </div>
)}
          </div>
        )}

        {!esConsulta && (
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
            <label
              htmlFor="atencion-pendiente"
              className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-800"
            >
              <input
                id="atencion-pendiente"
                type="checkbox"
                checked={formData.pendingInformation}
                onChange={(evento) => {
                  const marcada = evento.target.checked;

                  setFormData((actual) => ({
                    ...actual,
                    pendingInformation: marcada,
                  }));
                }}
                className="h-4 w-4"
              />

              Pendiente de información
            </label>

            <p className="mt-2 text-xs text-slate-600">
              Se dejará constancia de que faltan antecedentes.
              El requerimiento se registrará abierto.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="atencion-departamento"
            className="block text-sm font-medium text-foreground"
          >
            {esConsulta
              ? "Departamento relacionado con la consulta *"
              : "Departamento a derivar *"}
          </label>

          <select
            id="atencion-departamento"
            value={formData.department}
            disabled={catalogoNoDisponible}
            onChange={(evento) => {
              const valor = evento.target.value;

              setFormData((actual) => ({
                ...actual,
                department: valor,
                area: "",
              }));

              limpiarError("department");
              limpiarError("area");
            }}
            className={CLASE_CAMPO}
            aria-invalid={!!errors.department}
            aria-describedby={
              errors.department ? "error-departamento" : undefined
            }
          >
            <option value="">
              {cargandoDepartamentos
                ? "Cargando departamentos…"
                : "Seleccione un departamento"}
            </option>

            {departamentos.map((departamento) => (
              <option
                key={departamento.id}
                value={String(departamento.id)}
              >
                {departamento.nombre}
              </option>
            ))}
          </select>

          {errors.department && (
            <p
              id="error-departamento"
              className="mt-1 text-sm text-red-600"
            >
              {errors.department}
            </p>
          )}

          {errorDepartamentos && (
            <div
              role="alert"
              className="mt-2 text-sm text-red-700"
            >
              <p>{errorDepartamentos}</p>

              <button
                type="button"
                onClick={() =>
                  setIntentoCatalogo((actual) => actual + 1)
                }
                className="mt-1 font-semibold underline"
              >
                Reintentar carga
              </button>
            </div>
          )}

          {!cargandoDepartamentos &&
            !errorDepartamentos &&
            departamentos.length === 0 && (
              <p
                role="status"
                className="mt-2 text-sm text-amber-700"
              >
                No hay departamentos disponibles para registrar
                la atención.
              </p>
            )}

          {esConsulta && (
            <p className="mt-2 text-xs text-muted-foreground">
              Indica a qué departamento corresponde la información.
              Esto no transfiere la llamada.
            </p>
          )}
        </div>

        {!esConsulta && formData.department && (
          <div>
            <label
              htmlFor="atencion-area"
              className="block text-sm font-medium text-foreground"
            >
              Área *
            </label>

            <input
              id="atencion-area"
              type="text"
              maxLength={150}
              value={formData.area}
              onChange={(evento) => {
                const valor = evento.target.value;

                setFormData((actual) => ({
                  ...actual,
                  area: valor,
                }));

                limpiarError("area");
              }}
              placeholder="Ingrese el área dentro del departamento"
              className={CLASE_CAMPO}
              aria-invalid={!!errors.area}
              aria-describedby={
                errors.area ? "error-area" : undefined
              }
            />

            {errors.area && (
              <p
                id="error-area"
                className="mt-1 text-sm text-red-600"
              >
                {errors.area}
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          {esConsulta
            ? "La consulta quedará cerrada automáticamente como una atención respondida durante la llamada."
            : "El requerimiento quedará abierto para su gestión y seguimiento."}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Atrás
          </button>

          <button
            type="submit"
            disabled={
              guardando ||
              catalogoNoDisponible ||
              (!esConsulta && esAnonimo)
            }
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando
              ? "Guardando…"
              : esConsulta
                ? "Registrar consulta"
                : "Registrar requerimiento"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}