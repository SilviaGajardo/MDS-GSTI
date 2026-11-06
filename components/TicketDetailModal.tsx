"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  Eye,
  X,
  Calendar,
  History,
  Send,
  MessageSquarePlus,
} from "lucide-react";

type Estado = "abierto" | "en_proceso" | "cerrado";

type ResultadoTransferencia =
  | "pendiente"
  | "exito"
  | "no_contestada"
  | "devuelta";

export interface Ticket {
  id: number | string;
  numero_ticket?: string;
  asunto?: string;
  subject?: string;
  detalles?: string | null;
  descripcion?: string | null;
  description?: string | null;
  ciudadano?: string;
  citizenName?: string;
  agente?: string | null;
  departamento?: string | null;
  department?: string;
  tipo_llamada?: string;
  ticketType?: string;
  estado?: string;
  status?: string;
  es_anonimo?: number | boolean;
  estado_transferencia?: ResultadoTransferencia | null;
  fecha_creacion?: string;
  fecha_cierre?: string | null;
}

interface HistorialItem {
  id: number;
  tipo_evento?: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string;
  fecha_registro: string;
  agente: string | null;
  departamento_anterior_nombre?: string | null;
  departamento_nuevo_nombre?: string | null;
}

interface RespuestaDetalle {
  success: boolean;
  ticket: Ticket;
  historial: HistorialItem[];
}

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

const ESTADOS: Record<
  Estado,
  { nombre: string; clase: string }
> = {
  abierto: {
    nombre: "Abierto",
    clase: "bg-amber-100 text-amber-800",
  },
  en_proceso: {
    nombre: "En proceso",
    clase: "bg-blue-100 text-blue-800",
  },
  cerrado: {
    nombre: "Cerrado",
    clase: "bg-emerald-100 text-emerald-800",
  },
};

const TRANSFERENCIAS: Record<ResultadoTransferencia, string> = {
  pendiente: "Pendiente de confirmar",
  exito: "Llamada transferida con éxito",
  no_contestada: "No contestada",
  devuelta: "Llamada vuelta a mesa de ayuda",
};

const EVENTOS: Record<string, string> = {
  creacion: "Creación de la atención",
  seguimiento: "Seguimiento",
  cambio_estado: "Cambio de estado",
  derivacion: "Derivación",
  anonimizacion: "Desvinculación del ciudadano",
};

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

function normalizarEstado(valor: unknown): Estado | null {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return estado === "abierto" ||
    estado === "en_proceso" ||
    estado === "cerrado"
    ? estado
    : null;
}

function esResultadoTransferencia(
  valor: unknown
): valor is ResultadoTransferencia {
  return (
    valor === "pendiente" ||
    valor === "exito" ||
    valor === "no_contestada" ||
    valor === "devuelta"
  );
}

function mostrarEstado(valor: string | null) {
  if (!valor) return "Inicio";

  const estado = normalizarEstado(valor);

  return estado ? ESTADOS[estado].nombre : valor;
}

function mostrarFecha(valor?: string | null) {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function leerDetalle(
  id: string,
  signal: AbortSignal
): Promise<RespuestaDetalle> {
  const respuesta = await fetch(
    `/api/tickets/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      signal,
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok || datos?.success !== true) {
    throw new Error(
      datos?.error ||
        datos?.message ||
        "No se pudo consultar el ticket."
    );
  }

  if (
    !datos.ticket ||
    String(datos.ticket.id) !== id ||
    !normalizarEstado(datos.ticket.estado) ||
    !Array.isArray(datos.historial)
  ) {
    throw new Error("El servidor devolvió un detalle inválido.");
  }

  const transferencia = datos.ticket.estado_transferencia;

  if (
    transferencia !== undefined &&
    transferencia !== null &&
    !esResultadoTransferencia(transferencia)
  ) {
    throw new Error(
      "El servidor devolvió un resultado de transferencia inválido."
    );
  }

  return datos;
}

export function TicketDetailModal({
  ticket,
  onClose,
  onTicketUpdated,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <ContenidoModal
      key={String(ticket.id)}
      ticket={ticket}
      onClose={onClose}
      onTicketUpdated={onTicketUpdated}
    />
  );
}

function ContenidoModal({
  ticket,
  onClose,
  onTicketUpdated,
}: {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated?: () => void;
}) {
  const id = String(ticket.id);

  const dialogo = useRef<HTMLDialogElement>(null);
  const guardandoRef = useRef(false);
  const controladorGuardado = useRef<AbortController | null>(null);

  const [fullTicket, setFullTicket] = useState<Ticket | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [intento, setIntento] = useState(0);

  const [nuevoEstado, setNuevoEstado] = useState<Estado>("abierto");
  const [comentario, setComentario] = useState("");
  const [llamadaTransferida, setLlamadaTransferida] = useState(false);
  const [resultadoTransferencia, setResultadoTransferencia] =
    useState<ResultadoTransferencia>("pendiente");

  useEffect(() => {
    const elemento = dialogo.current;

    if (elemento && !elemento.open) {
      elemento.showModal();
    }

    return () => {
      controladorGuardado.current?.abort();
      elemento?.close();
    };
  }, []);

  const aplicarDetalle = useCallback((datos: RespuestaDetalle) => {
    setFullTicket(datos.ticket);
    setHistorial(datos.historial);
    setNuevoEstado(
      normalizarEstado(datos.ticket.estado) || "abierto"
    );

    const transferencia =
      datos.ticket.estado_transferencia ?? null;

    setLlamadaTransferida(transferencia !== null);
    setResultadoTransferencia(transferencia || "pendiente");
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    setCargando(true);
    setError("");
    setMensajeExito("");
    setFullTicket(null);
    setHistorial([]);

    void leerDetalle(id, controlador.signal)
      .then((datos) => {
        if (!controlador.signal.aborted) {
          aplicarDetalle(datos);
        }
      })
      .catch((errorConsulta: unknown) => {
        if (controlador.signal.aborted) return;

        setError(
          errorConsulta instanceof Error
            ? errorConsulta.message
            : "No se pudo consultar el ticket."
        );
      })
      .finally(() => {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      });

    return () => controlador.abort();
  }, [id, intento, aplicarDetalle]);

  function cerrar() {
    if (!guardandoRef.current) {
      onClose();
    }
  }

  async function guardarAvance(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (guardandoRef.current || !fullTicket) return;

    const estadoActual = normalizarEstado(fullTicket.estado);
    const esRequerimiento =
      fullTicket.tipo_llamada === "requerimiento" ||
      fullTicket.ticketType === "requerimiento";

    if (
      !esRequerimiento ||
      !estadoActual ||
      estadoActual === "cerrado"
    ) {
      setError("Este ticket no admite modificaciones.");
      return;
    }

    if (!comentario.trim()) {
      setError("Ingrese una observación antes de guardar.");
      return;
    }

    const transferenciaActual =
      fullTicket.estado_transferencia ?? null;

    const transferenciaNueva = llamadaTransferida
      ? resultadoTransferencia
      : null;

    const cambioTransferencia =
      transferenciaNueva !== transferenciaActual;

    guardandoRef.current = true;
    setGuardando(true);
    setError("");
    setMensajeExito("");

    const controlador = new AbortController();
    controladorGuardado.current = controlador;

    let guardadoConfirmado = false;

    try {
      const respuesta = await fetch(
        `/api/tickets/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controlador.signal,
          body: JSON.stringify({
            estado_actual: estadoActual,
            estado: nuevoEstado,
            comentario: comentario.trim(),

            // Solo enviar la transferencia si fue modificada.
            ...(cambioTransferencia
              ? {
                  estado_transferencia_actual:
                    transferenciaActual,
                  estado_transferencia:
                    transferenciaNueva,
                }
              : {}),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || datos?.success !== true) {
        throw new Error(
          datos?.error ||
            datos?.message ||
            "No se pudo guardar el avance."
        );
      }

      guardadoConfirmado = true;
      setComentario("");
      setMensajeExito(
        "Cambios guardados y registrados en el historial."
      );

      const actualizado = await leerDetalle(
        id,
        controlador.signal
      );

      if (!controlador.signal.aborted) {
        aplicarDetalle(actualizado);
      }
    } catch (errorGuardado: unknown) {
      if (controlador.signal.aborted) return;

      if (guardadoConfirmado) {
        setFullTicket(null);
        setError(
          "Los cambios se guardaron, pero no se pudo recargar el detalle. Pulsa Recargar detalle."
        );
      } else {
        setError(
          errorGuardado instanceof Error
            ? errorGuardado.message
            : "No se pudo confirmar el guardado. Recarga el detalle antes de volver a enviarlo."
        );
      }
    } finally {
      guardandoRef.current = false;
      controladorGuardado.current = null;

      if (!controlador.signal.aborted) {
        setGuardando(false);

        if (guardadoConfirmado) {
          onTicketUpdated?.();
        }
      }
    }
  }

  const activeTicket = fullTicket || ticket;

  const estado = normalizarEstado(
    activeTicket.estado || activeTicket.status
  );

  const esRequerimiento =
    activeTicket.tipo_llamada === "requerimiento" ||
    activeTicket.ticketType === "requerimiento";

  const editable =
    !!fullTicket &&
    esRequerimiento &&
    estado !== null &&
    estado !== "cerrado";

  const esAnonimo =
    activeTicket.es_anonimo === true ||
    activeTicket.es_anonimo === 1;

  const numero =
    activeTicket.numero_ticket || `#${activeTicket.id}`;

  const descripcion =
    activeTicket.detalles ||
    activeTicket.descripcion ||
    activeTicket.description ||
    "Sin descripción adicional.";

  const transferenciaActual =
    activeTicket.estado_transferencia ?? null;

  const metadatos = [
    [
      "Ciudadano",
      activeTicket.ciudadano ||
        activeTicket.citizenName ||
        "Anónimo",
    ],
    [
      "Tipo de llamada / ticket",
      esRequerimiento ? "Requerimiento" : "Consulta",
    ],
    [
      "Departamento",
      activeTicket.departamento ||
        activeTicket.department ||
        "Sin departamento asignado",
    ],
    [
      "Agente responsable",
      activeTicket.agente || "Registro del sistema",
    ],
  ];

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-detalle-vecinal"
      onCancel={(evento) => {
        evento.preventDefault();
        cerrar();
      }}
      style={{
        margin: "auto",
        width: "min(576px, calc(100vw - 32px))",
        maxHeight: "90dvh",
      }}
      className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h2
          id="titulo-detalle-vecinal"
          className="flex items-center gap-2 text-base font-bold"
        >
          <Eye className="h-5 w-5 shrink-0 text-[#2888EC]" />
          Detalle del Ticket {numero}
        </h2>

        <button
          type="button"
          onClick={cerrar}
          disabled={guardando}
          aria-label="Cerrar detalle"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {mensajeExito && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {mensajeExito}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <p>{error}</p>

          {!guardando && !cargando && (
            <button
              type="button"
              onClick={() => setIntento((actual) => actual + 1)}
              className="mt-2 font-semibold underline"
            >
              Recargar detalle
            </button>
          )}
        </div>
      )}

      {cargando ? (
        <p
          role="status"
          className="py-12 text-center text-sm text-slate-500"
        >
          Cargando detalles del ticket…
        </p>
      ) : fullTicket ? (
        <div className="mt-4 space-y-5 text-sm">
          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <dt className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Tipo usuario
              </dt>
              <dd>
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {esAnonimo ? "Anónimo" : "Registrado"}
                </span>
              </dd>
            </div>

            {metadatos.map(([titulo, valor]) => (
              <div key={titulo} className="min-w-0">
                <dt className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  {titulo}
                </dt>
                <dd className="break-words font-medium">
                  {valor}
                </dd>
              </div>
            ))}

            <div>
              <dt className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Estado
              </dt>
              <dd>
                {estado && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADOS[estado].clase}`}
                  >
                    {ESTADOS[estado].nombre}
                  </span>
                )}
              </dd>
            </div>

            {esRequerimiento && (
              <div className="sm:col-span-2">
                <dt className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Llamada transferida
                </dt>
                <dd className="font-medium">
                  {transferenciaActual
                    ? TRANSFERENCIAS[transferenciaActual]
                    : "No"}
                </dd>
              </div>
            )}
          </dl>

          <section>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Asunto
            </h3>
            <p className="mt-1 break-words font-semibold">
              {activeTicket.asunto ||
                activeTicket.subject ||
                "Sin asunto"}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Descripción / Detalles
            </h3>
            <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50/50 p-3 leading-relaxed text-slate-700">
              {descripcion}
            </p>
          </section>

          {editable ? (
            <form
              onSubmit={guardarAvance}
              className="rounded-xl border border-blue-200 bg-blue-50/50 p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <MessageSquarePlus className="h-4 w-4 shrink-0 text-[#2888EC]" />
                Gestionar Requerimiento
              </h3>

              <fieldset
                disabled={guardando}
                className="mt-3 space-y-4"
              >
                <div>
                  <label
                    htmlFor="gestion-estado"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nuevo Estado *
                  </label>
                  <select
                    id="gestion-estado"
                    value={nuevoEstado}
                    onChange={(evento) =>
                      setNuevoEstado(
                        evento.target.value as Estado
                      )
                    }
                    className={CLASE_CAMPO}
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <label
                    htmlFor="gestion-transferida"
                    className="flex cursor-pointer items-center gap-2 font-medium"
                  >
                    <input
                      id="gestion-transferida"
                      type="checkbox"
                      checked={llamadaTransferida}
                      onChange={(evento) => {
                        const marcada = evento.target.checked;

                        setLlamadaTransferida(marcada);

                        if (
                          marcada &&
                          fullTicket.estado_transferencia == null
                        ) {
                          setResultadoTransferencia("pendiente");
                        }
                      }}
                      className="h-4 w-4"
                    />
                    Llamada transferida
                  </label>

                  {llamadaTransferida && (
                    <div className="mt-3">
                      <label
                        htmlFor="gestion-resultado"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Resultado de la llamada *
                      </label>
                      <select
                        id="gestion-resultado"
                        value={resultadoTransferencia}
                        onChange={(evento) =>
                          setResultadoTransferencia(
                            evento.target
                              .value as ResultadoTransferencia
                          )
                        }
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
                        <option value="devuelta">
                          Llamada vuelta a mesa de ayuda
                        </option>
                      </select>

                      <p className="mt-2 text-xs text-slate-500">
                        Puede actualizar este resultado sin cambiar
                        el estado del requerimiento.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="gestion-comentario"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Comentario / Avance de Gestión *
                  </label>
                  <textarea
                    id="gestion-comentario"
                    rows={3}
                    required
                    maxLength={4000}
                    value={comentario}
                    onChange={(evento) =>
                      setComentario(evento.target.value)
                    }
                    placeholder="Describa las acciones realizadas o el resultado de la llamada…"
                    className={CLASE_CAMPO}
                  />
                </div>

                {nuevoEstado === "cerrado" && (
                  <p className="text-xs text-slate-600">
                    Al cerrar el requerimiento quedará de solo lectura,
                    incluido el resultado de la transferencia.
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={guardando || !comentario.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2888EC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E72C6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {guardando ? "Guardando…" : "Guardar Avance"}
                  </button>
                </div>
              </fieldset>
            </form>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {esRequerimiento
                ? "Este requerimiento está cerrado y es de solo lectura."
                : "Esta consulta fue cerrada automáticamente al registrarse y es de solo lectura."}
            </div>
          )}

          <section className="border-t border-slate-200 pt-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600">
              <History className="h-4 w-4" />
              Historial de gestión ({historial.length})
            </h3>

            {!historial.length ? (
              <p className="mt-3 text-sm text-slate-500">
                No hay movimientos registrados.
              </p>
            ) : (
              <ol className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                {historial.map((movimiento) => (
                  <li
                    key={movimiento.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-blue-700">
                        {EVENTOS[movimiento.tipo_evento || ""] ||
                          "Movimiento registrado"}
                      </p>
                      <time className="text-xs text-slate-500">
                        {mostrarFecha(movimiento.fecha_registro)}
                      </time>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                      {movimiento.comentario}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Estado:{" "}
                      {mostrarEstado(movimiento.estado_anterior)}
                      {" → "}
                      {mostrarEstado(movimiento.estado_nuevo)}
                    </p>

                    {movimiento.tipo_evento === "derivacion" && (
                      <p className="mt-1 text-xs text-slate-500">
                        Departamento:{" "}
                        {movimiento.departamento_anterior_nombre ||
                          "Sin departamento"}
                        {" → "}
                        {movimiento.departamento_nuevo_nombre ||
                          "Sin departamento"}
                      </p>
                    )}

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {movimiento.agente || "Registro del sistema"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="space-y-1 text-xs text-slate-400">
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Creado el:{" "}
              {mostrarFecha(activeTicket.fecha_creacion)}
            </p>

            {activeTicket.fecha_cierre && (
              <p>
                Cerrado el:{" "}
                {mostrarFecha(activeTicket.fecha_cierre)}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={cerrar}
          disabled={guardando}
          className="rounded-lg bg-[#2888EC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E72C6] disabled:opacity-50"
        >
          Cerrar
        </button>
      </div>
    </dialog>
  );
}