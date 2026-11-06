import { NextResponse } from "next/server";

type Contexto = {
    params: Promise<{
        ruta: string[];
    }>;
};

export async function GET(
    _request: Request,
    contexto: Contexto
) {
    const { ruta } = await contexto.params;
    const camino = ruta.join("/");

    const rutaPermitida =
        camino === "departamentos" ||
        camino === "tickets" ||
        camino === "tickets/estadisticas" ||
        /^tickets\/[1-9]\d*$/.test(camino);

    if (!rutaPermitida) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Ruta no encontrada.",
            },
            { status: 404 }
        );
    }

    const base = process.env.TI_API_URL?.replace(/\/+$/, "");

    if (!base) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Falta configurar TI_API_URL en el frontend.",
            },
            { status: 503 }
        );
    }

    try {
        const respuesta = await fetch(
            `${base}/api/ti/${camino}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(15000),
            }
        );

        const datos = await respuesta.json();

        return NextResponse.json(datos, {
            status: respuesta.status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error(
            "Error de conexión con el backend TI:",
            error instanceof Error ? error.message : "Error desconocido"
        );

        return NextResponse.json(
            {
                ok: false,
                mensaje: "No se pudo conectar con el backend de Servicios TI.",
            },
            { status: 502 }
        );
        
    }
    
}
export async function POST(
    request: Request,
    contexto: Contexto
) {
    const { ruta } = await contexto.params;

    if (ruta.join("/") !== "tickets") {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Ruta no encontrada.",
            },
            { status: 404 }
        );
    }

    const origen = request.headers.get("origin");

    if (origen && origen !== new URL(request.url).origin) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "El origen de la solicitud no está permitido.",
            },
            { status: 403 }
        );
    }

    const base = process.env.TI_API_URL?.replace(/\/+$/, "");

    if (!base) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Falta configurar TI_API_URL en el frontend.",
            },
            { status: 503 }
        );
    }

    let cuerpo: string;

    try {
        cuerpo = await request.text();

        if (new TextEncoder().encode(cuerpo).length > 100 * 1024) {
            return NextResponse.json(
                {
                    ok: false,
                    mensaje: "La solicitud supera el tamaño permitido.",
                },
                { status: 413 }
            );
        }

        const datos = JSON.parse(cuerpo);

        if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
            throw new Error("Formato inválido.");
        }
    } catch {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Los datos enviados no tienen un formato válido.",
            },
            { status: 400 }
        );
    }

    try {
        const respuesta = await fetch(`${base}/api/ti/tickets`, {
            method: "POST",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: cuerpo,
            signal: AbortSignal.timeout(60000),
        });

        const datos = await respuesta.json();

        return NextResponse.json(datos, {
            status: respuesta.status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error(
            "Error al enviar el ticket al backend:",
            error instanceof Error ? error.message : "Error desconocido"
        );

        return NextResponse.json(
            {
                ok: false,
                mensaje:
                    "No se pudo confirmar la creación. Revisa el listado antes de volver a enviar el ticket.",
            },
            { status: 502 }
        );

        
    }
    
}
export async function PATCH(
    request: Request,
    contexto: Contexto
) {
    const { ruta } = await contexto.params;
    const camino = ruta.join("/");

    if (!/^tickets\/[1-9]\d*$/.test(camino)) {
        return NextResponse.json(
            { ok: false, mensaje: "Ruta no encontrada." },
            { status: 404 }
        );
    }

    const origen = request.headers.get("origin");

    if (origen && origen !== new URL(request.url).origin) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "El origen de la solicitud no está permitido.",
            },
            { status: 403 }
        );
    }

    const base = process.env.TI_API_URL?.replace(/\/+$/, "");

    if (!base) {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Falta configurar TI_API_URL.",
            },
            { status: 503 }
        );
    }

    let cuerpo: string;

    try {
        cuerpo = await request.text();

        if (new TextEncoder().encode(cuerpo).length > 100 * 1024) {
            return NextResponse.json(
                {
                    ok: false,
                    mensaje: "La solicitud supera el tamaño permitido.",
                },
                { status: 413 }
            );
        }

        const datos = JSON.parse(cuerpo);

        if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
            throw new Error("Formato inválido.");
        }
    } catch {
        return NextResponse.json(
            {
                ok: false,
                mensaje: "Los datos enviados no son válidos.",
            },
            { status: 400 }
        );
    }

    try {
        const respuesta = await fetch(`${base}/api/ti/${camino}`, {
            method: "PATCH",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: cuerpo,
            signal: AbortSignal.timeout(15000),
        });

        const datos = await respuesta.json();

        return NextResponse.json(datos, {
            status: respuesta.status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch {
        return NextResponse.json(
            {
                ok: false,
                mensaje:
                    "No se pudo confirmar el cambio. Recarga el detalle y revisa el historial antes de volver a guardar.",
            },
            { status: 502 }
        );
    }
}