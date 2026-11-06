const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [departamentos] = await pool.query(`
            SELECT id, nombre, vigente, direccion_id
            FROM departamentos
            WHERE vigente = 1
            ORDER BY nombre
        `);

        res.json({
            ok: true,
            departamentos,
        });
    } catch (error) {
        console.error(
            "Error al consultar departamentos:",
            error.code || error.message
        );

        res.status(500).json({
            ok: false,
            mensaje: "No se pudieron consultar los departamentos.",
        });
    }
});

module.exports = router;