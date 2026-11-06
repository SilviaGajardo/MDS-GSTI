import "server-only";
import { NextResponse } from "next/server";

export async function reenviarVecinal(
  request: Request,
  ruta: string
) {
  const rutaPermitida =
    ruta === "tickets" ||
    /^tickets\/[1-9]\d*$/.test(ruta) ||
    ruta === "tickets/catalogo/ciudadanos";

  if (!rutaPermitida) {
    return NextResponse.json(
      { success: false, error: "Ruta no encontrada." },
      { status: 404 }
    );
  }

  const metodo = request.method;

  if (!["GET", "POST", "PATCH"].includes(metodo)) {
    return NextResponse.json(
      { success: false, error: "Método no permitido." },
      { status: 405 }
    );
  }

  if (metodo !== "GET") {
    const origen = request.headers.get("origin");

    if (origen && origen !== new URL(request.url).origin) {
      return NextResponse.json(
        { success: false, error: "Origen no permitido." },
        { status: 403 }
      );
    }
  }

  const base = (
    process.env.VECINAL_API_URL ||
    process.env.TI_API_URL ||
    ""
  ).replace(/\/+$/, "");

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta configurar VECINAL_API_URL en el frontend.",
      },
      { status: 503 }
    );
  }

  let cuerpo: string | undefined;

  if (metodo !== "GET") {
    try {
      cuerpo = await request.text();

      if (new TextEncoder().encode(cuerpo).length > 100 * 1024) {
        return NextResponse.json(
          { success: false, error: "Los datos exceden el tamaño permitido." },
          { status: 413 }
        );
      }

      const datos = JSON.parse(cuerpo);

      if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos)
      ) {
        throw new Error("Formato inválido");
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Debes enviar un objeto JSON válido." },
        { status: 400 }
      );
    }
  }

  try {
    const destino = new URL(`${base}/api/vecinal/${ruta}`);

    // Conservar el parámetro de búsqueda de ciudadanos.
    if (ruta === "tickets/catalogo/ciudadanos" && metodo === "GET") {
      const busqueda = new URL(request.url).searchParams.get("q");

      if (busqueda !== null) {
        destino.searchParams.set("q", busqueda);
      }
    }

    const respuesta = await fetch(destino, {
      method: metodo,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(metodo !== "GET"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: cuerpo,
      signal: AbortSignal.timeout(20000),
    });

    const datos = await respuesta.json();

    return NextResponse.json(datos, {
      status: respuesta.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error(
      "Error de conexión con Atención Vecinal:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          metodo === "GET"
            ? "No se pudo consultar el backend de Atención Vecinal."
            : "No se pudo confirmar la operación. Revisa los registros antes de volver a enviarla.",
      },
      { status: 502 }
    );
  }
}