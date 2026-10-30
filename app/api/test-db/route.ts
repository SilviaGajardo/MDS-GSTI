import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Cambiamos el alias 'current_time' por 'hora_actual' para evitar el conflicto de palabras reservadas
    const [rows] = await db.query('SELECT DATABASE() as db_name, NOW() as hora_actual');
    return NextResponse.json({
      success: true,
      message: '¡Conexión exitosa a MySQL!',
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}