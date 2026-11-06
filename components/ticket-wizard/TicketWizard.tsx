"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle } from "lucide-react";
import type { Citizen } from "@/lib/types";
import { useTickets } from "@/hooks/useTickets";
import { Step1SearchCitizen } from "./Step1SearchCitizen";
import { Step2ARegisterCitizen } from "./Step2ARegisterCitizen";
import { Step3CreateTicket } from "./Step3CreateTicket";

type Paso = "type" | "search" | "register" | "create" | "success";
type TipoAtencion = "consulta" | "requerimiento";

type DatosAtencion = {
  subject: string;
  description: string;
  department?: string;
  area?: string;
  staff?: string;
  attentionMode?: "normal" | "llamada_transferida";
  callOutcome?:
    | "pendiente"
    | "exito"
    | "no_contestada"
    | "vuelta_mesa_ayuda";
  pendingInformation?: boolean;
};

type CiudadanoConDatos = Citizen & {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
};

type TicketCreado = {
  id: number | string;
  numero_ticket: string;
  estado: string;
};

export function TicketWizard() {
  const { citizens, addCitizen, createTicket } = useTickets();

  const [step, setStep] = useState<Paso>("type");
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [ticketType, setTicketType] = useState<TipoAtencion | null>(null);
  const [createdTicket, setCreatedTicket] = useState<TicketCreado | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [guardando, setGuardando] = useState(false);

  const operacionEnCurso = useRef(false);

  function seleccionarTipo(tipo: TipoAtencion) {
    setTicketType(tipo);
    setSelectedCitizen(null);
    setErrorMessage("");
    setStep("search");
  }

  function handleCitizenFound(citizen: Citizen) {
    setSelectedCitizen(citizen);
    setErrorMessage("");
    setStep("create");
  }

  function handleAnonymous() {
    if (ticketType !== "consulta") return;

    setSelectedCitizen({
      id: `anon-${Date.now()}`,
      name: "Anónimo",
    });
    setErrorMessage("");
    setStep("create");
  }

  async function handleRegisterCitizen(citizen: Citizen) {
    if (operacionEnCurso.current) return;

    operacionEnCurso.current = true;
    setGuardando(true);
    setErrorMessage("");

    try {
      const registrado = await addCitizen(citizen);

      if (!registrado?.id) {
        throw new Error("No se pudo confirmar el registro del ciudadano.");
      }

      setSelectedCitizen(registrado);
      setStep("create");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar al ciudadano."
      );
    } finally {
      operacionEnCurso.current = false;
      setGuardando(false);
    }
  }

  async function handleCreateTicket(data: DatosAtencion) {
    if (operacionEnCurso.current) return;

    if (!selectedCitizen || !ticketType) {
      setErrorMessage("Seleccione un ciudadano o atienda como anónimo.");
      return;
    }

    const esConsulta = ticketType === "consulta";
    const esAnonimo = String(selectedCitizen.id).startsWith("anon-");

    if (esAnonimo && !esConsulta) {
      setErrorMessage("Para un requerimiento debe identificar al ciudadano.");
      return;
    }

    const asunto = data.subject.trim();
    const detalles = data.description.trim() || asunto;

    if (asunto.length > 50) {
      setErrorMessage("El asunto admite hasta 50 caracteres.");
      return;
    }

    if (detalles.length > 200) {
      setErrorMessage("La descripción admite hasta 200 caracteres.");
      return;
    }

    operacionEnCurso.current = true;
    setGuardando(true);
    setErrorMessage("");

    try {
      const ciudadano = selectedCitizen as CiudadanoConDatos;
      const esTransferida =
        !esConsulta && data.attentionMode === "llamada_transferida";

      const resultadoLlamada = esTransferida
        ? data.callOutcome === "vuelta_mesa_ayuda"
          ? "devuelta"
          : data.callOutcome ?? "pendiente"
        : null;

      const payload = {
        ciudadano_id: esAnonimo ? null : selectedCitizen.id,
        isAnonymous: esAnonimo,

        nombre: esAnonimo ? null : ciudadano.nombre || ciudadano.name || "",
        apellido: esAnonimo ? null : ciudadano.apellido || "",
        telefono: esAnonimo
          ? null
          : ciudadano.telefono || ciudadano.phone || null,
        correo: esAnonimo
          ? null
          : ciudadano.correo || ciudadano.email || null,

        tipo_llamada: esConsulta ? "consulta_rapida" : "requerimiento",
        asunto,
        detalles,
        area: esConsulta ? undefined : data.area?.trim(),
        departamento_id: data.department || null,

        es_transferida: esTransferida,
        resultado_llamada: resultadoLlamada,
        estado_transferencia: resultadoLlamada,
        pendiente_informacion: !esConsulta && !!data.pendingInformation,
      };

      const resultado = await createTicket(payload);

      if (!resultado?.id || !resultado?.numero_ticket) {
        throw new Error(
          "No se recibió la confirmación completa. Revisa el listado antes de volver a registrar la atención."
        );
      }

      setCreatedTicket({
        id: resultado.id,
        numero_ticket: resultado.numero_ticket,
        estado: resultado.estado,
      });

      setStep("success");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la atención."
      );
    } finally {
      operacionEnCurso.current = false;
      setGuardando(false);
    }
  }

  function handleBack() {
    if (operacionEnCurso.current) return;

    setErrorMessage("");

    if (step === "register" || step === "create") {
      setSelectedCitizen(null);
      setStep("search");
    } else if (step === "search") {
      setStep("type");
    }
  }

  function nuevaAtencion() {
    setSelectedCitizen(null);
    setTicketType(null);
    setCreatedTicket(null);
    setErrorMessage("");
    setStep("type");
  }

  if (step === "success" && createdTicket) {
    const estadoNombre =
      createdTicket.estado === "cerrado"
        ? "Cerrado"
        : createdTicket.estado === "en_proceso"
          ? "En proceso"
          : "Abierto";

    return (
      <div
        role="status"
        className="rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm"
      >
        <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" />

        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          {ticketType === "consulta"
            ? "¡Consulta registrada!"
            : "¡Requerimiento registrado!"}
        </h2>

        <p className="mt-3 text-sm text-slate-600">
          Número de atención
        </p>

        <p className="mt-2 text-2xl font-extrabold text-blue-700">
          {createdTicket.numero_ticket}
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Estado: <strong>{estadoNombre}</strong>
        </p>

        {ticketType === "consulta" && (
          <p className="mt-3 text-sm text-slate-600">
            La consulta quedó registrada como una atención respondida
            durante la llamada.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={nuevaAtencion}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Registrar otra atención
          </button>

          <Link
            href="/atencion-vecinal"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver a Atención Vecinal
          </Link>
        </div>

        {createdTicket.estado === "cerrado" && (
          <p className="mt-4 text-xs text-slate-500">
            Puedes encontrar esta atención en el filtro Cerrados o Todos
            los tickets.
          </p>
        )}
      </div>
    );
  }

  const pasoActual = step === "type" ? 0 : step === "search" ? 1 : 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {guardando ? (
          <span role="status" className="text-sm text-muted-foreground">
            Guardando, espera un momento…
          </span>
        ) : (
          <Link
            href="/atencion-vecinal"
            className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Atención Vecinal
          </Link>
        )}

        <div
          className="flex gap-2"
          aria-label={`Paso ${pasoActual + 1} de 3`}
        >
          {[0, 1, 2].map((indice) => (
            <span
              key={indice}
              className={`h-2 w-2 rounded-full ${
                indice <= pasoActual ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <fieldset disabled={guardando} className="min-w-0">
          {step === "type" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Nueva atención telefónica
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Seleccione el tipo de atención que desea registrar.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => seleccionarTipo("consulta")}
                  className="rounded-lg border-2 border-transparent bg-blue-50 p-5 text-left hover:border-blue-300"
                >
                  <span className="font-semibold text-blue-900">
                    Consulta
                  </span>
                  <p className="mt-1 text-sm text-blue-700">
                    Pregunta breve respondida durante la llamada.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarTipo("requerimiento")}
                  className="rounded-lg border-2 border-transparent bg-orange-50 p-5 text-left hover:border-orange-300"
                >
                  <span className="font-semibold text-orange-900">
                    Requerimiento
                  </span>
                  <p className="mt-1 text-sm text-orange-700">
                    Solicitud que requiere gestión o derivación.
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === "search" && (
            <Step1SearchCitizen
              citizens={citizens}
              onCitizenFound={handleCitizenFound}
              onNotFound={() => {
                setErrorMessage("");
                setStep("register");
              }}
              onAnonymous={handleAnonymous}
              onBack={handleBack}
              allowAnonymous={ticketType === "consulta"}
            />
          )}

          {step === "register" && (
            <Step2ARegisterCitizen
              onRegister={handleRegisterCitizen}
              onBack={handleBack}
            />
          )}

          {step === "create" && selectedCitizen && ticketType && (
            <Step3CreateTicket
              citizen={selectedCitizen}
              ticketType={ticketType}
              onSubmit={handleCreateTicket}
              onBack={handleBack}
            />
          )}
        </fieldset>
      </div>
    </div>
  );
}