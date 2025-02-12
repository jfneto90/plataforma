const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "plataforma"
});

db.connect(err => {
    if (err) {
        console.error("Erro ao conectar no banco:", err);
    } else {
        console.log("Conectado ao MySQL");
    }
});

module.exports = db;
