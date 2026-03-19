<?php
/**
 * Configuração de Conexão com MySQL na Hostinger
 * Portal de Atendimento JKINGS
 */

// Configurações do banco de dados
define('DB_HOST', 'auth-db718.hstgr.io');
define('DB_USER', 'u856380736_jkings');
define('DB_PASS', 'Jk1210**');
define('DB_NAME', 'u856380736_portal');
define('DB_PORT', 3306);

// Headers CORS para permitir requisições do frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Lidar com requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Classe para gerenciar conexão com banco de dados
class Database {
    private $connection;
    private $error;

    public function __construct() {
        $this->connect();
    }

    private function connect() {
        try {
            $this->connection = new mysqli(
                DB_HOST,
                DB_USER,
                DB_PASS,
                DB_NAME,
                DB_PORT
            );

            if ($this->connection->connect_error) {
                throw new Exception("Erro de conexão: " . $this->connection->connect_error);
            }

            $this->connection->set_charset("utf8mb4");
        } catch (Exception $e) {
            $this->error = $e->getMessage();
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao conectar ao banco de dados']);
            exit();
        }
    }

    public function getConnection() {
        return $this->connection;
    }

    public function query($sql) {
        $result = $this->connection->query($sql);
        if (!$result) {
            throw new Exception("Erro na query: " . $this->connection->error);
        }
        return $result;
    }

    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }

    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }

    public function close() {
        $this->connection->close();
    }
}

// Função auxiliar para retornar JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Função para tratamento de erros
function sendError($message, $statusCode = 400) {
    sendResponse(['error' => $message], $statusCode);
}

// Inicializar banco de dados
$db = new Database();
