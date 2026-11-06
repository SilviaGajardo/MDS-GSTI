import { NextResponse } from "next/server";
import { reenviarVecinal } from "@/lib/vecinalApi";

// Listar atenciones vecinales.
export async function GET(request: Request) {
  return reenviarVecinal(request, "tickets");
}

// Crear una consulta o un requerimiento.
export async function POST(request: Request) {
  return reenviarVecinal(request, "tickets");
}

// Compatibilidad con solicitudes que envían ticket_id.
export async function PATCH(request: Request) {
  let datos;

  try {
    datos = await request.clone().json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Los datos enviados no son un JSON válido.",
      },
      { status: 400 }
    );
  }

  const id = String(datos?.ticket_id ?? "");

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "El ID del ticket no es válido.",
      },
      { status: 400 }
    );
  }

  return reenviarVecinal(request, `tickets/${id}`);
}