<?php
/**
 * Configuração de Conexão com MySQL - Portal de Atendimento JKINGS
 *
 * SEGURANÇA: As credenciais são carregadas a partir de variáveis de ambiente
 * definidas no arquivo .env na raiz do projeto. Nunca coloque senhas diretamente
 * neste arquivo.
 *
 * Para configurar, copie .env.example para .env e preencha os valores reais.
 */

// Carregar variáveis de ambiente do arquivo .env (se existir)
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if (!array_key_exists($key, $_ENV)) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }
}

// Leitura segura das variáveis de ambiente
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbUser = getenv('DB_USER') ?: '';
$dbPass = getenv('DB_PASSWORD') ?: '';
$dbName = getenv('DB_NAME') ?: '';
$dbPort = (int)(getenv('DB_PORT') ?: 3306);

if (empty($dbUser) || empty($dbPass) || empty($dbName)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuração de banco de dados ausente. Verifique o arquivo .env.']);
    exit();
}

// Headers CORS — restrinja Access-Control-Allow-Origin ao domínio real em produção
$allowedOrigin = getenv('CORS_ALLOWED_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Lidar com requisições OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Classe para gerenciar conexão com banco de dados
class Database {
    private $connection;

    public function __construct(string $host, string $user, string $pass, string $name, int $port) {
        try {
            $this->connection = new mysqli($host, $user, $pass, $name, $port);

            if ($this->connection->connect_error) {
                throw new Exception("Erro de conexão: " . $this->connection->connect_error);
            }

            $this->connection->set_charset("utf8mb4");
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao conectar ao banco de dados']);
            exit();
        }
    }

    public function getConnection(): mysqli {
        return $this->connection;
    }

    public function query(string $sql): mysqli_result|bool {
        $result = $this->connection->query($sql);
        if ($result === false) {
            throw new Exception("Erro na query: " . $this->connection->error);
        }
        return $result;
    }

    /**
     * Prepara um statement parametrizado para evitar SQL Injection.
     * Prefira sempre este método em vez de escape() + interpolação.
     */
    public function prepare(string $sql): mysqli_stmt|false {
        return $this->connection->prepare($sql);
    }

    /** @deprecated Use prepare() com bind_param() para evitar SQL Injection. */
    public function escape(string $string): string {
        return $this->connection->real_escape_string($string);
    }

    public function close(): void {
        $this->connection->close();
    }
}

// Função auxiliar para retornar JSON
function sendResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Função para tratamento de erros
function sendError(string $message, int $statusCode = 400): void {
    sendResponse(['error' => $message], $statusCode);
}

// Inicializar banco de dados usando variáveis de ambiente
$db = new Database($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
