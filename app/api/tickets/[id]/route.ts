import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * ==============================================================================
 * OBTENER DETALLE COMPLETO DEL TICKET + HISTORIAL DE AVANCES (MÉTODO GET)
 * ==============================================================================
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 🛠️ FIX NEXT.JS 15+: Desenvolver params asincrónicamente
    const params = await props.params;
    const { id } = params;

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'ID de ticket no proporcionado o inválido.' },
        { status: 400 }
      );
    }

    // 1. Obtener datos del Ticket (Búsqueda por ID numérico o numero_ticket exacto/parcial)
    const queryTicket = `
      SELECT 
        t.id,
        t.numero_ticket,
        t.asunto,
        t.detalles,
        t.detalles AS descripcion,
        t.tipo_llamada,
        t.estado_transferencia,
        t.estado,
        t.es_anonimo,
        t.fecha_creacion,
        t.fecha_cierre,
        t.departamento_id,
        CASE 
          WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL THEN 
            CONCAT('Anónimo ', (
              SELECT COUNT(*) 
              FROM tickets t_sub 
              WHERE (t_sub.es_anonimo = 1 OR t_sub.ciudadano_id IS NULL) 
                AND t_sub.id <= t.id
            ))
          ELSE 
            TRIM(CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellido, '')))
        END AS ciudadano,
        c.telefono AS ciudadano_telefono,
        c.correo AS ciudadano_correo,
        COALESCE(a.nombre, 'Sin Agente Asignado') AS agente,
        COALESCE(d.nombre, 'Sin Departamento Asignado') AS departamento
      FROM tickets t
      LEFT JOIN ciudadanos c ON t.ciudadano_id = c.id
      LEFT JOIN agentes_telefonicos a ON t.agente_id = a.id
      LEFT JOIN departamentos d ON t.departamento_id = d.id
      WHERE t.id = ? OR t.numero_ticket = ? OR t.numero_ticket LIKE CONCAT('%', ?)
      LIMIT 1;
    `;

    const [rows]: any = await db.query(queryTicket, [id, id, id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Ticket con identificador "${id}" no encontrado.` },
        { status: 404 }
      );
    }

    const ticket = rows[0];

    // 2. Obtener la bitácora de historial de avances para este ticket
    const queryHistorial = `
      SELECT 
        h.id,
        h.estado_anterior,
        h.estado_nuevo,
        h.comentario,
        h.fecha AS fecha_registro,
        COALESCE(a.nombre, 'Sistema / Operador') AS agente
      FROM historial_tickets h
      LEFT JOIN agentes_telefonicos a ON h.agente_id = a.id
      WHERE h.ticket_id = ?
      ORDER BY h.id DESC;
    `;

    const [historialRows]: any = await db.query(queryHistorial, [ticket.id]);

    return NextResponse.json(
      { 
        success: true, 
        ticket, 
        historial: historialRows || [] 
      }, 
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al obtener el detalle del ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener el ticket de la base de datos' },
      { status: 500 }
    );
  }
}

/**
 * ==============================================================================
 * ACTUALIZAR ESTADO Y REGISTRAR SEGUIMIENTO / ANONIMIZAR (MÉTODO PATCH)
 * ==============================================================================
 */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 🛠️ FIX NEXT.JS 15+: Desenvolver params asincrónicamente
    const params = await props.params;
    const rawParam = params.id;

    if (!rawParam || rawParam === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'ID de ticket no válido.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Parámetros de estado y bitácora
    const estado = (body.estado || body.nuevo_estado || '').toLowerCase().trim();
    const { comentario, comentario_bitacora, agente_id, solicitar_anonimizacion_post_cierre, anonymize } = body;
    
    const finalComentario = comentario || comentario_bitacora;
    const solicitarAnonimizacion = solicitar_anonimizacion_post_cierre || anonymize;

    // 1. Verificar existencia del ticket en MySQL
    const [ticketExistente]: any = await db.query(
      `SELECT id, estado, tipo_llamada, es_anonimo, ciudadano_id 
       FROM tickets 
       WHERE id = ? OR numero_ticket = ? OR numero_ticket LIKE CONCAT('%', ?) 
       LIMIT 1`,
      [rawParam, rawParam, rawParam]
    );

    if (!ticketExistente || ticketExistente.length === 0) {
      console.error(`❌ [PATCH] No se encontró el ticket en la BD para el ID/Parámetro: "${rawParam}"`);
      return NextResponse.json(
        { success: false, error: `El ticket "${rawParam}" no fue encontrado en la base de datos.` },
        { status: 404 }
      );
    }

    const ticket = ticketExistente[0];
    const realId = ticket.id;
    const estadoAnterior = (ticket.estado || 'abierto').toLowerCase();
    const tipoLlamada = (ticket.tipo_llamada || '').toLowerCase();

    // --------------------------------------------------------------------------
    // FLUJO ESPECIAL: ANONIMIZACIÓN POST-CIERRE (CUMPLIMIENTO DERECHOS ARCO)
    // --------------------------------------------------------------------------
    if (solicitarAnonimizacion) {
      if (!tipoLlamada.includes('requerimiento')) {
        return NextResponse.json(
          { success: false, error: 'La opción de anonimización post-cierre solo está disponible para requerimientos.' },
          { status: 400 }
        );
      }

      if (estadoAnterior !== 'cerrado') {
        return NextResponse.json(
          { success: false, error: 'La anonimización por derechos ARCO solo se puede aplicar a requerimientos en estado CERRADO.' },
          { status: 400 }
        );
      }

      // Aplicar supresión de datos del titular (desvinculación)
      await db.query(
        'UPDATE tickets SET es_anonimo = 1, ciudadano_id = NULL WHERE id = ?',
        [realId]
      );

      // Opcional: Registrar evento en la bitácora de auditoría
      await db.query(
        `INSERT INTO historial_tickets (ticket_id, agente_id, estado_anterior, estado_nuevo, comentario, fecha) 
         VALUES (?, ?, 'cerrado', 'cerrado', '[DERECHOS ARCO]: Solicitud de anonimización de datos personales procesada.', NOW())`,
        [realId, agente_id || null]
      );

      return NextResponse.json({
        success: true,
        message: 'El requerimiento ha sido anonimizado exitosamente. Se desvincularon los datos del ciudadano manteniendo el historial y métricas.',
      });
    }

    // --------------------------------------------------------------------------
    // VALIDACIONES OPERATIVAS NORMALES
    // --------------------------------------------------------------------------
    if (!estado) {
      return NextResponse.json(
        { success: false, error: 'El nuevo estado es requerido.' },
        { status: 400 }
      );
    }

    if (!finalComentario || finalComentario.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Debe ingresar un comentario obligatorio antes de actualizar el estado.' },
        { status: 400 }
      );
    }

    // 🛑 REGLA DE NEGOCIO 1: Las Consultas no admiten edición de avances ni cambio de estado
    if (tipoLlamada.includes('consulta')) {
      return NextResponse.json(
        { success: false, error: 'Las consultas son resueltas inmediatamente y no permiten cambios de estado.' },
        { status: 400 }
      );
    }

    // 🛑 REGLA DE NEGOCIO 2: Los Requerimientos CERRADOS quedan bloqueados para cambios operacionales
    if (estadoAnterior === 'cerrado') {
      return NextResponse.json(
        { success: false, error: 'Este requerimiento ya se encuentra CERRADO y no puede ser modificado.' },
        { status: 400 }
      );
    }

    // 2. Ejecutar actualización en Transacción Atómica
    await db.query('START TRANSACTION');

    try {
      // A. Registrar entrada en bitácora (historial_tickets)
      await db.query(
        `INSERT INTO historial_tickets (ticket_id, agente_id, estado_anterior, estado_nuevo, comentario, fecha) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [realId, agente_id || null, estadoAnterior, estado, finalComentario.trim()]
      );

      // B. Actualizar tabla principal de tickets
      let fechaCierreSQL = '';
      if (estado === 'cerrado') {
        fechaCierreSQL = ', fecha_cierre = NOW()';
      }

      await db.query(
        `UPDATE tickets SET estado = ? ${fechaCierreSQL} WHERE id = ?`,
        [estado, realId]
      );

      // Confirmar cambios
      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Avance registrado y estado actualizado correctamente.',
      });
    } catch (dbError: any) {
      await db.query('ROLLBACK');
      throw dbError;
    }

  } catch (error: any) {
    console.error('Error al actualizar el estado del ticket:', error);
    return NextResponse.json(
      { success: false, error: error.sqlMessage || error.message || 'Error al actualizar el ticket en la base de datos' },
      { status: 500 }
    );
  }
}