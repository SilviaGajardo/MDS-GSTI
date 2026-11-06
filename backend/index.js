require("dotenv").config();

const express = require("express");
const cors = require("cors");

const departamentosRoutes = require("./routes/departamentos.routes");
const ticketsRoutes = require("./routes/tickets.routes");

const app = express();

const PORT = Number(process.env.PORT) || 4002;
const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3001";
const atencionVecinalRoutes = require(
    "./routes/atencionVecinal.routes"
);

app.use(
    cors({
        origin: FRONTEND_URL,
    })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/salud", (req, res) => {
    res.json({
        ok: true,
        mensaje: "Backend de Gestión de Servicios TI funcionando",
    });
});

app.use("/api/ti/departamentos", departamentosRoutes);
app.use("/api/ti/tickets", ticketsRoutes);
app.use("/api/vecinal/tickets", atencionVecinalRoutes);

app.use((req, res) => {
    res.status(404).json({
        ok: false,
        mensaje: "Ruta no encontrada.",
    });
});

const servidor = app.listen(PORT, "127.0.0.1", () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

servidor.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`El puerto ${PORT} ya está ocupado.`);
    } else {
        console.error(
            "No se pudo iniciar el servidor:",
            error.message
        );
    }

    process.exitCode = 1;
});