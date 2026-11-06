"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle,
    Cpu,
    FileText,
    Plus,
    Send,
    Ticket as TicketIcon,
    Users,
} from "lucide-react";

type Departamento = {
    id: number;
    nombre: string;
};

type Confirmacion = {
    numero_ticket: string;
    correo?: {
        estado: "aceptado" | "no_solicitado" | "no_confirmado";
        mensaje: string;
    };
};

const CAMPO =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

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

function Campo({
    titulo,
    children,
}: {
    titulo: string;
    children: ReactNode;
}) {
    return (
        <label className="block text-xs font-bold text-slate-600">
            {titulo}
            {children}
        </label>
    );
}

export default function TicketSoportePage() {
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [intento, setIntento] = useState(0);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [confirmacion, setConfirmacion] =
        useState<Confirmacion | null>(null);

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

        if (
            bloqueo.current ||
            cargando ||
            errorCarga ||
            !departamentos.length
        ) {
            return;
        }

        const formulario = new FormData(evento.currentTarget);

        const datos = {
            solicitante: String(
                formulario.get("solicitante") || ""
            ).trim(),

            correo_solicitante: String(
                formulario.get("correo_solicitante") || ""
            ).trim(),

            departamento_id: Number(
                formulario.get("departamento_id")
            ),

            categoria: String(formulario.get("categoria") || ""),

            prioridad: String(
                formulario.get("prioridad") || "media"
            ),

            asunto: String(formulario.get("asunto") || "").trim(),

            detalles: String(
                formulario.get("detalles") || ""
            ).trim(),

            sentido: "recibida",
            destinatario: "Equipo de Servicios TI",
        };

        setError("");

        if (
            !datos.solicitante ||
            !datos.correo_solicitante ||
            !datos.categoria ||
            !datos.asunto ||
            !datos.detalles
        ) {
            setError("Completa todos los campos obligatorios.");
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
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                datos.correo_solicitante
            )
        ) {
            setError("Ingresa un correo válido.");
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
                    resultado?.mensaje ||
                        "No se pudo registrar la solicitud."
                );
            }

            if (!resultado.ticket?.numero_ticket) {
                throw new Error(
                    "No se recibió el número del ticket. Consulta con Servicios TI antes de volver a enviarlo."
                );
            }

            setConfirmacion({
                numero_ticket: resultado.ticket.numero_ticket,
                correo: resultado.correo,
            });
        } catch (errorGuardar) {
            setError(
                errorGuardar instanceof Error
                    ? errorGuardar.message
                    : "No se pudo confirmar el registro. Consulta con Servicios TI antes de volver a enviarlo."
            );
        } finally {
            bloqueo.current = false;
            setGuardando(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-800">
            {/* Menú lateral */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="flex items-center gap-3 bg-[#285ec4] p-4 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-xs font-extrabold">
                        MPH
                    </div>

                    <div className="leading-tight">
                        <span className="block text-xs font-black">
                            MPH - Mi Padre Hurtado
                        </span>

                        <span className="text-[10px] text-blue-100">
                            Plataforma de Gestión
                        </span>
                    </div>
                </div>

                <nav className="space-y-2 p-3 text-xs">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al Hub
                    </Link>

                    <div className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Módulos de Atención
                    </div>

                    {MODULOS.map((modulo) => {
                        const activo =
                            modulo.ruta === "/ticket-soporte";

                        return (
                            <Link
                                key={modulo.ruta}
                                href={modulo.ruta}
                                aria-current={
                                    activo ? "page" : undefined
                                }
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                                    activo
                                        ? "border-l-4 border-[#285ec4] bg-blue-50 font-semibold text-blue-700"
                                        : "font-medium text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <modulo.Icono
                                        className={`h-4 w-4 ${
                                            activo
                                                ? "text-blue-600"
                                                : "text-slate-400"
                                        }`}
                                    />
                                    {modulo.nombre}
                                </span>

                                <span>&rsaquo;</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="bg-[#285ec4] px-6 py-4 text-white shadow-sm">
                    <h1 className="text-base font-bold tracking-wide">
                        Sistema Gestión Interna Municipal | MPH - Mi Padre
                        Hurtado
                    </h1>
                </header>

                <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-5">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-[#285ec4]">
                        <TicketIcon className="h-6 w-6" />
                    </div>

                    <div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Módulo 3
                        </span>

                        <h2 className="mt-1 text-lg font-black">
                            MPH - Ticket Soporte
                        </h2>

                        <p className="text-xs text-slate-500">
                            Envía tu requerimiento al equipo de Servicios TI.
                        </p>
                    </div>
                </div>

                <main className="w-full flex-1 px-4 py-6 sm:px-6">
                    <div className="mx-auto max-w-4xl">
                        {/* Navegación disponible también en celular */}
                        <Link
                            href="/"
                            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 md:hidden"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al Hub
                        </Link>

                        {confirmacion ? (
                            <section
                                aria-labelledby="titulo-confirmacion"
                                className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"
                            >
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle className="h-9 w-9" />
                                </div>

                                <h2
                                    id="titulo-confirmacion"
                                    role="status"
                                    className="text-xl font-extrabold"
                                >
                                    ¡Solicitud registrada correctamente!
                                </h2>

                                <p className="mt-3 text-sm text-slate-500">
                                    El equipo de Servicios TI recibió tu ticket.
                                </p>

                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Número de ticket
                                </p>

                                <p className="mt-2 text-2xl font-extrabold text-[#285ec4]">
                                    {confirmacion.numero_ticket}
                                </p>

                                <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                    Abierto
                                </span>

                                {confirmacion.correo && (
                                    <p
                                        className={`mx-auto mt-5 max-w-lg rounded-xl px-4 py-3 text-sm ${
                                            confirmacion.correo.estado ===
                                            "aceptado"
                                                ? "bg-emerald-50 text-emerald-800"
                                                : confirmacion.correo.estado ===
                                                    "no_confirmado"
                                                  ? "bg-amber-50 text-amber-800"
                                                  : "bg-slate-50 text-slate-600"
                                        }`}
                                    >
                                        {confirmacion.correo.mensaje}
                                    </p>
                                )}

                                <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-slate-500">
                                    Conserva este número para consultar por tu
                                    requerimiento con el equipo de Servicios TI.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmacion(null);
                                        setError("");
                                        setAsunto("");
                                        setDetalles("");
                                    }}
                                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#285ec4] px-5 py-3 text-sm font-bold text-white hover:bg-[#1e4a9e]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear otra solicitud
                                </button>
                            </section>
                        ) : (
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
                                    <div className="rounded-xl bg-blue-50 p-3 text-[#285ec4]">
                                        <FileText className="h-6 w-6" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-extrabold">
                                            Solicitar soporte TI
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Completa los campos marcados con *.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={guardar} className="p-6">
                                    {cargando && (
                                        <p
                                            role="status"
                                            className="mb-5 text-sm text-slate-500"
                                        >
                                            Cargando departamentos…
                                        </p>
                                    )}

                                    {errorCarga && (
                                        <div
                                            role="alert"
                                            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                                        >
                                            <p>{errorCarga}</p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIntento(
                                                        (actual) => actual + 1
                                                    )
                                                }
                                                className="mt-2 font-bold underline"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    )}

                                    <fieldset
                                        disabled={guardando}
                                        className="m-0 grid min-w-0 gap-5 border-0 p-0"
                                    >
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <Campo titulo="Nombre del solicitante *">
                                                <input
                                                    name="solicitante"
                                                    autoComplete="name"
                                                    required
                                                    maxLength={150}
                                                    placeholder="Tu nombre completo"
                                                    className={CAMPO}
                                                />
                                            </Campo>

                                            <Campo titulo="Correo del solicitante *">
                                                <input
                                                    name="correo_solicitante"
                                                    type="email"
                                                    autoComplete="email"
                                                    required
                                                    maxLength={150}
                                                    placeholder="nombre@ejemplo.cl"
                                                    className={CAMPO}
                                                />
                                            </Campo>
                                        </div>

                                        <p className="-mt-2 text-xs text-slate-500">
                                            Enviaremos la confirmación del ticket
                                            al correo indicado.
                                        </p>

                                        <Campo titulo="Departamento asociado *">
                                            <select
                                                name="departamento_id"
                                                required
                                                defaultValue=""
                                                disabled={
                                                    cargando ||
                                                    Boolean(errorCarga) ||
                                                    !departamentos.length
                                                }
                                                className={CAMPO}
                                            >
                                                <option value="" disabled>
                                                    Selecciona tu departamento
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
                                        </Campo>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <Campo titulo="Categoría *">
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
                                            </Campo>

                                            <Campo titulo="Prioridad *">
                                                <select
                                                    name="prioridad"
                                                    required
                                                    defaultValue="media"
                                                    className={CAMPO}
                                                >
                                                    <option value="baja">
                                                        Baja
                                                    </option>
                                                    <option value="media">
                                                        Media
                                                    </option>
                                                    <option value="alta">
                                                        Alta
                                                    </option>
                                                    <option value="critica">
                                                        Crítica
                                                    </option>
                                                </select>
                                            </Campo>
                                        </div>

                                        <Campo titulo="Asunto *">
                                            <input
                                                name="asunto"
                                                required
                                                maxLength={50}
                                                value={asunto}
                                                onChange={(evento) =>
                                                    setAsunto(
                                                        evento.target.value
                                                    )
                                                }
                                                placeholder="Resumen de lo que necesitas"
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
                                        </Campo>

                                        <Campo titulo="Descripción del requerimiento *">
                                            <textarea
                                                name="detalles"
                                                required
                                                maxLength={200}
                                                rows={6}
                                                value={detalles}
                                                onChange={(evento) =>
                                                    setDetalles(
                                                        evento.target.value
                                                    )
                                                }
                                                placeholder="Describe el problema o solicitud. Indica dónde ocurre, desde cuándo y cómo afecta tu trabajo..."
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
                                        </Campo>

                                        {!cargando &&
                                            !errorCarga &&
                                            !departamentos.length && (
                                                <p
                                                    role="alert"
                                                    className="text-sm text-amber-800"
                                                >
                                                    No hay departamentos
                                                    disponibles. Contacta con
                                                    Servicios TI.
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

                                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                                            <p className="max-w-md text-xs leading-relaxed text-slate-500">
                                                La solicitud se registrará como
                                                abierta y llegará al equipo de
                                                Servicios TI.
                                            </p>

                                            <button
                                                type="submit"
                                                disabled={
                                                    guardando ||
                                                    cargando ||
                                                    Boolean(errorCarga) ||
                                                    !departamentos.length
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#285ec4] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1e4a9e] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Send className="h-4 w-4" />

                                                {guardando
                                                    ? "Enviando solicitud…"
                                                    : "Enviar solicitud"}
                                            </button>
                                        </div>
                                    </fieldset>

                                    {guardando && (
                                        <p
                                            role="status"
                                            className="mt-4 text-right text-xs text-slate-500"
                                        >
                                            Espera la confirmación antes de salir.
                                        </p>
                                    )}
                                </form>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
