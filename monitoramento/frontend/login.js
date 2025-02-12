document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const resposta = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
        localStorage.setItem("token", dados.token);
        window.location.href = "index.html"; // Redireciona para o painel principal
    } else {
        document.getElementById("mensagem").textContent = dados.error;
    }
});
