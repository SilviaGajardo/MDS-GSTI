import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Obtener ciudadanos
export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM ciudadanos ORDER BY id DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Guardar ciudadano ajustado a la estructura de tu BD
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extraer campos del formulario o body
    const nombre = body.nombre || body.name || '';
    const apellido = body.apellido || '';
    const telefono = body.telefono || body.phone || null;
    const correo = body.correo || body.email || null;

    const [result]: any = await db.query(
      'INSERT INTO ciudadanos (nombre, apellido, telefono, correo) VALUES (?, ?, ?, ?)',
      [nombre, apellido, telefono, correo]
    );

    const newCitizen = {
      id: result.insertId,
      nombre,
      apellido,
      telefono,
      correo,
    };

    return NextResponse.json({ success: true, data: newCitizen }, { status: 201 });
  } catch (error: any) {
    console.error('Error insertando ciudadano en MySQL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}