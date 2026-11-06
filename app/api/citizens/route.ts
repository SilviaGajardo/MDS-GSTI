import { reenviarVecinal } from "@/lib/vecinalApi";

// Consultar ciudadanos.
export async function GET(request: Request) {
  return reenviarVecinal(
    request,
    "tickets/catalogo/ciudadanos"
  );
}

// Registrar un ciudadano.
export async function POST(request: Request) {
  return reenviarVecinal(
    request,
    "tickets/catalogo/ciudadanos"
  );
}