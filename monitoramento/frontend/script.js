// Verifica se o usuário está logado
if (!localStorage.getItem("token")) {
    window.location.href = "login.html"; // Redireciona para o login se não estiver autenticado
}


let map;
let marker;
let monitorID = null; // ID do dispositivo a ser monitorado

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -23.55052, lng: -46.633308 }, // Localização inicial genérica
        zoom: 12
    });

    fetchData(); // Busca inicial
    setInterval(fetchData, 5000); // Atualiza os dados a cada 5 segundos
}

// Define o ID do dispositivo a ser monitorado
function setMonitorID() {
    monitorID = document.getElementById("search-id").value.trim();
    console.log("Monitorando ID:", monitorID);
    fetchData(); // Atualiza os dados imediatamente após selecionar um ID
}

// Função para limpar o ID monitorado e voltar a atualizar tudo
function clearMonitorID() {
    monitorID = null;
    document.getElementById("search-id").value = "";
    console.log("Monitoramento resetado. Exibindo todas as posições.");
    fetchData(); // Atualiza os dados imediatamente após limpar a pesquisa
}

function fetchData() {
    const token = localStorage.getItem("token"); // Pega o token salvo no login

    fetch("http://localhost:5000/posicoes", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Erro ao buscar posições");
        }
        return response.json();
    })
    .then(data => {
        if (data.length > 0) {
            let posicao = data[0];

            updateInfo(posicao);
            updateMap(posicao);
            fetchAddress(posicao.latitude, posicao.longitude);
        }
    })
    .catch(error => console.error("Erro ao buscar dados:", error));
}


function updateInfo(posicao) {
    document.getElementById("id_disp").textContent = posicao.id_disp;
    document.getElementById("latitude").textContent = posicao.latitude.toFixed(5);
    document.getElementById("longitude").textContent = posicao.longitude.toFixed(5);
    document.getElementById("velocidade").textContent = posicao.velocidade;

    // Converte a data para GMT-3
    const dataUTC = new Date(posicao.data_hora);
    dataUTC.setHours(dataUTC.getHours() - 3);
    document.getElementById("data_hora").textContent = dataUTC.toLocaleString("pt-BR");

    // Atualiza a ignição (ACC)
    const ignicaoElement = document.getElementById("ignicao");
    ignicaoElement.style.backgroundColor = Number(posicao.acc) === 1 ? "green" : "red";

    // Atualiza a bateria externa
    document.getElementById("bateria_externa").textContent = posicao.bateria_externa !== null ? posicao.bateria_externa.toFixed(2) + " V" : "-";

    // Convertendo nível da bateria backup conforme a tabela
    const niveisBateria = ["Desligado", "Extremamente Baixa", "Muito Fraca", "Fraca", "Média", "Alta", "Cheia"];
    document.getElementById("bateria_backup").textContent = niveisBateria[posicao.bateria_backup] || "-";
}

// Atualiza o mapa com a nova localização
function updateMap(posicao) {
    if (marker) {
        marker.setMap(null);
    }

    // Define um ícone de carro personalizado
    const carIcon = {
        url: "icon/moto.png", // URL da imagem do carro (pode ser alterada)
        scaledSize: new google.maps.Size(55, 55), // Tamanho do ícone (ajustável)
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 20)
    };

    marker = new google.maps.Marker({
        position: { lat: posicao.latitude, lng: posicao.longitude },
        map: map,
        title: `ID: ${posicao.id_disp}`,
        icon: carIcon // Aplica o novo ícone
    });

    map.setCenter({ lat: posicao.latitude, lng: posicao.longitude });
}


// Função para buscar o endereço com base na latitude/longitude
function fetchAddress(lat, lng) {
    const geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyD-ZLOhjDnOjp7gXI7z1KT8f0DClhO0tO0`;

    fetch(geocodeURL)
        .then(response => response.json())
        .then(data => {
            if (data.status === "OK" && data.results.length > 0) {
                document.getElementById("endereco").textContent = data.results[0].formatted_address;
            } else {
                document.getElementById("endereco").textContent = "Endereço não encontrado";
            }
        })
        .catch(error => {
            console.error("Erro ao buscar endereço:", error);
            document.getElementById("endereco").textContent = "Erro ao obter endereço";
        });
}

window.onload = initMap;
