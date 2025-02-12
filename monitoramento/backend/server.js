require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "monitoramento"
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
        return;
    }
    console.log("Conectado ao banco de dados MySQL");
});

// 🔹 Rota para registrar um usuário
app.post("/register", async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    try {
        db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
            if (err) return res.status(500).json({ error: "Erro ao verificar email" });

            if (results.length > 0) {
                return res.status(400).json({ error: "Este email já está cadastrado!" });
            }

            // Criptografa a senha antes de salvar
            const salt = await bcrypt.genSalt(10);
            const senhaCriptografada = await bcrypt.hash(senha, salt);

            db.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", 
            [nome, email, senhaCriptografada], (err, result) => {
                if (err) return res.status(500).json({ error: "Erro ao registrar usuário" });
                res.status(201).json({ message: "Usuário registrado com sucesso!" });
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// 🔹 Rota de login
app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erro no servidor" });

        if (results.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

        const usuario = results[0];

        // Verifica a senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

        // Gera um token JWT
        const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({ message: "Login bem-sucedido", token });
    });
});

// 🔹 Middleware para proteger rotas
const autenticarToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Acesso negado" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: "Token inválido" });
    }
};

// 🔹 Exemplo de rota protegida
app.get("/perfil", autenticarToken, (req, res) => {
    res.json({ message: "Acesso autorizado", usuario: req.usuario });
});

// 🔹 Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

app.get("/posicoes", (req, res) => {
    db.query("SELECT id_disp, data_hora, latitude, longitude, velocidade, acc, bateria_externa, bateria_backup FROM posicoes ORDER BY data_hora DESC LIMIT 10", 
    (err, result) => {
        if (err) {
            console.error("Erro ao buscar posições:", err);
            return res.status(500).json({ error: "Erro ao buscar posições" });
        }
        res.json(result);
    });
});
