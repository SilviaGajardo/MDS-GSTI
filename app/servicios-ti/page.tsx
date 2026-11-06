"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModalDetalleTI from "@/components/servicios-ti/ModalDetalleTI";

import {
    FileText,
    AlertCircle,
    Clock,
    CheckCircle,
    Plus,
    Search,
    Filter,
    X,
    Users,
    Cpu,
    ArrowLeft,
    Eye,
    Ticket as TicketIcon,
} from "lucide-react";

type Estado = "abierto" | "en_proceso" | "cerrado";
type Filtro = Estado | "todos" | "activos";
type Prioridad = "baja" | "media" | "alta" | "critica";

type Categoria =
    | "Equipos"
    | "Redes y conectividad"
    | "Impresoras"
    | "Otro";

type TicketTI = {
    id: number;
    numero_ticket: string;
    asunto: string;
    categoria: Categoria;
    solicitante: string;
    correo_solicitante: string | null;
    sentido: "recibida" | "emitida";
    prioridad: Prioridad;
    estado: Estado;
    departamento_id: number | null;
    departamento: string | null;
    fecha_creacion: string;
    fecha_cierre: string | null;
};

type Estadisticas = {
    total: number;
    abiertos: number;
    en_proceso: number;
    cerrados: number;
};

type RespuestaListado = {
    ok: boolean;
    tickets: TicketTI[];
};

type RespuestaEstadisticas = {
    ok: boolean;
    estadisticas: Estadisticas;
};

const ESTADOS: Record<Estado, { nombre: string; clase: string }> = {
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

const TITULOS: Record<Filtro, string> = {
    activos: "Requerimientos TI Activos (Abiertos y En Proceso)",
    abierto: "Tickets TI en Estado Abierto",
    en_proceso: "Tickets TI En Proceso",
    cerrado: "Historial de Tickets TI Cerrados",
    todos: "Todos los Tickets TI",
};

const MODULOS = [
    {
        nombre: "MPH - Atención Vecinal",
        ruta: "/atencion-vecinal",
        Icono: Users,
    },
    {
        nombre: "MPH - Servicios TI",
        ruta: "/servicios-ti",
        Icono: Cpu,
    },
    {
        nombre: "MPH - Ticket Soporte",
        ruta: "/ticket-soporte",
        Icono: TicketIcon,
    },
];

function normalizar(valor: unknown): string {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function consultar<T>(
    ruta: string,
    signal: AbortSignal
): Promise<T> {
    const respuesta = await fetch(ruta, {
        cache: "no-store",
        signal,
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || datos?.ok !== true) {
        throw new Error(
            datos?.mensaje ||
                datos?.error ||
                "No se pudo completar la consulta."
        );
    }

    return datos as T;
}

function EtiquetaEstado({ estado }: { estado: Estado }) {
    const config = ESTADOS[estado];

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.clase}`}
        >
            {config.nombre}
        </span>
    );
}

export default function GestionServiciosTIPage() {
    const [tickets, setTickets] = useState<TicketTI[]>([]);

    const [stats, setStats] = useState<Estadisticas>({
        total: 0,
        abiertos: 0,
        en_proceso: 0,
        cerrados: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [intento, setIntento] = useState(0);

    const [filterState, setFilterState] = useState<Filtro>("activos");
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
        null
    );

    useEffect(() => {
        const controlador = new AbortController();

        setLoading(true);
        setError("");

        void Promise.all([
            consultar<RespuestaListado>(
                "/api/ti/tickets",
                controlador.signal
            ),
            consultar<RespuestaEstadisticas>(
                "/api/ti/tickets/estadisticas",
                controlador.signal
            ),
        ])
            .then(([listado, resumen]) => {
                if (controlador.signal.aborted) return;

                if (
                    !Array.isArray(listado.tickets) ||
                    !resumen.estadisticas
                ) {
                    throw new Error(
                        "El servidor devolvió un formato inválido."
                    );
                }

                setTickets(listado.tickets);
                setStats(resumen.estadisticas);
            })
            .catch((errorConsulta: unknown) => {
                if (controlador.signal.aborted) return;

                setError(
                    errorConsulta instanceof Error
                        ? errorConsulta.message
                        : "No se pudieron cargar los tickets."
                );
            })
            .finally(() => {
                if (!controlador.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controlador.abort();
    }, [intento]);

    const palabras = normalizar(searchTerm)
        .split(/\s+/)
        .filter(Boolean);

    const filteredTickets = tickets.filter((ticket) => {
        const coincideEstado =
            filterState === "todos" ||
            (filterState === "activos"
                ? ticket.estado === "abierto" ||
                  ticket.estado === "en_proceso"
                : ticket.estado === filterState);

        if (!coincideEstado) return false;

        const texto = normalizar(
            [
                ticket.id,
                ticket.numero_ticket,
                ticket.solicitante,
                ticket.correo_solicitante,
                ticket.asunto,
                ticket.categoria,
                ticket.departamento,
                ticket.sentido,
                ticket.prioridad,
            ].join(" ")
        );

        return palabras.every((palabra) => texto.includes(palabra));
    });

    const tarjetas = [
        {
            filtro: "todos" as const,
            titulo: "Total de Tickets",
            valor: stats.total,
            Icono: FileText,
            numero: "text-slate-800",
            icono: "bg-slate-100 text-slate-600",
            seleccion:
                "ring-2 ring-[#285ec4] border-[#285ec4] bg-blue-50/20",
        },
        {
            filtro: "abierto" as const,
            titulo: "Abiertos",
            valor: stats.abiertos,
            Icono: AlertCircle,
            numero: "text-amber-600",
            icono: "bg-amber-100 text-amber-600",
            seleccion:
                "ring-2 ring-amber-400 border-amber-400 bg-amber-50/20",
        },
        {
            filtro: "en_proceso" as const,
            titulo: "En Proceso",
            valor: stats.en_proceso,
            Icono: Clock,
            numero: "text-blue-600",
            icono: "bg-blue-100 text-blue-600",
            seleccion:
                "ring-2 ring-blue-400 border-blue-400 bg-blue-50/20",
        },
        {
            filtro: "cerrado" as const,
            titulo: "Cerrados",
            valor: stats.cerrados,
            Icono: CheckCircle,
            numero: "text-emerald-600",
            icono: "bg-emerald-100 text-emerald-600",
            seleccion:
                "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50/20",
        },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Menú lateral */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="flex items-center gap-3 bg-[#285ec4] p-4 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-xs font-extrabold tracking-wider">
                        MPH
                    </div>

                    <div className="leading-tight">
                        <span className="block text-xs font-black">
                            MPH - Mi Padre Hurtado
                        </span>

                        <span className="text-[10px] font-medium text-blue-100 opacity-80">
                            Plataforma de Gestión
                        </span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-3 text-xs text-slate-600">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-800"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al Hub
                    </Link>

                    <div className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Módulos de Atención
                    </div>

                    {MODULOS.map((modulo) => {
                        const activo =
                            modulo.ruta === "/servicios-ti";

                        return (
                            <Link
                                key={modulo.ruta}
                                href={modulo.ruta}
                                aria-current={
                                    activo ? "page" : undefined
                                }
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                                    activo
                                        ? "border-l-4 border-[#285ec4] bg-blue-50 font-semibold text-blue-700"
                                        : "font-medium text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <modulo.Icono
                                        className={`h-4 w-4 shrink-0 ${
                                            activo
                                                ? "text-blue-600"
                                                : "text-slate-400"
                                        }`}
                                    />

                                    <span>{modulo.nombre}</span>
                                </span>

                                <span
                                    className={
                                        activo
                                            ? "text-blue-600"
                                            : "text-slate-400"
                                    }
                                >
                                    &rsaquo;
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Área principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 bg-[#285ec4] px-6 py-3 text-white shadow-sm">
                    <h1 className="text-base font-bold tracking-wide">
                        Sistema Gestión Interna Municipal | MPH - Mi Padre
                        Hurtado
                    </h1>

                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-white">
                            Versión Demo
                        </span>

                        <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                            Silvia Gajardo
                        </div>
                    </div>
                </header>

                {/* Cabecera del módulo */}
                <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-[#285ec4]">
                            <Cpu className="h-6 w-6" />
                        </div>

                        <div>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                Módulo 2
                            </span>

                            <h2 className="mt-1 text-lg font-black leading-tight text-slate-800">
                                MPH - Gestión de Servicios TI
                            </h2>

                            <p className="text-xs text-slate-500">
                                Soporte técnico, infraestructura, desarrollo y
                                requerimientos de sistemas
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/servicios-ti/nuevo"
                        className="flex items-center gap-2.5 rounded-xl bg-[#285ec4] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#1e4a9e] hover:shadow-lg"
                    >
                        <Plus className="h-5 w-5 stroke-[2.5]" />
                        <span>+ Ir a Crear Ticket TI</span>
                    </Link>
                </div>

                <main className="overflow-y-auto p-4 sm:p-6">
                    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                            >
                                <p>{error}</p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIntento((actual) => actual + 1)
                                    }
                                    disabled={loading}
                                    className="mt-2 font-bold underline disabled:opacity-50"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {/* Tarjetas de estadísticas */}
                        <section>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg font-bold text-slate-800">
                                    Estadísticas y Filtros de Estado
                                </h2>

                                <span className="text-xs text-slate-400">
                                    Haz clic en una tarjeta para filtrar por
                                    estado
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {tarjetas.map((tarjeta) => (
                                    <button
                                        key={tarjeta.filtro}
                                        type="button"
                                        aria-pressed={
                                            filterState === tarjeta.filtro
                                        }
                                        onClick={() =>
                                            setFilterState(tarjeta.filtro)
                                        }
                                        className={`group relative flex items-center justify-between overflow-hidden rounded-xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                                            filterState === tarjeta.filtro
                                                ? tarjeta.seleccion
                                                : "border-slate-200 bg-white"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                {tarjeta.titulo}
                                            </p>

                                            <p
                                                className={`mt-1 text-3xl font-extrabold ${tarjeta.numero}`}
                                            >
                                                {loading
                                                    ? "…"
                                                    : error
                                                      ? "—"
                                                      : tarjeta.valor}
                                            </p>
                                        </div>

                                        <div
                                            className={`rounded-xl p-3 ${tarjeta.icono}`}
                                        >
                                            <tarjeta.Icono className="h-6 w-6" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Búsqueda y listado */}
                        <section className="space-y-4 pt-2">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        {TITULOS[filterState]}
                                    </h2>

                                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#285ec4]">
                                        {loading || error
                                            ? "—"
                                            : filteredTickets.length}
                                    </span>
                                </div>

                                {filterState !== "activos" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilterState("activos")
                                        }
                                        className="text-xs font-medium text-[#285ec4] hover:underline"
                                    >
                                        &larr; Volver a Requerimientos Activos
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row">
                                <div className="relative w-full md:w-2/3">
                                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />

                                    <input
                                        type="search"
                                        aria-label="Buscar tickets TI"
                                        placeholder="Buscar por N° ticket, solicitante, asunto o departamento..."
                                        value={searchTerm}
                                        onChange={(evento) =>
                                            setSearchTerm(
                                                evento.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#285ec4]"
                                    />

                                    {searchTerm && (
                                        <button
                                            type="button"
                                            aria-label="Limpiar búsqueda"
                                            onClick={() =>
                                                setSearchTerm("")
                                            }
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex w-full items-center gap-2 md:w-auto">
                                    <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />

                                    <select
                                        aria-label="Filtrar por estado"
                                        value={filterState}
                                        onChange={(evento) =>
                                            setFilterState(
                                                evento.target.value as Filtro
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#285ec4] md:w-auto"
                                    >
                                        <option value="activos">
                                            Estado: Requerimientos Activos
                                        </option>
                                        <option value="todos">
                                            Estado: Todos los Tickets
                                        </option>
                                        <option value="abierto">
                                            Estado: Abiertos
                                        </option>
                                        <option value="en_proceso">
                                            Estado: En Proceso
                                        </option>
                                        <option value="cerrado">
                                            Estado: Cerrados
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {!loading &&
                                !error &&
                                stats.total > tickets.length && (
                                    <p className="text-xs text-slate-500">
                                        Se muestran los últimos{" "}
                                        {tickets.length} tickets. La búsqueda
                                        y los filtros se aplican a esta lista;
                                        las tarjetas cuentan todos los
                                        registros.
                                    </p>
                                )}

                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full min-w-[800px] text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-100 text-[11px] uppercase text-slate-600">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                N° Ticket
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Solicitud
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Solicitante
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Asunto
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Departamento
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Estado
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3"
                                            >
                                                Detalle
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-slate-500"
                                                    role="status"
                                                >
                                                    Cargando tickets…
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-slate-500"
                                                >
                                                    No se pudo cargar el
                                                    listado.
                                                </td>
                                            </tr>
                                        ) : !filteredTickets.length ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-10 text-center text-slate-400"
                                                >
                                                    No hay tickets que
                                                    coincidan con los filtros.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTickets.map((ticket) => (
                                                <tr
                                                    key={ticket.id}
                                                    className="text-slate-700 hover:bg-slate-50"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 font-bold text-[#285ec4]">
                                                        {ticket.numero_ticket}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {ticket.sentido ===
                                                        "emitida"
                                                            ? "Emitida"
                                                            : "Recibida"}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {ticket.solicitante ||
                                                            "—"}
                                                    </td>

                                                    <td className="max-w-xs break-words px-4 py-3 font-medium">
                                                        {ticket.asunto}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {ticket.departamento ||
                                                            "Sin departamento"}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <EtiquetaEstado
                                                            estado={
                                                                ticket.estado
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            aria-label={`Ver detalle del ticket ${ticket.numero_ticket}`}
                                                            onClick={() =>
                                                                setSelectedTicketId(
                                                                    ticket.id
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {/* Detalle y seguimiento */}
            {selectedTicketId !== null && (
                <ModalDetalleTI
                    key={selectedTicketId}
                    id={selectedTicketId}
                    cerrar={() => setSelectedTicketId(null)}
                    actualizar={() =>
                        setIntento((actual) => actual + 1)
                    }
                />
            )}
        </div>
    );
}