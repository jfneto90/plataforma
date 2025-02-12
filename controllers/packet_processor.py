import struct
from datetime import datetime

class PacketProcessor:
    @staticmethod
    def parse_packet(hex_data):
        """
        Identifica o tipo do pacote e extrai os dados relevantes.
        """
        try:
            data_bytes = bytes.fromhex(hex_data)

            # Identificar pacote de login (0x01)
            if hex_data[6:8] == "01":
                imei = hex_data[8:24]
                id_disp = imei[-9:]
                return {"tipo": "login", "id_disp": id_disp}

            # Identificar pacote de posição (0x22)
            elif hex_data[6:8] == "22":
                year, month, day, hour, minute, second = struct.unpack('6B', data_bytes[4:10])
                data_hora = datetime(year + 2000, month, day, hour, minute, second)

                curso_status = hex_data[40:44].zfill(4)
                latitude = int(hex_data[22:30], 16) / 1800000
                if bin(int(curso_status, 16))[2:].zfill(16)[5] == '0':
                    latitude *= -1
                longitude = int(hex_data[30:38], 16) / 1800000
                if bin(int(curso_status, 16))[2:].zfill(16)[4] == '1':
                    longitude *= -1

                velocidade = int(hex_data[38:40], 16)
                satelites = int(hex_data[21], 16)
                acc = hex_data[60:62]

                return {"tipo": "posicao", "data": (data_hora, latitude, longitude, velocidade, curso_status, satelites, acc)}

            # Identificar pacote de heartbeat (0x13) -> nível da bateria backup
            elif hex_data[6:8] == "13":
                bateria_backup = int(hex_data[10:12], 16)
                return {"tipo": "heartbeat", "bateria_backup": bateria_backup}

            # Identificar pacote de voltagem da bateria externa (0x94)
            elif hex_data[8:10] == "94":
                bateria_externa = int(hex_data[12:16], 16) / 100
                return {"tipo": "bateria_externa", "bateria_externa": bateria_externa}

            else:
                return None
        except Exception as e:
            print(f'Erro ao processar pacote: {e}')
            return None

    @staticmethod
    def criar_resposta_login():
        """
        Gera a resposta ao login conforme protocolo.
        """
        return bytes.fromhex("78780D010000CCF40D0A")

    @staticmethod
    def criar_resposta_heartbeat():
        """
        Gera a resposta ao heartbeat conforme protocolo.
        """
        return bytes.fromhex("78780A130001D3CA0D0A")
