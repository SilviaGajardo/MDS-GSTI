
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle,
    Cpu,
    FileText,
    Send,
} from "lucide-react";

type Departamento = {
    id: number;
    nombre: string;
};

type Sentido = "recibida" | "emitida";

type TicketCreado = {
    id: number;
    numero_ticket: string;
    estado: string;
    correo?: {
        estado: "aceptado" | "no_solicitado" | "no_confirmado";
        mensaje: string;
    };
};

const CAMPO =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

const ETIQUETA = "block text-xs font-bold text-slate-600";

export default function NuevoTicketTIPage() {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [intento, setIntento] = useState(0);

    const [sentido, setSentido] = useState<Sentido>("recibida");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [creado, setCreado] = useState<TicketCreado | null>(null);

    // Estados para los campos con contador
    const [asunto, setAsunto] = useState("");
    const [detalles, setDetalles] = useState("");

    const bloqueo = useRef(false);

    useEffect(() => {
        const controlador = new AbortController();

        setCargando(true);
        setErrorCarga("");

        void (async () => {
            try {
                const respuesta = await fetch("/api/ti/departamentos", {
                    cache: "no-store",
                    signal: controlador.signal,
                });

                const datos = await respuesta.json();

                if (!respuesta.ok || datos?.ok !== true) {
                    throw new Error(
                        datos?.mensaje ||
                            "No se pudieron cargar los departamentos."
                    );
                }

                if (!Array.isArray(datos.departamentos)) {
                    throw new Error(
                        "El servidor devolvió un catálogo inválido."
                    );
                }

                if (!controlador.signal.aborted) {
                    setDepartamentos(datos.departamentos);
                }
            } catch (errorConsulta) {
                if (!controlador.signal.aborted) {
                    setErrorCarga(
                        errorConsulta instanceof Error
                            ? errorConsulta.message
                            : "No se pudieron cargar los departamentos."
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        })();

        return () => controlador.abort();
    }, [intento]);

    const guardar = async (evento: FormEvent<HTMLFormElement>) => {
        evento.preventDefault();

        if (bloqueo.current || cargando || errorCarga) return;

        const formulario = new FormData(evento.currentTarget);

        const datos = {
            sentido,
            asunto: String(formulario.get("asunto") || "").trim(),
            detalles: String(formulario.get("detalles") || "").trim(),
            categoria: String(formulario.get("categoria") || ""),
            solicitante: String(
                formulario.get("solicitante") || ""
            ).trim(),
            correo_solicitante: String(
                formulario.get("correo_solicitante") || ""
            ).trim(),
            destinatario: String(
                formulario.get("destinatario") || ""
            ).trim(),
            departamento_id: Number(formulario.get("departamento_id")),
            prioridad: String(formulario.get("prioridad") || "media"),
        };

        setError("");

        if (!datos.asunto || !datos.detalles || !datos.solicitante) {
            setError("Completa el asunto, la descripción y el solicitante.");
            return;
        }

        if (datos.asunto.length > 50) {
            setError("El asunto admite un máximo de 50 caracteres.");
            return;
        }

        if (datos.detalles.length > 200) {
            setError("La descripción admite un máximo de 200 caracteres.");
            return;
        }

        if (
            !Number.isSafeInteger(datos.departamento_id) ||
            !departamentos.some(
                (departamento) =>
                    departamento.id === datos.departamento_id
            )
        ) {
            setError("Selecciona un departamento disponible.");
            return;
        }

        if (sentido === "emitida" && !datos.destinatario) {
            setError("Indica a quién se dirige la solicitud.");
            return;
        }

        bloqueo.current = true;
        setGuardando(true);

        try {
            const respuesta = await fetch("/api/ti/tickets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(datos),
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || resultado?.ok !== true) {
                throw new Error(
                    resultado?.mensaje || "No se pudo crear el ticket."
                );
            }

            if (
                !resultado.ticket?.id ||
                !resultado.ticket?.numero_ticket
            ) {
                throw new Error(
                    "No se recibió la confirmación completa. Revisa el listado antes de volver a enviar."
                );
            }

            setCreado({
                ...resultado.ticket,
                correo: resultado.correo,
            });
        } catch (errorGuardar) {
            setError(
                errorGuardar instanceof Error
                    ? errorGuardar.message
                    : "No se pudo confirmar la creación. Revisa el listado antes de volver a enviar."
            );
        } finally {
            bloqueo.current = false;
            setGuardando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <header className="bg-[#285ec4] px-6 py-4 text-white shadow-sm">
                <div className="mx-auto flex max-w-4xl items-center gap-3">
                    <Cpu className="h-6 w-6 shrink-0" />

                    <div>
                        <p className="text-sm font-extrabold">
                            MPH - Gestión de Servicios TI
                        </p>
                        <p className="text-xs text-blue-100">
                            Registro de requerimientos
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                {!guardando && (
                    <Link
                        href="/servicios-ti"
                        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Servicios TI
                    </Link>
                )}

                {creado ? (
                    <section
                        aria-labelledby="titulo-exito"
                        className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"
                    >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle className="h-9 w-9" />
                        </div>

                        <h1
                            id="titulo-exito"
                            role="status"
                            className="text-xl font-extrabold text-slate-800"
                        >
                            ¡Ticket creado correctamente!
                        </h1>

                        <p className="mt-3 text-sm text-slate-500">
                            Tu solicitud quedó registrada con el número:
                        </p>

                        <p className="mt-3 text-2xl font-extrabold text-[#285ec4]">
                            {creado.numero_ticket}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                            Estado inicial: Abierto
                        </p>

                        {creado.correo && (
                            <p
                                className={`mx-auto mt-4 max-w-lg rounded-lg px-4 py-3 text-sm ${
                                    creado.correo.estado === "aceptado"
                                        ? "bg-emerald-50 text-emerald-800"
                                        : creado.correo.estado === "no_confirmado"
                                          ? "bg-amber-50 text-amber-800"
                                          : "bg-slate-50 text-slate-600"
                                }`}
                            >
                                {creado.correo.mensaje}
                            </p>
                        )}

                        <Link
                            href="/servicios-ti"
                            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#285ec4] px-6 py-3 text-sm font-bold text-white hover:bg-[#1e4a9e]"
                        >
                            Ir al listado de tickets
                        </Link>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
                            <div className="rounded-xl bg-blue-50 p-3 text-[#285ec4]">
                                <FileText className="h-6 w-6" />
                            </div>

                            <div>
                                <h1 className="text-lg font-extrabold">
                                    Crear Ticket TI
                                </h1>
                                <p className="mt-1 text-xs text-slate-500">
                                    Los campos marcados con * son obligatorios.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={guardar} className="p-6">
                            {errorCarga && (
                                <div
                                    role="alert"
                                    className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                                >
                                    <p>{errorCarga}</p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIntento((actual) => actual + 1)
                                        }
                                        className="mt-2 font-bold underline"
                                    >
                                        Reintentar carga
                                    </button>
                                </div>
                            )}

                            {cargando && (
                                <p
                                    role="status"
                                    className="mb-5 text-sm text-slate-500"
                                >
                                    Cargando departamentos…
                                </p>
                            )}

                            <fieldset
                                disabled={guardando}
                                className="m-0 grid min-w-0 gap-5 border-0 p-0"
                            >
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className={ETIQUETA}>
                                        Tipo de solicitud *
                                        <select
                                            name="sentido"
                                            value={sentido}
                                            onChange={(evento) =>
                                                setSentido(
                                                    evento.target.value as Sentido
                                                )
                                            }
                                            className={CAMPO}
                                        >
                                            <option value="recibida">
                                                Recibida por TI
                                            </option>
                                            <option value="emitida">
                                                Emitida por TI
                                            </option>
                                        </select>
                                    </label>

                                    <label className={ETIQUETA}>
                                        Prioridad *
                                        <select
                                            name="prioridad"
                                            defaultValue="media"
                                            required
                                            className={CAMPO}
                                        >
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="critica">
                                                Crítica
                                            </option>
                                        </select>
                                    </label>
                                </div>

                                <p className="-mt-2 text-xs leading-relaxed text-slate-500">
                                    {sentido === "recibida"
                                        ? "Registra un requerimiento que una persona o área solicita al equipo TI."
                                        : "Registra un requerimiento que el equipo TI dirige a otra persona, área o proveedor."}
                                </p>

                                <label className={ETIQUETA}>
                                    Asunto *
                                    <input
                                        name="asunto"
                                        required
                                        maxLength={50}
                                        value={asunto}
                                        onChange={(evento) =>
                                            setAsunto(evento.target.value)
                                        }
                                        placeholder="Resumen del requerimiento"
                                        className={CAMPO}
                                    />
                                    <div className="mt-1 flex justify-end">
                                        <span
                                            className={`text-xs ${
                                                asunto.length >= 50
                                                    ? "font-bold text-red-600"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            {asunto.length}/50 caracteres
                                        </span>
                                    </div>
                                </label>

                                <label className={ETIQUETA}>
                                    Categoría *
                                    <select
                                        name="categoria"
                                        required
                                        defaultValue=""
                                        className={CAMPO}
                                    >
                                        <option value="" disabled>
                                            Selecciona una categoría
                                        </option>
                                        <option value="Equipos">
                                            Equipos
                                        </option>
                                        <option value="Redes y conectividad">
                                            Redes y conectividad
                                        </option>
                                        <option value="Impresoras">
                                            Impresoras
                                        </option>
                                        <option value="Otro">
                                            Otro
                                        </option>
                                    </select>
                                </label>

                                <label className={ETIQUETA}>
                                    Descripción del requerimiento *
                                    <textarea
                                        name="detalles"
                                        required
                                        maxLength={200}
                                        rows={5}
                                        value={detalles}
                                        onChange={(evento) =>
                                            setDetalles(evento.target.value)
                                        }
                                        placeholder="Explica qué se necesita, dónde ocurre y los antecedentes relevantes..."
                                        className={`${CAMPO} resize-y`}
                                    />
                                    <div className="mt-1 flex justify-end">
                                        <span
                                            className={`text-xs ${
                                                detalles.length >= 200
                                                    ? "font-bold text-red-600"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            {detalles.length}/200 caracteres
                                        </span>
                                    </div>
                                </label>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className={ETIQUETA}>
                                        Solicitante *
                                        <input
                                            name="solicitante"
                                            required
                                            maxLength={150}
                                            placeholder="Nombre de quien solicita"
                                            className={CAMPO}
                                        />
                                    </label>

                                    <label className={ETIQUETA}>
                                        Correo del solicitante
                                        <input
                                            name="correo_solicitante"
                                            type="email"
                                            maxLength={150}
                                            placeholder="nombre@ejemplo.cl"
                                            className={CAMPO}
                                        />
                                    </label>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className={ETIQUETA}>
                                        Departamento asociado *
                                        <select
                                            name="departamento_id"
                                            defaultValue=""
                                            required
                                            disabled={
                                                cargando ||
                                                Boolean(errorCarga) ||
                                                !departamentos.length
                                            }
                                            className={CAMPO}
                                        >
                                            <option value="" disabled>
                                                Selecciona un departamento
                                            </option>

                                            {departamentos.map(
                                                (departamento) => (
                                                    <option
                                                        key={departamento.id}
                                                        value={departamento.id}
                                                    >
                                                        {departamento.nombre}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>

                                    <label className={ETIQUETA}>
                                        Destinatario
                                        {sentido === "emitida" ? " *" : ""}
                                        <input
                                            name="destinatario"
                                            required={sentido === "emitida"}
                                            maxLength={150}
                                            placeholder={
                                                sentido === "emitida"
                                                    ? "Persona, área o proveedor"
                                                    : "Equipo TI o persona destinataria"
                                            }
                                            className={CAMPO}
                                        />
                                    </label>
                                </div>

                                {!cargando &&
                                    !errorCarga &&
                                    !departamentos.length && (
                                        <p
                                            role="alert"
                                            className="text-sm text-amber-800"
                                        >
                                            No hay departamentos vigentes
                                            disponibles para registrar tickets.
                                        </p>
                                    )}

                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                                    >
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.location.assign(
                                                "/servicios-ti"
                                            )
                                        }
                                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            guardando ||
                                            cargando ||
                                            Boolean(errorCarga) ||
                                            !departamentos.length
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#285ec4] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1e4a9e] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                        {guardando
                                            ? "Registrando…"
                                            : "Crear ticket"}
                                    </button>
                                </div>
                            </fieldset>

                            {guardando && (
                                <p
                                    role="status"
                                    className="mt-4 text-right text-xs text-slate-500"
                                >
                                    Registrando la solicitud. Espera la
                                    confirmación antes de salir.
                                </p>
                            )}
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
}
