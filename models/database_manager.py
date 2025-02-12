import mysql.connector

class DatabaseManager:
    def __init__(self, host='localhost', user='root', password='', database='plataforma'):
        """
        Inicializa a conexão com o banco de dados e cria as tabelas se não existirem.
        """
        self.connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        self.cursor = self.connection.cursor()
        self.create_tables()

    def create_tables(self):
        """
        Cria as tabelas necessárias no banco de dados.
        """
        # Criar a tabela de posições
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS posicoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_disp VARCHAR(50),
                data_hora DATETIME,
                latitude FLOAT,
                longitude FLOAT,
                velocidade INT,
                curso_status INT,
                satelites INT,
                acc BOOLEAN,
                bateria_externa FLOAT NULL,
                bateria_backup INT NULL
            )
        ''')

        # Criar a tabela de dispositivos (associando id_disp à porta do socket)
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS dispositivos (
                id_disp VARCHAR(50) PRIMARY KEY,
                porta INT
            )
        ''')

        # Criar a tabela de bateria (armazena última bateria de cada dispositivo)
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS bateria (
                id_disp VARCHAR(50) PRIMARY KEY,
                bateria_externa FLOAT NULL,
                bateria_backup INT NULL
            )
        ''')

        self.connection.commit()

    def insert_dispositivo(self, id_disp, porta):
        """
        Registra um dispositivo e sua porta no banco de dados.
        Se o dispositivo já existir, apenas atualiza a porta.
        """
        query = '''
            INSERT INTO dispositivos (id_disp, porta) VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE porta=%s
        '''
        self.cursor.execute(query, (id_disp, porta, porta))
        self.connection.commit()

    def get_dispositivo_por_porta(self, porta):
        """
        Retorna o ID do dispositivo associado a uma porta.
        """
        query = 'SELECT id_disp FROM dispositivos WHERE porta = %s'
        self.cursor.execute(query, (porta,))
        result = self.cursor.fetchone()
        return result[0] if result else None

    def insert_bateria(self, id_disp, bateria_externa=None, bateria_backup=None):
        """
        Insere ou atualiza os dados de bateria de um dispositivo.
        """
        query = '''
            INSERT INTO bateria (id_disp, bateria_externa, bateria_backup) 
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
            bateria_externa = COALESCE(%s, bateria_externa),
            bateria_backup = COALESCE(%s, bateria_backup)
        '''
        self.cursor.execute(query, (id_disp, bateria_externa, bateria_backup, bateria_externa, bateria_backup))
        self.connection.commit()

    def get_bateria(self, id_disp):
        """
        Obtém os níveis de bateria para um dispositivo específico.
        """
        query = 'SELECT bateria_externa, bateria_backup FROM bateria WHERE id_disp = %s'
        self.cursor.execute(query, (id_disp,))
        result = self.cursor.fetchone()
        return result if result else (None, None)

    def insert_data(self, id_disp, data):
        """
        Insere dados de posição e bateria
        """
        bateria_externa, bateria_backup = self.get_bateria(id_disp)

        query = '''
            INSERT INTO posicoes (id_disp, data_hora, latitude, longitude, velocidade, curso_status, satelites, acc, bateria_externa, bateria_backup)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        self.cursor.execute(query, (id_disp, *data, bateria_externa, bateria_backup))
        self.connection.commit()

    def close(self):
        self.cursor.close()
        self.connection.close()
