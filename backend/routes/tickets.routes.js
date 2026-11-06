
const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const {
    enviarConfirmacionTicket,
} = require("../services/correoTickets");

router.get("/", async (req, res) => {
    try {
        const [tickets] = await pool.query(`
            SELECT
                t.id,
                t.numero_ticket,
                t.asunto,
                t.categoria,
                t.solicitante,
                t.correo_solicitante,
                t.sentido,
                t.prioridad,
                t.estado,
                t.departamento_id,
                d.nombre AS departamento,
                t.fecha_creacion,
                t.fecha_cierre
            FROM gsti_tickets AS t
            LEFT JOIN departamentos AS d
                ON d.id = t.departamento_id
            ORDER BY t.fecha_creacion DESC, t.id DESC
            LIMIT 100
        `);

        res.json({
            ok: true,
            tickets,
        });
    } catch (error) {
        console.error(
            "Error al consultar tickets:",
            error.code || error.message
        );

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar los tickets.",
        });
    }
});

router.get("/estadisticas", async (req, res) => {
    try {
        const [filas] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(estado = 'abierto'), 0) AS abiertos,
                COALESCE(SUM(estado = 'en_proceso'), 0) AS en_proceso,
                COALESCE(SUM(estado = 'cerrado'), 0) AS cerrados
            FROM gsti_tickets
        `);

        const datos = filas[0];

        res.json({
            ok: true,
            estadisticas: {
                total: Number(datos.total),
                abiertos: Number(datos.abiertos),
                en_proceso: Number(datos.en_proceso),
                cerrados: Number(datos.cerrados),
            },
        });
    } catch (error) {
        console.error(
            "Error al consultar estadísticas:",
            error.code || error.message
        );

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar las estadísticas.",
        });
    }
});

router.post("/", async (req, res) => {
    const datos = req.body;

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return res.status(400).json({
            ok: false,
            mensaje: "Debes enviar los datos del ticket.",
        });
    }

    // Límites de caracteres de los campos
    const limites = {
        asunto: 50,
        detalles: 200,
        solicitante: 150,
        correo_solicitante: 150,
        destinatario: 150,
    };

    const textos = {};

    for (const [campo, limite] of Object.entries(limites)) {
        const valor = datos[campo];

        if (
            valor !== undefined &&
            valor !== null &&
            typeof valor !== "string"
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: `El campo ${campo} debe ser un texto.`,
            });
        }

        textos[campo] = (valor ?? "").trim();

        if (textos[campo].length > limite) {
            return res.status(400).json({
                ok: false,
                mensaje: `El campo ${campo} admite hasta ${limite} caracteres.`,
            });
        }
    }

    if (!textos.asunto || !textos.detalles || !textos.solicitante) {
        return res.status(400).json({
            ok: false,
            mensaje: "Completa asunto, detalles y solicitante.",
        });
    }

    const sentido = datos.sentido ?? "recibida";
    const prioridad = datos.prioridad ?? "media";
    const categoria = datos.categoria;

    const categoriasPermitidas = [
        "Equipos",
        "Redes y conectividad",
        "Impresoras",
        "Otro",
    ];

    if (!categoriasPermitidas.includes(categoria)) {
        return res.status(400).json({
            ok: false,
            mensaje: "Selecciona una categoría válida.",
        });
    }

    const departamentoId = datos.departamento_id;

    if (!["recibida", "emitida"].includes(sentido)) {
        return res.status(400).json({
            ok: false,
            mensaje: "El sentido debe ser recibida o emitida.",
        });
    }

    if (!["baja", "media", "alta", "critica"].includes(prioridad)) {
        return res.status(400).json({
            ok: false,
            mensaje: "La prioridad no es válida.",
        });
    }

    if (!Number.isSafeInteger(departamentoId) || departamentoId <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: "Selecciona un departamento válido.",
        });
    }

    if (sentido === "emitida" && !textos.destinatario) {
        return res.status(400).json({
            ok: false,
            mensaje: "Indica el destinatario de la solicitud emitida.",
        });
    }

    if (
        textos.correo_solicitante &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textos.correo_solicitante)
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "El correo del solicitante no es válido.",
        });
    }

    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [departamentos] = await conexion.execute(
            `SELECT id, nombre
             FROM departamentos
             WHERE id = ? AND vigente = 1
             FOR SHARE`,
            [departamentoId]
        );

        if (!departamentos.length) {
            await conexion.rollback();

            return res.status(400).json({
                ok: false,
                mensaje: "El departamento no existe o no está vigente.",
            });
        }

        // Agente técnico temporal para las pruebas iniciales.
        const [agentes] = await conexion.execute(
            `SELECT id
             FROM gsti_agentes_telefonicos
             WHERE correo = ?
             LIMIT 1`,
            [""]
        );

        if (!agentes.length) {
            throw new Error("No está configurado el agente inicial.");
        }

        const agenteId = agentes[0].id;

        const [fecha] = await conexion.query(
            "SELECT YEAR(CURRENT_DATE()) AS anio"
        );

        const anio = Number(fecha[0].anio);

        // Esta operación bloquea el contador del año hasta el COMMIT.
        await conexion.execute(
            `INSERT INTO gsti_folios (anio, ultimo)
             VALUES (?, 0)
             ON DUPLICATE KEY UPDATE ultimo = ultimo`,
            [anio]
        );

        const [folios] = await conexion.execute(
            `SELECT ultimo
             FROM gsti_folios
             WHERE anio = ?
             FOR UPDATE`,
            [anio]
        );

        const siguiente = Number(folios[0].ultimo) + 1;

        const numeroTicket =
            `TI-${anio}-${String(siguiente).padStart(6, "0")}`;

        if (numeroTicket.length > 20) {
            throw new Error("Se superó la longitud del número de ticket.");
        }

        await conexion.execute(
            "UPDATE gsti_folios SET ultimo = ? WHERE anio = ?",
            [siguiente, anio]
        );

        const [resultado] = await conexion.execute(
            `INSERT INTO gsti_tickets (
                numero_ticket,
                agente_id,
                departamento_id,
                asunto,
                detalles,
                sentido,
                solicitante,
                correo_solicitante,
                destinatario,
                prioridad,
                categoria,
                estado,
                tipo_llamada
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                numeroTicket,
                agenteId,
                departamentoId,
                textos.asunto,
                textos.detalles,
                sentido,
                textos.solicitante,
                textos.correo_solicitante || null,
                textos.destinatario || null,
                prioridad,
                categoria,
                "abierto",
                "requerimiento",
            ]
        );

        await conexion.execute(
            `INSERT INTO gsti_historial_tickets (
                ticket_id,
                agente_id,
                estado_anterior,
                estado_nuevo,
                comentario
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                resultado.insertId,
                agenteId,
                "",
                "abierto",
                "Ticket creado mediante el registro inicial del sistema.",
            ]
        );

        await conexion.commit();

        // El ticket ya está guardado.
        // Liberamos la conexión antes de contactar al servidor de correo.
        conexion.release();
        conexion = undefined;

        let correo;

        try {
            correo = await enviarConfirmacionTicket({
                numero: numeroTicket,
                correo: textos.correo_solicitante,
                solicitante: textos.solicitante,
                asunto: textos.asunto,
                detalles: textos.detalles,
                categoria,
                prioridad,
                sentido,
                departamento: departamentos[0].nombre,
                destinatario: textos.destinatario,
            });
        } catch (errorCorreo) {
            console.error(
                `No se confirmó el correo del ticket ${numeroTicket}:`,
                errorCorreo.code || "ERROR_ENVIO"
            );

            correo = {
                estado: "no_confirmado",
                mensaje:
                    "El ticket se guardó, pero no se pudo confirmar el envío del correo. No vuelvas a crear el ticket.",
            };
        }

        return res.status(201).json({
            ok: true,
            mensaje: "Ticket creado correctamente.",
            ticket: {
                id: resultado.insertId,
                numero_ticket: numeroTicket,
                estado: "abierto",
            },
            correo,
        });

    } catch (error) {
        if (conexion) {
            await conexion.rollback().catch(() => {});
        }

        console.error(
            "Error al crear ticket:",
            error.code || error.message
        );

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudo crear el ticket.",
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

router.get("/:id", async (req, res) => {
    const idTexto = req.params.id;
    const id = Number(idTexto);

    if (
        !/^[1-9]\d*$/.test(idTexto) ||
        !Number.isSafeInteger(id)
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "El ID del ticket no es válido.",
        });
    }

    try {
        const [tickets] = await pool.execute(
            `SELECT
                t.id,
                t.numero_ticket,
                t.asunto,
                t.categoria,
                t.detalles,
                t.sentido,
                t.solicitante,
                t.correo_solicitante,
                t.destinatario,
                t.prioridad,
                t.estado,
                t.departamento_id,
                d.nombre AS departamento,
                t.agente_id,
                a.nombre AS agente,
                t.fecha_creacion,
                t.fecha_cierre
             FROM gsti_tickets AS t
             LEFT JOIN departamentos AS d
                ON d.id = t.departamento_id
             LEFT JOIN gsti_agentes_telefonicos AS a
                ON a.id = t.agente_id
             WHERE t.id = ?`,
            [id]
        );

        if (!tickets.length) {
            return res.status(404).json({
                ok: false,
                mensaje: "El ticket no existe.",
            });
        }

        const [historial] = await pool.execute(
            `SELECT
                h.id,
                h.estado_anterior,
                h.estado_nuevo,
                h.comentario,
                h.fecha,
                a.nombre AS agente
             FROM gsti_historial_tickets AS h
             LEFT JOIN gsti_agentes_telefonicos AS a
                ON a.id = h.agente_id
             WHERE h.ticket_id = ?
             ORDER BY h.fecha ASC, h.id ASC`,
            [id]
        );

        res.json({
            ok: true,
            ticket: tickets[0],
            historial,
        });
    } catch (error) {
        console.error(
            "Error al consultar el detalle del ticket:",
            error.code || error.message
        );

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo consultar el detalle del ticket.",
        });
    }
});

router.patch("/:id", async (req, res) => {
    const idTexto = req.params.id;
    const id = Number(idTexto);
    const datos = req.body;

    if (
        !/^[1-9]\d*$/.test(idTexto) ||
        !Number.isSafeInteger(id)
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "El ID del ticket no es válido.",
        });
    }

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return res.status(400).json({
            ok: false,
            mensaje: "Debes enviar los datos del cambio.",
        });
    }

    const estados = ["abierto", "en_proceso", "cerrado"];

    if (!estados.includes(datos.estado_actual)) {
        return res.status(400).json({
            ok: false,
            mensaje: "Debes indicar el estado actual del ticket.",
        });
    }

    if (
        datos.estado !== undefined &&
        !estados.includes(datos.estado)
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "El nuevo estado no es válido.",
        });
    }

    if (
        typeof datos.comentario !== "string" ||
        !datos.comentario.trim() ||
        datos.comentario.trim().length > 4000
    ) {
        return res.status(400).json({
            ok: false,
            mensaje: "Escribe un comentario de entre 1 y 4000 caracteres.",
        });
    }

    const comentario = datos.comentario.trim();
    let conexion;

    try {
        conexion = await pool.getConnection();
        await conexion.beginTransaction();

        const [tickets] = await conexion.execute(
            `SELECT id, numero_ticket, estado
             FROM gsti_tickets
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (!tickets.length) {
            await conexion.rollback();

            return res.status(404).json({
                ok: false,
                mensaje: "El ticket no existe.",
            });
        }

        const ticket = tickets[0];

        if (ticket.estado !== datos.estado_actual) {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: "El estado cambió. Actualiza el detalle antes de continuar.",
            });
        }

        if (ticket.estado === "cerrado") {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: "El ticket está cerrado y no admite modificaciones.",
            });
        }

        const nuevoEstado = datos.estado ?? ticket.estado;

        // Agente temporal utilizado durante las pruebas locales.
        const [agentes] = await conexion.execute(
            `SELECT id
             FROM gsti_agentes_telefonicos
             WHERE correo = ?
             LIMIT 1`,
            [""]
        );

        if (!agentes.length) {
            throw new Error("No está configurado el agente inicial.");
        }

        await conexion.execute(
            `UPDATE gsti_tickets
             SET estado = ?,
                 fecha_cierre = CASE
                    WHEN ? = 'cerrado' THEN CURRENT_TIMESTAMP
                    ELSE NULL
                 END
             WHERE id = ?`,
            [nuevoEstado, nuevoEstado, id]
        );

        await conexion.execute(
            `INSERT INTO gsti_historial_tickets (
                ticket_id,
                agente_id,
                estado_anterior,
                estado_nuevo,
                comentario
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                id,
                agentes[0].id,
                ticket.estado,
                nuevoEstado,
                comentario,
            ]
        );

        await conexion.commit();

        res.json({
            ok: true,
            mensaje: "Seguimiento registrado correctamente.",
            ticket: {
                id,
                numero_ticket: ticket.numero_ticket,
                estado: nuevoEstado,
            },
        });
    } catch (error) {
        if (conexion) {
            await conexion.rollback().catch(() => {});
        }

        console.error(
            "Error al registrar seguimiento:",
            error.code || error.message
        );

        res.status(500).json({
            ok: false,
            mensaje: "No se pudo registrar el seguimiento.",
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
});

module.exports = router;
