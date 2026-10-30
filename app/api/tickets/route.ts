import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * ==============================================================================
 * ACCIÓN 1: OBTENER TODOS LOS TICKETS (MÉTODO GET)
 * ==============================================================================
 */
export async function GET() {
  try {
    const consultaSQL = `
      SELECT 
        t.id,
        t.numero_ticket,
        t.es_anonimo,
        t.ciudadano_id,
        CASE 
          WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL THEN 'Anónimo'
          ELSE 'Registrado'
        END AS tipo_usuario,
        CASE 
          WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL THEN 
            CONCAT('Anónimo ', (
              SELECT COUNT(*) 
              FROM tickets t_sub 
              WHERE (t_sub.es_anonimo = 1 OR t_sub.ciudadano_id IS NULL) 
                AND t_sub.id <= t.id
            ))
          ELSE COALESCE(
            NULLIF(CONCAT(IFNULL(c.nombre, ''), ' ', IFNULL(c.apellido, '')), ' '),
            'Ciudadano Registrado'
          )
        END AS ciudadano,
        t.agente_id,
        COALESCE(a.nombre, 'Sin asignar') AS agente,
        t.departamento_id,
        COALESCE(d.nombre, 'Sin asignar') AS departamento,
        t.tipo_llamada,
        t.estado_transferencia,
        t.estado,
        t.asunto,
        t.detalles,
        t.fecha_creacion,
        t.fecha_cierre
      FROM tickets t
      LEFT JOIN ciudadanos c ON t.ciudadano_id = c.id
      LEFT JOIN agentes_telefonicos a ON t.agente_id = a.id
      LEFT JOIN departamentos d ON t.departamento_id = d.id
      ORDER BY t.id DESC
    `;

    const [filasObtenidas]: any = await db.query(consultaSQL);

    return NextResponse.json({ success: true, data: filasObtenidas });
  } catch (error: any) {
    console.error('Error en GET /api/tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener los tickets' },
      { status: 500 }
    );
  }
}

/**
 * ==============================================================================
 * ACCIÓN 2: CREAR NUEVO TICKET (MÉTODO POST)
 * ==============================================================================
 */
export async function POST(request: Request) {
  try {
    const datosRecibidos = await request.json();

    const {
      // Datos del Ciudadano
      citizenId,
      ciudadano_id,
      nombre,
      apellido,
      telefono,
      correo,
      isAnonymous,

      // Contenido del Ticket
      subject,
      asunto,
      description,
      descripcion,
      detalles,
      type,
      tipo,
      tipo_llamada,

      // Asignación
      department,
      departmentId,
      departamento,
      departamento_id,
      agente_id,

      // Transferencias y Estados
      es_transferida,
      resultado_llamada,
      estado_transferencia,
      pendiente_informacion,
      observaciones_pendiente,
    } = datosRecibidos;

    // --------------------------------------------------------------------------
    // 1. TIPO DE ATENCIÓN: CONSULTA RÁPIDA VS REQUERIMIENTO
    // --------------------------------------------------------------------------
    const tipoBruto = (tipo_llamada || tipo || type || '').toLowerCase();
    const esConsulta = (
      tipoBruto === 'consulta' || 
      tipoBruto === 'consulta_rapida' || 
      tipoBruto === 'consultas'
    );
    const finalTipoLlamada = esConsulta ? 'consulta_rapida' : 'requerimiento';

    // --------------------------------------------------------------------------
    // 2. VALIDACIÓN DE OBLIGATORIEDAD DE CIUDADANO PARA REQUERIMIENTOS
    // --------------------------------------------------------------------------
    const solicitaAnonimo = isAnonymous === true || isAnonymous === 'true' || isAnonymous === 1;

    // REGLA: Los requerimientos NO pueden ser anónimos al momento de su creación.
    if (!esConsulta && solicitaAnonimo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un requerimiento no puede ser creado de forma anónima. De acuerdo con la normativa vigente y los procedimientos de gestión, los requerimientos exigen obligatoriamente identificar al ciudadano para el seguimiento y gestión de la solicitud.',
          legal_notice: 'Cumplimiento Normativo: Registro obligatorio de identidad para el ingreso y trazabilidad de requerimientos.',
        },
        { status: 400 }
      );
    }

    let finalCitizenId: number | null = null;

    if (!solicitaAnonimo) {
      const rawCitizenId = ciudadano_id ?? citizenId;

      if (rawCitizenId !== undefined && rawCitizenId !== null) {
        const textoId = String(rawCitizenId).trim();
        if (!textoId.startsWith('anon-') && textoId !== '' && textoId !== '0') {
          const idNumerico = parseInt(textoId, 10);
          if (!isNaN(idNumerico) && idNumerico > 0) {
            finalCitizenId = idNumerico;
          }
        }
      }

      // Si no viene ID pero se ingresaron datos, se busca o crea al ciudadano
      if (!finalCitizenId && (telefono || correo || nombre)) {
        if (telefono || correo) {
          const [existentes]: any = await db.query(
            `SELECT id FROM ciudadanos 
             WHERE (telefono IS NOT NULL AND telefono = ?) 
                OR (correo IS NOT NULL AND correo = ?) 
             LIMIT 1`,
            [telefono || '', correo || '']
          );

          if (existentes && existentes.length > 0) {
            finalCitizenId = existentes[0].id;
          }
        }

        if (!finalCitizenId && (nombre || apellido)) {
          const [nuevoCiudadano]: any = await db.query(
            `INSERT INTO ciudadanos (nombre, apellido, telefono, correo) 
             VALUES (?, ?, ?, ?)`,
            [nombre || null, apellido || null, telefono || null, correo || null]
          );
          finalCitizenId = nuevoCiudadano.insertId;
        }
      }
    }

    // REGLA: Si es Requerimiento y no se pudo identificar/registrar al ciudadano, rechazar.
    if (!esConsulta && !finalCitizenId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Para registrar un requerimiento es obligatorio asociar un ciudadano válido (Nombre, Teléfono o Correo).',
          legal_notice: 'Ley de Procedimiento Administrativo: Identificación obligatoria del solicitante en requerimientos institucionales.',
        },
        { status: 400 }
      );
    }

    // Definición final de anonimato
    const esAnonimo = (solicitaAnonimo || !finalCitizenId) ? 1 : 0;
    if (esAnonimo) {
      finalCitizenId = null;
    }

    // --------------------------------------------------------------------------
    // 3. GENERAR CÓDIGO INCREMENTAL (Ej: 2026-0018)
    // --------------------------------------------------------------------------
    const añoActual = new Date().getFullYear();
    const patronAño = `${añoActual}-%`;

    const [ultimoTicket]: any = await db.query(
      `SELECT numero_ticket FROM tickets 
       WHERE numero_ticket LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [patronAño]
    );

    let siguienteNumero = 1;
    if (ultimoTicket && ultimoTicket.length > 0) {
      const ultimoCodigo = ultimoTicket[0].numero_ticket;
      const partes = ultimoCodigo.split('-');
      if (partes.length === 2) {
        const numeroAnterior = parseInt(partes[1], 10);
        if (!isNaN(numeroAnterior)) {
          siguienteNumero = numeroAnterior + 1;
        }
      }
    }
    const numeroTicket = `${añoActual}-${String(siguienteNumero).padStart(4, '0')}`;

    // --------------------------------------------------------------------------
    // 4. RESOLVER DEPARTAMENTO Y AGENTE
    // --------------------------------------------------------------------------
    const departamentoTextoID = departamento_id || departmentId || departamento || department;
    let finalDepartamentoId: number | null = null;

    if (departamentoTextoID) {
      if (!isNaN(Number(departamentoTextoID))) {
        finalDepartamentoId = parseInt(String(departamentoTextoID), 10);
      } else {
        const [deptEncontrado]: any = await db.query(
          'SELECT id FROM departamentos WHERE LOWER(nombre) LIKE LOWER(?) LIMIT 1',
          [`%${departamentoTextoID}%`]
        );
        if (deptEncontrado && deptEncontrado.length > 0) {
          finalDepartamentoId = deptEncontrado[0].id;
        }
      }
    }

    let finalAgenteId: number | null = agente_id ? parseInt(String(agente_id), 10) : null;
    if (!finalAgenteId) {
      const [agentesDisponibles]: any = await db.query('SELECT id FROM agentes_telefonicos LIMIT 1');
      if (agentesDisponibles && agentesDisponibles.length > 0) {
        finalAgenteId = agentesDisponibles[0].id;
      }
    }

    // --------------------------------------------------------------------------
    // 5. ESTADOS Y REGLAS DE CIERRE
    // --------------------------------------------------------------------------
    let finalEstado = 'abierto';
    let fechaCierreSQL: Date | null = null;
    const finalEstadoTransferencia = resultado_llamada || estado_transferencia || null;

    const finalAsunto = asunto || subject || (esConsulta ? 'Consulta rápida' : 'Requerimiento');
    let finalDetalles = detalles || descripcion || description || finalAsunto;

    if (esConsulta) {
      // Las Consultas nacen directamente en estado CERRADO
      finalEstado = 'cerrado';
      fechaCierreSQL = new Date();
    } else {
      // Requerimientos: Nacen en 'abierto' o cambian según la transferencia
      if (es_transferida || finalEstadoTransferencia) {
        const resNorm = String(finalEstadoTransferencia).toLowerCase();

        if (resNorm.includes('exito') || resNorm.includes('éxito')) {
          finalEstado = 'cerrado';
          fechaCierreSQL = new Date();
        } else if (
          resNorm.includes('no_contestada') || 
          resNorm.includes('no contestada') || 
          resNorm.includes('devuelta') || 
          resNorm.includes('mesa de ayuda')
        ) {
          finalEstado = 'en_proceso';
        } else {
          finalEstado = 'abierto';
        }
      } else {
        finalEstado = 'abierto';
      }

      if (pendiente_informacion || observaciones_pendiente) {
        if (observaciones_pendiente && observaciones_pendiente.trim() !== '') {
          finalDetalles += `\n\n[ANTECEDENTES PENDIENTES]: ${observaciones_pendiente}`;
        }
      }
    }

    // --------------------------------------------------------------------------
    // 6. INSERCIÓN EN LA BASE DE DATOS
    // --------------------------------------------------------------------------
    const [resultadoInsercion]: any = await db.query(
      `INSERT INTO tickets 
        (numero_ticket, es_anonimo, ciudadano_id, agente_id, departamento_id, tipo_llamada, estado_transferencia, estado, asunto, detalles, fecha_creacion, fecha_cierre) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        numeroTicket,
        esAnonimo,
        finalCitizenId,
        finalAgenteId,
        finalDepartamentoId,
        finalTipoLlamada,
        finalEstadoTransferencia,
        finalEstado,
        finalAsunto,
        finalDetalles,
        fechaCierreSQL,
      ]
    );

    const nuevoTicket = {
      id: resultadoInsercion.insertId,
      numero_ticket: numeroTicket,
      es_anonimo: esAnonimo,
      tipo_usuario: esAnonimo ? 'Anónimo' : 'Registrado',
      ciudadano_id: finalCitizenId,
      agente_id: finalAgenteId,
      departamento_id: finalDepartamentoId,
      tipo_llamada: finalTipoLlamada,
      estado_transferencia: finalEstadoTransferencia,
      estado: finalEstado,
      asunto: finalAsunto,
      detalles: finalDetalles,
      fecha_creacion: new Date(),
      fecha_cierre: fechaCierreSQL,
    };

    return NextResponse.json(
      { 
        success: true, 
        data: nuevoTicket,
        message: esConsulta 
          ? 'Consulta rápida creada y cerrada exitosamente.' 
          : 'Requerimiento registrado con éxito en estado Abierto.',
        legal_notice: 'Los tickets cerrados quedan protegidos contra modificaciones operativas y sirven como respaldo oficial para métricas e historia del sistema.',
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en POST /api/tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || error.message || 'Error interno del servidor al crear el ticket',
      },
      { status: 500 }
    );
  }
}

/**
 * ==============================================================================
 * ACCIÓN 3: ACTUALIZAR ESTADO O GESTIONAR ANONIMIZACIÓN POST-CIERRE (PATCH)
 * ==============================================================================
 */
export async function PATCH(request: Request) {
  try {
    const datosRecibidos = await request.json();
    const { ticket_id, nuevo_estado, comentario_bitacora, solicitar_anonimizacion_post_cierre } = datosRecibidos;

    if (!ticket_id) {
      return NextResponse.json(
        { success: false, error: 'El ID del ticket es obligatorio.' },
        { status: 400 }
      );
    }

    // 1. Obtener información actual del ticket
    const [ticketsEncontrados]: any = await db.query(
      'SELECT id, estado, tipo_llamada, es_anonimo, ciudadano_id, detalles FROM tickets WHERE id = ? LIMIT 1',
      [ticket_id]
    );

    if (!ticketsEncontrados || ticketsEncontrados.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El ticket solicitado no existe.' },
        { status: 404 }
      );
    }

    const ticketActual = ticketsEncontrados[0];

    // --------------------------------------------------------------------------
    // 2. FLUJO DE ANONIMIZACIÓN POST-CIERRE (SOLO PARA REQUERIMIENTOS CERRADOS)
    // Ley de Protección de Datos Personales / Derechos ARCO (Supresión / Cancelación)
    // --------------------------------------------------------------------------
    if (solicitar_anonimizacion_post_cierre) {
      // Validar que el ticket sea de tipo REQUERIMIENTO
      if (ticketActual.tipo_llamada !== 'requerimiento') {
        return NextResponse.json(
          {
            success: false,
            error: 'La opción de anonimización post-cierre solo está disponible para requerimientos.',
          },
          { status: 400 }
        );
      }

      // Validar que se encuentre CERRADO
      if (ticketActual.estado !== 'cerrado') {
        return NextResponse.json(
          {
            success: false,
            error: 'La anonimización de requerimientos por derechos ARCO solo se puede aplicar cuando el ticket se encuentra en estado CERRADO.',
          },
          { status: 400 }
        );
      }

      // Realizar la desvinculación de los datos personales (Pasar de Registrado a Anónimo)
      await db.query(
        `UPDATE tickets 
         SET es_anonimo = 1, ciudadano_id = NULL 
         WHERE id = ?`,
        [ticket_id]
      );

      return NextResponse.json({
        success: true,
        message: 'El requerimiento ha sido anonimizado exitosamente. Los datos personales del ciudadano han sido desvinculados conservando la métrica e historial.',
        legal_notice: 'Cumplimiento Legal - Ley de Protección de Datos Personales / Derechos ARCO: Se ejerció la supresión/cancelación de datos del titular sin alterar los indicadores estadísticos municipales.',
      });
    }

    // --------------------------------------------------------------------------
    // 3. BLOQUEO DE EDICIÓN PARA TICKETS CERRADOS
    // --------------------------------------------------------------------------
    if (ticketActual.estado === 'cerrado') {
      return NextResponse.json(
        {
          success: false,
          error: 'Este ticket ya se encuentra CERRADO y bloqueado para modificaciones. No se pueden agregar bitácoras ni cambiar su estado operativo.',
          legal_notice: 'Inmutabilidad de Registros Cerrados: Garantiza la intangibilidad de la información para auditorías y métricas.',
        },
        { status: 423 } // 423 Locked
      );
    }

    // --------------------------------------------------------------------------
    // 4. CAMBIO DE ESTADO OPERATIVO (abierto -> en_proceso -> cerrado)
    // --------------------------------------------------------------------------
    const estadosValidos = ['abierto', 'en_proceso', 'cerrado'];
    if (nuevo_estado && !estadosValidos.includes(nuevo_estado)) {
      return NextResponse.json(
        { success: false, error: 'Estado no válido. Los estados permitidos son: abierto, en_proceso, cerrado.' },
        { status: 400 }
      );
    }

    let nuevoDetalle = ticketActual.detalles;
    if (comentario_bitacora && comentario_bitacora.trim() !== '') {
      const fechaHora = new Date().toLocaleString('es-CL');
      nuevoDetalle += `\n\n[AVANCE/BITÁCORA ${fechaHora}]: ${comentario_bitacora.trim()}`;
    }

    const estadoFinal = nuevo_estado || ticketActual.estado;
    const esCierre = estadoFinal === 'cerrado';

    await db.query(
      `UPDATE tickets 
       SET estado = ?, 
           detalles = ?, 
           fecha_cierre = CASE WHEN ? = 1 THEN NOW() ELSE fecha_cierre END 
       WHERE id = ?`,
      [estadoFinal, nuevoDetalle, esCierre ? 1 : 0, ticket_id]
    );

    return NextResponse.json({
      success: true,
      message: esCierre
        ? 'El ticket ha sido CERRADO correctamente. A partir de este momento queda bloqueado para modificaciones operativas.'
        : `Ticket actualizado correctamente a estado '${estadoFinal}'.`,
      legal_notice: esCierre
        ? 'Una vez cerrado el requerimiento, la única acción permitida por normativa será la anonimización de datos si el ciudadano lo requiere.'
        : 'Los avances han quedado guardados en la bitácora interna.',
    });
  } catch (error: any) {
    console.error('Error en PATCH /api/tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar el ticket' },
      { status: 500 }
    );
  }
}