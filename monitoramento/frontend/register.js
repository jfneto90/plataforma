document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("mensagem");

    try {
        const resposta = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            mensagem.style.color = "green";
            mensagem.textContent = "Usuário cadastrado com sucesso!";
            setTimeout(() => {
                window.location.href = "login.html"; // Redireciona para login
            }, 2000);
        } else {
            mensagem.style.color = "red";
            mensagem.textContent = dados.error || "Erro ao cadastrar!";
        }

    } catch (error) {
        mensagem.style.color = "red";
        mensagem.textContent = "Erro ao conectar com o servidor.";
        console.error("Erro no frontend:", error);
    }
});
