import { NextResponse } from "next/server";
import { reenviarVecinal } from "@/lib/vecinalApi";

type Contexto = {
  params: Promise<{ id: string }>;
};

async function procesar(
  request: Request,
  contexto: Contexto
) {
  const { id } = await contexto.params;

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

export async function GET(
  request: Request,
  contexto: Contexto
) {
  return procesar(request, contexto);
}

export async function PATCH(
  request: Request,
  contexto: Contexto
) {
  return procesar(request, contexto);
}