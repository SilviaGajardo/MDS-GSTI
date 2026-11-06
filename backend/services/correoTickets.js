
const {
    obtenerTransporteCorreo,
} = require("../config/correo");

// IMPORTANTE:
// false = registra el ticket, pero no envía correos.
// true = habilita nuevamente el envío automático.
const ENVIO_CORREOS_ACTIVO = false;

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
        const equivalencias = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return equivalencias[caracter];
    });
}

async function enviarConfirmacionTicket(ticket) {
    if (!ticket.correo) {
        return {
            estado: "no_solicitado",
            mensaje: "No se indicó un correo para enviar la confirmación.",
        };
    }

    const prioridad =
        {
            baja: "Baja",
            media: "Media",
            alta: "Alta",
            critica: "Crítica",
        }[ticket.prioridad] || ticket.prioridad;

    const campos = [
        ["Número", ticket.numero],
        ["Estado inicial", "Abierto"],
        ["Tipo de solicitud", ticket.sentido === "emitida"
            ? "Emitida por TI"
            : "Recibida por TI"],
        ["Solicitante", ticket.solicitante],
        ["Asunto", ticket.asunto],
        ["Categoría", ticket.categoria],
        ["Prioridad", prioridad],
        ["Departamento", ticket.departamento],
        ["Destinatario", ticket.destinatario || "No indicado"],
    ];

    const texto = [
        `Hola, ${ticket.solicitante}.`,
        "",
        "Tu requerimiento fue registrado correctamente en Gestión de Servicios TI.",
        "",
        ...campos.map(([nombre, valor]) => `${nombre}: ${valor}`),
        "",
        "Descripción del requerimiento:",
        ticket.detalles,
        "",
        "Conserva este número para consultar por tu requerimiento.",
        "",
        "Municipalidad de Padre Hurtado",
        "Gestión de Servicios TI",
        "",
        "Este mensaje confirma el registro de la solicitud, no su resolución.",
    ].join("\n");

    const filasHTML = campos
        .map(
            ([nombre, valor]) => `
                <tr>
                    <td style="padding:10px;border-bottom:1px solid #e2e8f0;
                        width:35%;font-weight:bold;color:#475569;vertical-align:top;">
                        ${escaparHTML(nombre)}
                    </td>
                    <td style="padding:10px;border-bottom:1px solid #e2e8f0;
                        color:#0f172a;overflow-wrap:anywhere;">
                        ${escaparHTML(valor)}
                    </td>
                </tr>
            `
        )
        .join("");

    const html = `
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;
            color:#334155;">
            <table role="presentation" width="100%" cellspacing="0"
                cellpadding="0" style="padding:24px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0"
                            cellpadding="0"
                            style="max-width:640px;background:#ffffff;
                            border:1px solid #e2e8f0;border-radius:12px;">
                            <tr>
                                <td style="padding:24px;background:#285ec4;
                                    color:#ffffff;">
                                    <div style="font-size:12px;">
                                        Municipalidad de Padre Hurtado
                                    </div>
                                    <h1 style="margin:8px 0 0;font-size:22px;">
                                        Gestión de Servicios TI
                                    </h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:24px;">
                                    <h2 style="margin:0 0 16px;font-size:19px;
                                        color:#0f172a;">
                                        Tu ticket fue registrado
                                    </h2>

                                    <p style="font-size:14px;line-height:1.6;">
                                        Hola, ${escaparHTML(ticket.solicitante)}.
                                        Recibimos el registro de tu requerimiento.
                                        Su número es:
                                    </p>

                                    <div style="padding:16px;background:#eff6ff;
                                        border:1px solid #bfdbfe;
                                        border-radius:8px;text-align:center;
                                        font-size:23px;font-weight:bold;
                                        color:#285ec4;">
                                        ${escaparHTML(ticket.numero)}
                                    </div>

                                    <table width="100%" cellspacing="0"
                                        cellpadding="0"
                                        style="margin-top:20px;
                                        border-collapse:collapse;font-size:13px;">
                                        ${filasHTML}
                                    </table>

                                    <h3 style="margin:24px 0 10px;
                                        font-size:15px;color:#0f172a;">
                                        Descripción del requerimiento
                                    </h3>

                                    <div style="padding:16px;background:#f8fafc;
                                        border:1px solid #e2e8f0;
                                        border-radius:8px;font-size:14px;
                                        line-height:1.6;white-space:pre-wrap;
                                        overflow-wrap:anywhere;">${escaparHTML(ticket.detalles)}</div>

                                    <p style="margin-top:22px;font-size:13px;
                                        line-height:1.6;">
                                        Conserva este número para consultar
                                        por tu requerimiento.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:18px 24px;background:#f8fafc;
                                    font-size:11px;line-height:1.6;color:#64748b;">
                                    Este mensaje confirma el registro de la
                                    solicitud, no su resolución.
                                    <br>
                                    Municipalidad de Padre Hurtado ·
                                    Gestión de Servicios TI
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    // El correo se conserva como dato del ticket.
    // No se realiza ningún envío mientras esta opción esté desactivada.
    if (!ENVIO_CORREOS_ACTIVO) {
        return {
            estado: "desactivado",
            mensaje: "Ticket registrado. El envío automático de correos está desactivado.",
        };
    }

    // Envío original conservado para una futura implementación.
    const resultado = await obtenerTransporteCorreo().sendMail({
        from: process.env.SMTP_FROM,
        to: {
            name: ticket.solicitante,
            address: ticket.correo,
        },
        subject: `Confirmación de ticket ${ticket.numero} | Soporte TI`,
        text: texto,
        html,
        disableFileAccess: true,
        disableUrlAccess: true,
    });

    if (!resultado.accepted?.length) {
        throw new Error("El servidor no aceptó el destinatario.");
    }

    return {
        estado: "aceptado",
        mensaje: "La confirmación fue aceptada por el servidor de correo.",
    };
}

module.exports = {
    enviarConfirmacionTicket,
};
