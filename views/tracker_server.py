import socket
import threading
from models.database_manager import DatabaseManager
from controllers.packet_processor import PacketProcessor
from datetime import datetime

class TrackerServer:
    def __init__(self, host='192.168.40.138', port=6666):
        self.host = host
        self.port = port
        self.db = DatabaseManager()

    def handle_client(self, client_socket, addr):
        with client_socket:
            while True:
                try:
                    data = client_socket.recv(1024)
                    if not data:
                        break
                    
                    hex_message = data.hex()
                    print(f'[{datetime.now()}] Conexão {addr} enviou: {hex_message}')
                    
                    processed_packet = PacketProcessor.parse_packet(hex_message)

                    if processed_packet:
                        if processed_packet["tipo"] == "login":
                            id_disp = processed_packet["id_disp"]
                            porta = addr[1]  # Porta do socket do dispositivo
                            
                            # Salvar dispositivo e enviar resposta
                            self.db.insert_dispositivo(id_disp, porta)
                            response = PacketProcessor.criar_resposta_login()
                            client_socket.send(response)
                            print(f"Login recebido de {id_disp}, resposta enviada.")

                        elif processed_packet["tipo"] == "posicao":
                            porta = addr[1]
                            id_disp = self.db.get_dispositivo_por_porta(porta)

                            if id_disp:
                                self.db.insert_data(id_disp, processed_packet["data"])
                                print(f'Dados de posição salvos para {id_disp}: {processed_packet["data"]}')

                        elif processed_packet["tipo"] == "heartbeat":
                            id_disp = self.db.get_dispositivo_por_porta(addr[1])
                            if id_disp:
                                self.db.insert_bateria(id_disp, bateria_backup=processed_packet["bateria_backup"])
                            response = PacketProcessor.criar_resposta_heartbeat()
                            client_socket.send(response)

                        elif processed_packet["tipo"] == "bateria_externa":
                            id_disp = self.db.get_dispositivo_por_porta(addr[1])
                            if id_disp:
                                self.db.insert_bateria(id_disp, bateria_externa=processed_packet["bateria_externa"])

                except Exception as e:
                    print(f'Erro ao lidar com a conexão {addr}: {e}')
                    break

    def start(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind((self.host, self.port))
        server.listen(5)
        print(f'Servidor ouvindo em {self.host}:{self.port}')

        try:
            while True:
                client_socket, addr = server.accept()
                print(f'Conexão aceita de {addr}')
                client_handler = threading.Thread(target=self.handle_client, args=(client_socket, addr))
                client_handler.start()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")
        finally:
            self.db.close()
            server.close()
