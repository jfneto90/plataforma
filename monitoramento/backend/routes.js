const express = require("express");
const db = require("./db");

const router = express.Router();

router.get("/posicoes", (req, res) => {
    db.query("SELECT id_disp, data_hora, latitude, longitude, velocidade, acc, bateria_externa, bateria_backup FROM posicoes ORDER BY data_hora DESC LIMIT 10", 
    (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(result);
    });
});

module.exports = router;
