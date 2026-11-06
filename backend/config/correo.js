const path = require("node:path");
const nodemailer = require("nodemailer");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env"),
});

let transporte;

function obtenerTransporteCorreo() {
    if (transporte) return transporte;

    const obligatorias = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_FROM",
    ];

    const faltantes = obligatorias.filter(
        (nombre) => !process.env[nombre]?.trim()
    );

    if (faltantes.length) {
        throw new Error(
            `Faltan variables de correo: ${faltantes.join(", ")}`
        );
    }

    const puerto = Number(process.env.SMTP_PORT);

    if (
        !Number.isInteger(puerto) ||
        puerto < 1 ||
        puerto > 65535
    ) {
        throw new Error("SMTP_PORT no es válido.");
    }

    transporte = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port: puerto,
        secure:
            process.env.SMTP_SECURE === undefined
                ? puerto === 465
                : process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });

    return transporte;
}

module.exports = {
    obtenerTransporteCorreo,
};