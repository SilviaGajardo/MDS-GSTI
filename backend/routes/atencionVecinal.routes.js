const express = require("express");
const pool = require("../config/database");

const router = express.Router();

class ErrorValidacion extends Error {
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.status = status;
    }
}

function texto(valor, nombre, limite) {
    if (valor === undefined || valor === null) return "";

    if (typeof valor !== "string") {
        throw new ErrorValidacion(`El campo ${nombre} debe ser un texto.`);
    }

    const resultado = valor.trim();

    if (resultado.length > limite) {
        throw new ErrorValidacion(
            `El campo ${nombre} admite hasta ${limite} caracteres.`
        );
    }

    return resultado;
}

function idPositivo(valor, nombre) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const cadena = String(valor).trim();
    const numero = Number(cadena);

    if (!/^[1-9]\d*$/.test(cadena) || !Number.isSafeInteger(numero)) {
        throw new ErrorValidacion(
            `El identificador de ${nombre} no es válido.`
        );
    }

    return numero;
}

function normalizar(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");
}

function esVerdadero(valor) {
    return valor === true || valor === 1 || valor === "true";
}

function tienePropiedad(objeto, propiedad) {
    return Object.prototype.hasOwnProperty.call(objeto, propiedad);
}

function validarObjeto(datos) {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        throw new ErrorValidacion(
            "Debes enviar un objeto con los datos de la operación."
        );
    }
}

function responderError(res, error, contexto) {
    if (error instanceof ErrorValidacion) {
        return res.status(error.status).json({
            success: false,
            error: error.message,
        });
    }

    console.error(contexto, error.code || error.message);

    return res.status(500).json({
        success: false,
        error: "No se pudo completar la operación de Atención Vecinal.",
    });
}

const ESTADOS_VALIDOS = ["abierto", "en_proceso", "cerrado"];

const NOMBRES_TRANSFERENCIA = {
    pendiente: "Pendiente de confirmar",
    exito: "Contestada en el departamento",
    no_contestada: "No contestada",
    devuelta: "Devuelta a mesa de ayuda",
};

function validarResultadoTransferencia(valor) {
    const resultado = normalizar(valor);

    const alias = {
        pendiente: "pendiente",
        exito: "exito",
        exitosa: "exito",
        no_contestada: "no_contestada",
        no_contestada_por_departamento: "no_contestada",
        devuelta: "devuelta",
        mesa_de_ayuda: "devuelta",
        vuelta_mesa_ayuda: "devuelta",
    };

    if (!tienePropiedad(alias, resultado)) {
        throw new ErrorValidacion(
            "El resultado debe ser pendiente, exito, no_contestada o devuelta."
        );
    }

    return alias[resultado];
}

async function obtenerAgente(conexion) {
    const [agentes] = await conexion.execute(
        `SELECT id, nombre
         FROM av_agentes
         WHERE nombre = ?
         ORDER BY id
         LIMIT 1`,
        ["Registro del sistema"]
    );

    if (!agentes.length) {
        throw new Error(
            "No está configurado el agente inicial de Atención Vecinal."
        );
    }

    return agentes[0];
}

// Consultar y buscar ciudadanos.
router.get("/catalogo/ciudadanos", async (req, res) => {
    try {
        const busqueda = texto(req.query.q, "búsqueda", 150);
        const palabras = busqueda.split(/\s+/).filter(Boolean);
        const condiciones = ["fecha_anonimizacion IS NULL"];
        const parametros = [];

        for (const palabra of palabras) {
            const patron = "%" + palabra.replace(/[!%_]/g, "!$&") + "%";

            condiciones.push(
                "CONCAT_WS(' ', nombre, apellido, telefono, correo) LIKE ? ESCAPE '!'"
            );
            parametros.push(patron);
        }

        const [ciudadanos] = await pool.execute(
            `SELECT id, nombre, apellido, telefono, correo, fecha_creacion,
                    TRIM(CONCAT(COALESCE(nombre, ''), ' ',
                                COALESCE(apellido, ''))) AS name,
                    telefono AS phone,
                    correo AS email
             FROM av_ciudadanos
             WHERE ${condiciones.join(" AND ")}
             ORDER BY nombre, apellido, id`,
            parametros
        );

        res.json({ success: true, data: ciudadanos });
    } catch (error) {
        responderError(res, error, "Error al consultar ciudadanos:");
    }
});

// Registrar ciudadano.
router.post("/catalogo/ciudadanos", async (req, res) => {
    try {
        const datos = req.body;
        validarObjeto(datos);

        const nombre = texto(datos.nombre ?? datos.name, "nombre", 100);
        const apellido = texto(datos.apellido, "apellido", 100);
        const telefono = texto(datos.telefono ?? datos.phone, "teléfono", 20);
        const correo = texto(datos.correo ?? datos.email, "correo", 150);

        if (!nombre) {
            throw new ErrorValidacion("Debes ingresar el nombre del ciudadano.");
        }

        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw new ErrorValidacion("El correo electrónico no es válido.");
        }

        const [resultado] = await pool.execute(
            `INSERT INTO av_ciudadanos (nombre, apellido, telefono, correo)
             VALUES (?, ?, ?, ?)`,
            [nombre, apellido || null, telefono || null, correo || null]
        );

        res.status(201).json({
            success: true,
            message: "Ciudadano registrado correctamente.",
            data: {
                id: resultado.insertId,
                nombre,
                apellido: apellido || null,
                telefono: telefono || null,
                correo: correo || null,
                name: [nombre, apellido].filter(Boolean).join(" "),
                phone: telefono || null,
                email: correo || null,
            },
        });
    } catch (error) {
        responderError(res, error, "Error al registrar ciudadano:");
    }
});

// Listar atenciones vecinales.
router.get("/", async (req, res) => {
    try {
        const [tickets] = await pool.query(`
            SELECT
                t.id,
                t.numero_ticket,
                t.es_anonimo,
                t.ciudadano_id,
                CASE
                    WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL
                    THEN 'Anónimo'
                    ELSE 'Registrado'
                END AS tipo_usuario,
                CASE
                    WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL
                    THEN CONCAT('Anónimo ', t.id)
                    ELSE COALESCE(
                        NULLIF(TRIM(CONCAT(COALESCE(c.nombre, ''), ' ',
                                           COALESCE(c.apellido, ''))), ''),
                        'Ciudadano registrado'
                    )
                END AS ciudadano,
                t.agente_id,
                a.nombre AS agente,
                t.departamento_id,
                COALESCE(d.nombre, 'Sin departamento asignado') AS departamento,
                t.tipo_llamada,
                t.estado_transferencia,
                t.estado,
                t.asunto,
                t.detalles,
                t.fecha_creacion,
                t.fecha_cierre
            FROM av_tickets AS t
            LEFT JOIN av_ciudadanos AS c ON c.id = t.ciudadano_id
            LEFT JOIN av_agentes AS a ON a.id = t.agente_id
            LEFT JOIN departamentos AS d ON d.id = t.departamento_id
            ORDER BY t.id DESC
        `);

        res.json({ success: true, data: tickets });
    } catch (error) {
        responderError(res, error, "Error al consultar atenciones:");
    }
});

// Crear una consulta o un requerimiento y registrar su primer evento.
router.post("/", async (req, res) => {
    let conexion;

    try {
        const datos = req.body;
        validarObjeto(datos);

        const tipoBruto = normalizar(
            datos.tipo_llamada ?? datos.tipo ?? datos.type ?? "requerimiento"
        );

        const esConsulta = [
            "consulta",
            "consultas",
            "consulta_rapida",
        ].includes(tipoBruto);

        if (!esConsulta && !["requerimiento", "transferida"].includes(tipoBruto)) {
            throw new ErrorValidacion("El tipo de atención no es válido.");
        }

        const tipoLlamada = esConsulta ? "consulta_rapida" : "requerimiento";
        const solicitaAnonimo = esVerdadero(datos.isAnonymous);

        if (!esConsulta && solicitaAnonimo) {
            throw new ErrorValidacion(
                "Los requerimientos deben estar asociados a un ciudadano."
            );
        }

        const nombre = texto(datos.nombre, "nombre", 100);
        const apellido = texto(datos.apellido, "apellido", 100);
        const telefono = texto(datos.telefono, "teléfono", 20);
        const correo = texto(datos.correo, "correo", 150);

        if (
            !solicitaAnonimo &&
            correo &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
        ) {
            throw new ErrorValidacion("El correo del ciudadano no es válido.");
        }

        const asuntoRecibido = texto(
            datos.asunto ?? datos.subject,
            "asunto",
            50
        );

        const descripcionRecibida = texto(
            datos.detalles ?? datos.descripcion ?? datos.description,
            "descripción",
            200
        );

        if (!esConsulta && !asuntoRecibido) {
            throw new ErrorValidacion(
                "El asunto del requerimiento es obligatorio."
            );
        }

        if (!esConsulta && !descripcionRecibida) {
            throw new ErrorValidacion(
                "La descripción del requerimiento es obligatoria."
            );
        }

        const asunto = asuntoRecibido || "Consulta rápida";
        const detalles = descripcionRecibida || asunto;

        // Estos datos van al historial y no ocupan espacio de la descripción.
        const area = esConsulta ? "" : texto(datos.area, "área", 150);

        const observacionesPendientes = texto(
            datos.observaciones_pendiente,
            "observaciones pendientes",
            4000
        );

        const pendienteInformacion =
            !esConsulta &&
            (esVerdadero(datos.pendiente_informacion) || !!observacionesPendientes);

        const esTransferida =
            !esConsulta &&
            (esVerdadero(datos.es_transferida) || tipoBruto === "transferida");

        let estadoTransferencia = null;

        if (esTransferida) {
            const resultadoRecibido =
                datos.resultado_llamada ?? datos.estado_transferencia;

            estadoTransferencia =
                resultadoRecibido === undefined ||
                resultadoRecibido === null ||
                resultadoRecibido === ""
                    ? "pendiente"
                    : validarResultadoTransferencia(resultadoRecibido);
        }

        const estado = esConsulta ? "cerrado" : "abierto";

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const departamentoRecibido =
            datos.departamento_id ??
            datos.departmentId ??
            datos.departamento ??
            datos.department;

        let departamentoId = null;
        let departamentoNombre = null;

        if (
            departamentoRecibido !== undefined &&
            departamentoRecibido !== null &&
            departamentoRecibido !== ""
        ) {
            const valor = String(departamentoRecibido).trim();
            let departamentos;

            if (/^[1-9]\d*$/.test(valor)) {
                const id = idPositivo(valor, "departamento");

                [departamentos] = await conexion.execute(
                    `SELECT id, nombre
                     FROM departamentos
                     WHERE id = ? AND vigente = 1
                     FOR SHARE`,
                    [id]
                );
            } else {
                const nombreDepartamento = texto(
                    departamentoRecibido,
                    "departamento",
                    255
                );

                [departamentos] = await conexion.execute(
                    `SELECT id, nombre
                     FROM departamentos
                     WHERE nombre = ? AND vigente = 1
                     FOR SHARE`,
                    [nombreDepartamento]
                );
            }

            if (departamentos.length !== 1) {
                throw new ErrorValidacion(
                    "Selecciona un departamento vigente y válido."
                );
            }

            departamentoId = departamentos[0].id;
            departamentoNombre = departamentos[0].nombre;
        }

        if (!esConsulta && !departamentoId) {
            throw new ErrorValidacion(
                "Debes seleccionar el departamento del requerimiento."
            );
        }

        const agente = await obtenerAgente(conexion);
        let ciudadanoId = null;

        if (!solicitaAnonimo) {
            ciudadanoId = idPositivo(
                datos.ciudadano_id ?? datos.citizenId,
                "ciudadano"
            );

            if (ciudadanoId) {
                const [ciudadanos] = await conexion.execute(
                    `SELECT id
                     FROM av_ciudadanos
                     WHERE id = ? AND fecha_anonimizacion IS NULL
                     FOR SHARE`,
                    [ciudadanoId]
                );

                if (!ciudadanos.length) {
                    throw new ErrorValidacion(
                        "El ciudadano seleccionado no está disponible en Atención Vecinal."
                    );
                }
            } else if (nombre) {
                const [nuevoCiudadano] = await conexion.execute(
                    `INSERT INTO av_ciudadanos (nombre, apellido, telefono, correo)
                     VALUES (?, ?, ?, ?)`,
                    [nombre, apellido || null, telefono || null, correo || null]
                );

                ciudadanoId = nuevoCiudadano.insertId;
            }
        }

        if (!esConsulta && !ciudadanoId) {
            throw new ErrorValidacion(
                "Para registrar un requerimiento debes identificar al ciudadano."
            );
        }

        const esAnonimo = ciudadanoId ? 0 : 1;

        const [fecha] = await conexion.query(
            "SELECT YEAR(CURRENT_DATE()) AS anio"
        );
        const anio = Number(fecha[0].anio);

        await conexion.execute(
            `INSERT INTO av_folios (anio, ultimo)
             VALUES (?, 0)
             ON DUPLICATE KEY UPDATE ultimo = ultimo`,
            [anio]
        );

        const [folios] = await conexion.execute(
            `SELECT ultimo FROM av_folios WHERE anio = ? FOR UPDATE`,
            [anio]
        );

        const siguiente = Number(folios[0].ultimo) + 1;
        const numeroTicket = `AV-${anio}-${String(siguiente).padStart(6, "0")}`;

        if (numeroTicket.length > 20) {
            throw new Error("Se superó la longitud del número de atención.");
        }

        await conexion.execute(
            "UPDATE av_folios SET ultimo = ? WHERE anio = ?",
            [siguiente, anio]
        );

        const [resultado] = await conexion.execute(
            `INSERT INTO av_tickets (
                numero_ticket, es_anonimo, ciudadano_id, agente_id,
                departamento_id, tipo_llamada, estado_transferencia,
                estado, asunto, detalles, fecha_cierre
             )
             VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                CASE WHEN ? = 'cerrado' THEN CURRENT_TIMESTAMP ELSE NULL END
             )`,
            [
                numeroTicket,
                esAnonimo,
                ciudadanoId,
                agente.id,
                departamentoId,
                tipoLlamada,
                estadoTransferencia,
                estado,
                asunto,
                detalles,
                estado,
            ]
        );

        const descripcionCreacion = [
            esConsulta
                ? "Consulta telefónica registrada y cerrada automáticamente."
                : "Requerimiento registrado en estado abierto.",
            estadoTransferencia
                ? `Llamada transferida: ${NOMBRES_TRANSFERENCIA[estadoTransferencia]}.`
                : "",
            departamentoNombre
                ? `Departamento asociado: ${departamentoNombre}.`
                : "Sin departamento asociado.",
            area ? `Área: ${area}` : "",
            pendienteInformacion
                ? observacionesPendientes
                    ? `Antecedentes pendientes: ${observacionesPendientes}`
                    : "Quedaron antecedentes pendientes de información."
                : "",
        ].filter(Boolean).join("\n");

        await conexion.execute(
            `INSERT INTO av_historial_tickets (
                ticket_id, tipo_evento, agente_id, agente_nombre,
                estado_anterior, estado_nuevo, departamento_nuevo_id,
                departamento_nuevo_nombre, comentario
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                resultado.insertId,
                "creacion",
                agente.id,
                agente.nombre,
                null,
                estado,
                departamentoId,
                departamentoNombre,
                descripcionCreacion,
            ]
        );

        await conexion.commit();

        res.status(201).json({
            success: true,
            message: esConsulta
                ? "Consulta registrada y cerrada automáticamente."
                : "Requerimiento registrado en estado abierto.",
            data: {
                id: resultado.insertId,
                numero_ticket: numeroTicket,
                estado,
                tipo_llamada: tipoLlamada,
                estado_transferencia: estadoTransferencia,
                es_anonimo: esAnonimo,
                ciudadano_id: ciudadanoId,
                agente_id: agente.id,
                departamento_id: departamentoId,
                asunto,
                detalles,
            },
        });
    } catch (error) {
        if (conexion) await conexion.rollback().catch(() => {});
        responderError(res, error, "Error al registrar atención:");
    } finally {
        if (conexion) conexion.release();
    }
});

// Consultar el detalle y el historial.
router.get("/:id", async (req, res) => {
    try {
        const id = idPositivo(req.params.id, "ticket");

        const [tickets] = await pool.execute(
            `SELECT
                t.id, t.numero_ticket, t.es_anonimo, t.ciudadano_id,
                t.agente_id, t.departamento_id, t.tipo_llamada,
                t.estado_transferencia, t.estado, t.asunto,
                t.detalles, t.detalles AS descripcion,
                t.fecha_creacion, t.fecha_cierre,
                CASE
                    WHEN t.es_anonimo = 1 OR t.ciudadano_id IS NULL
                    THEN CONCAT('Anónimo ', t.id)
                    ELSE TRIM(CONCAT(COALESCE(c.nombre, ''), ' ',
                                     COALESCE(c.apellido, '')))
                END AS ciudadano,
                CASE WHEN t.es_anonimo = 1 THEN NULL ELSE c.telefono END
                    AS ciudadano_telefono,
                CASE WHEN t.es_anonimo = 1 THEN NULL ELSE c.correo END
                    AS ciudadano_correo,
                COALESCE(a.nombre, 'Registro del sistema') AS agente,
                COALESCE(d.nombre, 'Sin departamento asignado') AS departamento
             FROM av_tickets AS t
             LEFT JOIN av_ciudadanos AS c ON c.id = t.ciudadano_id
             LEFT JOIN av_agentes AS a ON a.id = t.agente_id
             LEFT JOIN departamentos AS d ON d.id = t.departamento_id
             WHERE t.id = ?`,
            [id]
        );

        if (!tickets.length) {
            throw new ErrorValidacion("La atención vecinal no existe.", 404);
        }

        const [historial] = await pool.execute(
            `SELECT
                h.id, h.tipo_evento, h.estado_anterior, h.estado_nuevo,
                h.departamento_anterior_id, h.departamento_anterior_nombre,
                h.departamento_nuevo_id, h.departamento_nuevo_nombre,
                h.comentario, h.fecha AS fecha_registro,
                COALESCE(h.agente_nombre, a.nombre, 'Registro del sistema')
                    AS agente
             FROM av_historial_tickets AS h
             LEFT JOIN av_agentes AS a ON a.id = h.agente_id
             WHERE h.ticket_id = ?
             ORDER BY h.fecha DESC, h.id DESC`,
            [id]
        );

        res.json({ success: true, ticket: tickets[0], historial });
    } catch (error) {
        responderError(res, error, "Error al consultar detalle:");
    }
});

// Registrar un avance, cambio de estado, transferencia o derivación.
router.patch("/:id", async (req, res) => {
    let conexion;

    try {
        const id = idPositivo(req.params.id, "ticket");
        const datos = req.body;
        validarObjeto(datos);

        const anonimizar =
            esVerdadero(datos.solicitar_anonimizacion_post_cierre) ||
            esVerdadero(datos.anonymize);

        const comentario = texto(
            datos.comentario ?? datos.comentario_bitacora,
            "observaciones",
            4000
        );

        const estadoRecibido = datos.estado ?? datos.nuevo_estado;
        let estadoSolicitado;

        if (estadoRecibido !== undefined) {
            estadoSolicitado = normalizar(estadoRecibido);

            if (!ESTADOS_VALIDOS.includes(estadoSolicitado)) {
                throw new ErrorValidacion(
                    "El estado debe ser abierto, en_proceso o cerrado."
                );
            }
        }

        if (!anonimizar && !comentario) {
            throw new ErrorValidacion(
                "Debes ingresar una observación del seguimiento."
            );
        }

        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [tickets] = await conexion.execute(
            `SELECT id, estado, tipo_llamada, departamento_id,
                    es_anonimo, ciudadano_id, estado_transferencia
             FROM av_tickets
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (!tickets.length) {
            throw new ErrorValidacion("La atención vecinal no existe.", 404);
        }

        const ticket = tickets[0];

        if (
            datos.estado_actual !== undefined &&
            normalizar(datos.estado_actual) !== ticket.estado
        ) {
            throw new ErrorValidacion(
                "El estado cambió. Recarga el detalle antes de guardar.",
                409
            );
        }

        if (tienePropiedad(datos, "estado_transferencia_actual")) {
            const esperado =
                datos.estado_transferencia_actual === null
                    ? null
                    : validarResultadoTransferencia(datos.estado_transferencia_actual);

            if (esperado !== ticket.estado_transferencia) {
                throw new ErrorValidacion(
                    "El resultado de transferencia cambió. Recarga el detalle.",
                    409
                );
            }
        }

        const agente = await obtenerAgente(conexion);
        let departamentoAnteriorNombre = null;

        if (ticket.departamento_id !== null) {
            const [anteriores] = await conexion.execute(
                "SELECT nombre FROM departamentos WHERE id = ?",
                [ticket.departamento_id]
            );

            departamentoAnteriorNombre = anteriores[0]?.nombre || null;
        }

        if (anonimizar) {
            if (
                ticket.tipo_llamada !== "requerimiento" ||
                ticket.estado !== "cerrado"
            ) {
                throw new ErrorValidacion(
                    "La desvinculación solo está disponible para requerimientos cerrados."
                );
            }

            if (Number(ticket.es_anonimo) === 1 && ticket.ciudadano_id === null) {
                throw new ErrorValidacion("Este requerimiento ya está desvinculado.");
            }

            await conexion.execute(
                `UPDATE av_tickets
                 SET es_anonimo = 1, ciudadano_id = NULL, es_anonimizado = 1
                 WHERE id = ?`,
                [id]
            );

            await conexion.execute(
                `INSERT INTO av_historial_tickets (
                    ticket_id, tipo_evento, agente_id, agente_nombre,
                    estado_anterior, estado_nuevo, departamento_anterior_id,
                    departamento_anterior_nombre, departamento_nuevo_id,
                    departamento_nuevo_nombre, comentario
                 )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    "anonimizacion",
                    agente.id,
                    agente.nombre,
                    ticket.estado,
                    ticket.estado,
                    ticket.departamento_id,
                    departamentoAnteriorNombre,
                    ticket.departamento_id,
                    departamentoAnteriorNombre,
                    "Se desvinculó al ciudadano de este requerimiento. Se conserva el historial de gestión.",
                ]
            );

            await conexion.commit();

            return res.json({
                success: true,
                message: "Ciudadano desvinculado. La operación quedó registrada.",
            });
        }

        if (ticket.tipo_llamada === "consulta_rapida") {
            throw new ErrorValidacion(
                "Las consultas quedan cerradas automáticamente y son de solo lectura."
            );
        }

        if (ticket.estado === "cerrado") {
            throw new ErrorValidacion(
                "El requerimiento está cerrado y no admite cambios operativos.",
                409
            );
        }

        const nuevoEstado = estadoSolicitado ?? ticket.estado;
        let nuevaTransferencia = ticket.estado_transferencia;
        let observacionTransferencia = "";

        if (tienePropiedad(datos, "estado_transferencia")) {
            nuevaTransferencia =
                datos.estado_transferencia === null
                    ? null
                    : validarResultadoTransferencia(datos.estado_transferencia);

            if (nuevaTransferencia !== ticket.estado_transferencia) {
                const nombreAnterior =
                    NOMBRES_TRANSFERENCIA[ticket.estado_transferencia] ||
                    "Sin transferencia";

                const nombreNuevo =
                    NOMBRES_TRANSFERENCIA[nuevaTransferencia] ||
                    "Sin transferencia";

                observacionTransferencia =
                    `\n\nTransferencia: ${nombreAnterior} → ${nombreNuevo}.`;
            }
        }

        let departamentoNuevoId = ticket.departamento_id;
        let departamentoNuevoNombre = departamentoAnteriorNombre;

        if (tienePropiedad(datos, "departamento_id")) {
            departamentoNuevoId = idPositivo(datos.departamento_id, "departamento");

            if (!departamentoNuevoId) {
                throw new ErrorValidacion(
                    "Selecciona un departamento para la derivación."
                );
            }

            const [departamentos] = await conexion.execute(
                `SELECT id, nombre
                 FROM departamentos
                 WHERE id = ? AND vigente = 1
                 FOR SHARE`,
                [departamentoNuevoId]
            );

            if (!departamentos.length) {
                throw new ErrorValidacion(
                    "El departamento no existe o no está vigente."
                );
            }

            departamentoNuevoNombre = departamentos[0].nombre;
        }

        const cambioDepartamento = departamentoNuevoId !== ticket.departamento_id;
        const cambioEstado = nuevoEstado !== ticket.estado;
        const tipoEvento = cambioDepartamento
            ? "derivacion"
            : cambioEstado
                ? "cambio_estado"
                : "seguimiento";

        await conexion.execute(
            `UPDATE av_tickets
             SET estado = ?,
                 departamento_id = ?,
                 estado_transferencia = ?,
                 fecha_cierre = CASE
                     WHEN ? = 'cerrado' THEN CURRENT_TIMESTAMP
                     ELSE NULL
                 END
             WHERE id = ?`,
            [nuevoEstado, departamentoNuevoId, nuevaTransferencia, nuevoEstado, id]
        );

        await conexion.execute(
            `INSERT INTO av_historial_tickets (
                ticket_id, tipo_evento, agente_id, agente_nombre,
                estado_anterior, estado_nuevo, departamento_anterior_id,
                departamento_anterior_nombre, departamento_nuevo_id,
                departamento_nuevo_nombre, comentario
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                tipoEvento,
                agente.id,
                agente.nombre,
                ticket.estado,
                nuevoEstado,
                ticket.departamento_id,
                departamentoAnteriorNombre,
                departamentoNuevoId,
                departamentoNuevoNombre,
                comentario + observacionTransferencia,
            ]
        );

        await conexion.commit();

        res.json({
            success: true,
            message: "Gestión registrada correctamente.",
            ticket: {
                id,
                estado: nuevoEstado,
                departamento_id: departamentoNuevoId,
                estado_transferencia: nuevaTransferencia,
            },
        });
    } catch (error) {
        if (conexion) await conexion.rollback().catch(() => {});
        responderError(res, error, "Error al registrar seguimiento:");
    } finally {
        if (conexion) conexion.release();
    }
});

module.exports = router;