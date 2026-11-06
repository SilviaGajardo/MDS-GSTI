"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle, Save, X } from "lucide-react";

type Estado = "abierto" | "en_proceso" | "cerrado";

type Ticket = {
    id: number;
    numero_ticket: string;
    asunto: string;
    detalles: string | null;
    sentido: "recibida" | "emitida";
    solicitante: string;
    correo_solicitante: string | null;
    destinatario: string | null;
    categoria: string;
    prioridad: string;
    estado: Estado;
    departamento: string | null;
    agente: string | null;
    fecha_creacion: string;
    fecha_cierre: string | null;
};

type Evento = {
    id: number;
    estado_anterior: string;
    estado_nuevo: string;
    comentario: string;
    fecha: string;
    agente: string | null;
};

type Props = {
    id: number;
    cerrar: () => void;
    actualizar: () => void;
};

const ESTADOS: Record<Estado, string> = {
    abierto: "Abierto",
    en_proceso: "En proceso",
    cerrado: "Cerrado",
};

const COLORES: Record<Estado, string> = {
    abierto: "bg-amber-100 text-amber-800",
    en_proceso: "bg-blue-100 text-blue-800",
    cerrado: "bg-emerald-100 text-emerald-800",
};

function nombreEstado(valor: string): string {
    return ESTADOS[valor as Estado] || valor;
}

function fechaTexto(valor: string | null): string {
    if (!valor) return "—";

    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime())
        ? "—"
        : fecha.toLocaleString("es-CL", {
              dateStyle: "short",
              timeStyle: "short",
          });
}

export default function ModalDetalleTI({
    id,
    cerrar,
    actualizar,
}: Props) {
    const dialogo = useRef<HTMLDialogElement>(null);
    const bloqueo = useRef(false);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [historial, setHistorial] = useState<Evento[]>([]);
    const [nuevoEstado, setNuevoEstado] = useState<Estado>("abierto");
    const [comentario, setComentario] = useState("");

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [errorCarga, setErrorCarga] = useState("");
    const [errorGuardar, setErrorGuardar] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const elemento = dialogo.current;

        if (elemento && !elemento.open) {
            elemento.showModal();
        }

        return () => elemento?.close();
    }, []);

    useEffect(() => {
        const controlador = new AbortController();

        setCargando(true);
        setErrorCarga("");

        void (async () => {
            try {
                const respuesta = await fetch(`/api/ti/tickets/${id}`, {
                    cache: "no-store",
                    signal: controlador.signal,
                });

                const datos = await respuesta.json();

                if (!respuesta.ok || datos?.ok !== true) {
                    throw new Error(
                        datos?.mensaje || "No se pudo cargar el ticket."
                    );
                }

                if (!datos.ticket || !Array.isArray(datos.historial)) {
                    throw new Error("El detalle recibido no es válido.");
                }

                if (!controlador.signal.aborted) {
                    setTicket(datos.ticket);
                    setHistorial(datos.historial);
                    setNuevoEstado(datos.ticket.estado);
                }
            } catch (error) {
                if (!controlador.signal.aborted) {
                    setErrorCarga(
                        error instanceof Error
                            ? error.message
                            : "No se pudo cargar el ticket."
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        })();

        return () => controlador.abort();
    }, [id, intento]);

    const cerrarModal = () => {
        if (!bloqueo.current) cerrar();
    };

    const guardar = async (evento: FormEvent<HTMLFormElement>) => {
        evento.preventDefault();

        if (
            bloqueo.current ||
            cargando ||
            errorCarga ||
            !ticket ||
            ticket.estado === "cerrado"
        ) {
            return;
        }

        const observacion = comentario.trim();

        if (!observacion || observacion.length > 4000) {
            setErrorGuardar(
                "Escribe una observación de entre 1 y 4000 caracteres."
            );
            return;
        }

        bloqueo.current = true;
        setGuardando(true);
        setErrorGuardar("");
        setMensaje("");

        try {
            const respuesta = await fetch(`/api/ti/tickets/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estado_actual: ticket.estado,
                    estado: nuevoEstado,
                    comentario: observacion,
                }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok || datos?.ok !== true) {
                // Si otra persona cambió el estado, consultamos el actual.
                if (respuesta.status === 409) {
                    setCargando(true);
                    setIntento((actual) => actual + 1);
                    actualizar();
                }

                throw new Error(
                    datos?.mensaje || "No se pudo guardar el seguimiento."
                );
            }

            setComentario("");
            setMensaje("Seguimiento guardado correctamente.");

            // Volvemos a consultar el detalle y el historial.
            setCargando(true);
            setIntento((actual) => actual + 1);

            // Actualizamos también el listado y sus tarjetas.
            actualizar();
        } catch (error) {
            setErrorGuardar(
                error instanceof Error
                    ? error.message
                    : "No se pudo confirmar el cambio. Recarga el detalle antes de volver a guardar."
            );
        } finally {
            bloqueo.current = false;
            setGuardando(false);
        }
    };

    return (
        <dialog
            ref={dialogo}
            aria-labelledby="titulo-detalle-ti"
            onCancel={(evento) => {
                evento.preventDefault();
                cerrarModal();
            }}
            style={{
                margin: "auto",
                width: "min(800px, calc(100vw - 32px))",
                maxHeight: "90dvh",
            }}
            className="rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50"
        >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Gestión de Servicios TI
                    </p>
                    <h2
                        id="titulo-detalle-ti"
                        className="mt-1 text-lg font-extrabold"
                    >
                        {ticket?.numero_ticket || "Detalle del ticket"}
                    </h2>
                </div>

                <button
                    type="button"
                    autoFocus
                    disabled={guardando}
                    onClick={cerrarModal}
                    aria-label="Cerrar detalle"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-6 p-6">
                {mensaje && (
                    <div
                        role="status"
                        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                    >
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {mensaje}
                    </div>
                )}

                {cargando && (
                    <p role="status" className="text-sm text-slate-500">
                        Cargando detalle…
                    </p>
                )}

                {errorCarga && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                        <p>{errorCarga}</p>
                        <button
                            type="button"
                            onClick={() => setIntento((actual) => actual + 1)}
                            className="mt-2 font-bold underline"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {ticket && (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${COLORES[ticket.estado]}`}
                            >
                                {ESTADOS[ticket.estado]}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                Prioridad:{" "}
                                {ticket.prioridad === "critica"
                                    ? "Crítica"
                                    : ticket.prioridad}
                            </span>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                Solicitud {ticket.sentido}
                            </span>
                        </div>

                        <div>
                            <h3 className="break-words text-xl font-extrabold">
                                {ticket.asunto}
                            </h3>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                                {ticket.detalles || "Sin descripción."}
                            </p>
                        </div>

                        <dl className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                            {[
                                ["Solicitante", ticket.solicitante],
                                ["Correo", ticket.correo_solicitante],
                                ["Categoría", ticket.categoria],
                                ["Departamento", ticket.departamento],
                                ["Destinatario", ticket.destinatario],
                                ["Registrado por", ticket.agente],
                                ["Creación", fechaTexto(ticket.fecha_creacion)],
                                ["Cierre", fechaTexto(ticket.fecha_cierre)],
                            ].map(([titulo, valor]) => (
                                <div key={titulo} className="min-w-0">
                                    <dt className="text-xs font-semibold text-slate-500">
                                        {titulo}
                                    </dt>
                                    <dd className="mt-1 break-words font-medium">
                                        {valor || "—"}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {ticket.estado !== "cerrado" ? (
                            <form
                                onSubmit={guardar}
                                className="rounded-xl border border-blue-200 bg-blue-50/40 p-4"
                            >
                                <h3 className="font-bold text-slate-800">
                                    Actualizar ticket
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Cambia el estado o agrega una observación.
                                    El movimiento quedará en el historial.
                                </p>

                                <fieldset
                                    disabled={
                                        guardando ||
                                        cargando ||
                                        Boolean(errorCarga)
                                    }
                                    className="mt-4 grid min-w-0 gap-4 border-0 p-0"
                                >
                                    <label className="text-xs font-bold text-slate-600">
                                        Estado
                                        <select
                                            value={nuevoEstado}
                                            onChange={(evento) =>
                                                setNuevoEstado(
                                                    evento.target.value as Estado
                                                )
                                            }
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800"
                                        >
                                            <option value="abierto">
                                                Abierto
                                            </option>
                                            <option value="en_proceso">
                                                En proceso
                                            </option>
                                            <option value="cerrado">
                                                Cerrado
                                            </option>
                                        </select>
                                    </label>

                                    <label className="text-xs font-bold text-slate-600">
                                        Observaciones *
                                        <textarea
                                            required
                                            maxLength={4000}
                                            rows={4}
                                            value={comentario}
                                            onChange={(evento) =>
                                                setComentario(
                                                    evento.target.value
                                                )
                                            }
                                            placeholder="Describe la gestión realizada o el motivo del cambio de estado..."
                                            className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"
                                        />
                                    </label>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-xs text-slate-500">
                                            {comentario.length}/4000 caracteres
                                        </span>

                                        <button
                                            type="submit"
                                            disabled={!comentario.trim()}
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#285ec4] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1e4a9e] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {guardando
                                                ? "Guardando…"
                                                : "Guardar cambios"}
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        ) : (
                            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                Este ticket está cerrado. Puedes consultar
                                sus datos y el historial.
                            </p>
                        )}

                        {errorGuardar && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                            >
                                <p>{errorGuardar}</p>
                                <button
                                    type="button"
                                    disabled={guardando || cargando}
                                    onClick={() => {
                                        setMensaje("");
                                        setIntento((actual) => actual + 1);
                                    }}
                                    className="mt-2 font-bold underline disabled:opacity-50"
                                >
                                    Recargar detalle
                                </button>
                            </div>
                        )}

                        <section>
                            <h3 className="mb-3 font-bold">
                                Historial del ticket
                            </h3>

                            {!historial.length ? (
                                <p className="text-sm text-slate-500">
                                    No hay movimientos registrados.
                                </p>
                            ) : (
                                <ol className="space-y-3">
                                    {historial.map((evento) => (
                                        <li
                                            key={evento.id}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-blue-700">
                                                    {evento.estado_anterior
                                                        ? `${nombreEstado(
                                                              evento.estado_anterior
                                                          )} → ${nombreEstado(
                                                              evento.estado_nuevo
                                                          )}`
                                                        : "Creación del ticket"}
                                                </span>

                                                <span className="text-[11px] text-slate-500">
                                                    {fechaTexto(evento.fecha)}
                                                </span>
                                            </div>

                                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                                                {evento.comentario}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                {evento.agente ||
                                                    "Agente no disponible"}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </>
                )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                    type="button"
                    disabled={guardando}
                    onClick={cerrarModal}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Cerrar
                </button>
            </div>
        </dialog>
    );
}