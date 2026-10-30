import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [departamentos] = await db.query('SELECT * FROM departamentos ORDER BY nombre ASC');
    return NextResponse.json({ success: true, data: departamentos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}