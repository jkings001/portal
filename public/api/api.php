<?php
/**
 * API Principal - Portal de Atendimento JKINGS
 * Endpoints para autenticação, chamados, notificações, etc.
 *
 * SEGURANÇA:
 * - Senhas armazenadas com password_hash() (bcrypt)
 * - Verificação com password_verify()
 * - Prepared statements para todas as queries com parâmetros
 * - CORS restrito via variável de ambiente CORS_ALLOWED_ORIGIN
 */

require_once 'config.php';

// Obter ação da requisição
$action = $_GET['action'] ?? $_POST['action'] ?? null;

// Obter dados JSON do corpo da requisição
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($action) {
        // ==================== AUTENTICAÇÃO ====================
        case 'login':
            handleLogin($db, $input);
            break;

        case 'logout':
            handleLogout();
            break;

        case 'getUser':
            handleGetUser($db, $input);
            break;

        // ==================== CHAMADOS ====================
        case 'listTickets':
            handleListTickets($db);
            break;

        case 'getTicketsByUser':
            handleGetTicketsByUser($db, $input);
            break;

        case 'createTicket':
            handleCreateTicket($db, $input);
            break;

        case 'updateTicketStatus':
            handleUpdateTicketStatus($db, $input);
            break;

        // ==================== NOTIFICAÇÕES ====================
        case 'getNotifications':
            handleGetNotifications($db, $input);
            break;

        case 'markNotificationAsRead':
            handleMarkNotificationAsRead($db, $input);
            break;

        // ==================== USUÁRIOS ====================
        case 'listUsers':
            handleListUsers($db);
            break;

        case 'createUser':
            handleCreateUser($db, $input);
            break;

        case 'updateUser':
            handleUpdateUser($db, $input);
            break;

        case 'deleteUser':
            handleDeleteUser($db, $input);
            break;

        // ==================== DOCUMENTOS ====================
        case 'listDocuments':
            handleListDocuments($db);
            break;

        // ==================== TREINAMENTOS ====================
        case 'listTrainings':
            handleListTrainings($db);
            break;

        // ==================== HEALTH CHECK ====================
        case 'health':
            sendResponse(['status' => 'ok', 'timestamp' => date('c')]);
            break;

        default:
            sendError('Ação não encontrada', 404);
    }
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
} finally {
    $db->close();
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

function handleLogin(Database $db, ?array $input): void {
    if (!$input || empty($input['email']) || empty($input['password'])) {
        sendError('Email e senha são obrigatórios');
    }

    $email    = trim($input['email']);
    $password = $input['password'];

    // Prepared statement para evitar SQL Injection
    $stmt = $db->prepare("SELECT id, name, email, role, department, password FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        sendError('Credenciais inválidas', 401);
    }

    // Verificar senha com password_verify (bcrypt/argon2)
    if (!password_verify($password, $user['password'])) {
        sendError('Credenciais inválidas', 401);
    }

    // Atualizar lastSignedIn
    $now  = date('Y-m-d H:i:s');
    $stmt = $db->prepare("UPDATE users SET lastSignedIn = ? WHERE id = ?");
    $stmt->bind_param('si', $now, $user['id']);
    $stmt->execute();
    $stmt->close();

    // Retornar usuário sem a senha
    unset($user['password']);
    sendResponse(['success' => true, 'user' => $user]);
}

function handleLogout(): void {
    sendResponse(['success' => true]);
}

function handleGetUser(Database $db, ?array $input): void {
    if (!$input || empty($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = (int) $input['userId'];
    $stmt   = $db->prepare("SELECT id, name, email, role, department, createdAt FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        sendError('Usuário não encontrado', 404);
    }

    sendResponse(['success' => true, 'user' => $user]);
}

// ==================== FUNÇÕES DE CHAMADOS ====================

function handleListTickets(Database $db): void {
    $result  = $db->query("SELECT * FROM tickets ORDER BY createdAt DESC");
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    sendResponse(['success' => true, 'tickets' => $tickets]);
}

function handleGetTicketsByUser(Database $db, ?array $input): void {
    if (!$input || empty($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId  = (int) $input['userId'];
    $stmt    = $db->prepare("SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result  = $stmt->get_result();
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    $stmt->close();
    sendResponse(['success' => true, 'tickets' => $tickets]);
}

function handleCreateTicket(Database $db, ?array $input): void {
    if (!$input || empty($input['title']) || empty($input['userId'])) {
        sendError('title e userId são obrigatórios');
    }

    $title       = trim($input['title']);
    $description = trim($input['description'] ?? '');
    $userId      = (int) $input['userId'];
    $userName    = trim($input['userName'] ?? '');
    $department  = trim($input['department'] ?? '');
    $priority    = in_array($input['priority'] ?? '', ['baixa', 'media', 'alta', 'critica'])
                    ? $input['priority']
                    : 'media';
    $status      = 'pendente';
    $now         = date('Y-m-d H:i:s');

    // Gerar ticketId único com base no total atual
    $countResult = $db->query("SELECT COUNT(*) as count FROM tickets");
    $countRow    = $countResult->fetch_assoc();
    $ticketId    = 'TK-' . str_pad((int)$countRow['count'] + 1, 3, '0', STR_PAD_LEFT);

    $stmt = $db->prepare(
        "INSERT INTO tickets (ticketId, title, description, userId, userName, department, priority, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('sssississs', $ticketId, $title, $description, $userId, $userName, $department, $priority, $status, $now, $now);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true, 'ticketId' => $ticketId]);
}

function handleUpdateTicketStatus(Database $db, ?array $input): void {
    if (!$input || empty($input['ticketId']) || empty($input['status'])) {
        sendError('ticketId e status são obrigatórios');
    }

    $allowedStatuses = ['pendente', 'em_andamento', 'resolvido', 'fechado'];
    if (!in_array($input['status'], $allowedStatuses)) {
        sendError('Status inválido');
    }

    $ticketId = (int) $input['ticketId'];
    $status   = $input['status'];
    $now      = date('Y-m-d H:i:s');

    $stmt = $db->prepare("UPDATE tickets SET status = ?, updatedAt = ? WHERE id = ?");
    $stmt->bind_param('ssi', $status, $now, $ticketId);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE NOTIFICAÇÕES ====================

function handleGetNotifications(Database $db, ?array $input): void {
    if (!$input || empty($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId        = (int) $input['userId'];
    $stmt          = $db->prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result        = $stmt->get_result();
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
    $stmt->close();
    sendResponse(['success' => true, 'notifications' => $notifications]);
}

function handleMarkNotificationAsRead(Database $db, ?array $input): void {
    if (!$input || empty($input['notificationId'])) {
        sendError('notificationId é obrigatório');
    }

    $notificationId = (int) $input['notificationId'];
    $stmt           = $db->prepare("UPDATE notifications SET `read` = 1 WHERE id = ?");
    $stmt->bind_param('i', $notificationId);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE USUÁRIOS ====================

function handleListUsers(Database $db): void {
    $result = $db->query("SELECT id, name, email, role, department, createdAt FROM users ORDER BY createdAt DESC");
    $users  = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    sendResponse(['success' => true, 'users' => $users]);
}

function handleCreateUser(Database $db, ?array $input): void {
    if (!$input || empty($input['name']) || empty($input['email']) || empty($input['password'])) {
        sendError('name, email e password são obrigatórios');
    }

    $name       = trim($input['name']);
    $email      = trim($input['email']);
    // Hash da senha com bcrypt (custo 12)
    $hashedPass = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $allowedRoles = ['user', 'admin', 'manager'];
    $role       = in_array($input['role'] ?? '', $allowedRoles) ? $input['role'] : 'user';
    $department = trim($input['department'] ?? '');
    $now        = date('Y-m-d H:i:s');

    $stmt = $db->prepare(
        "INSERT INTO users (name, email, password, role, department, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('ssssssss', $name, $email, $hashedPass, $role, $department, $now, $now, $now);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true]);
}

function handleUpdateUser(Database $db, ?array $input): void {
    if (!$input || empty($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId  = (int) $input['userId'];
    $fields  = [];
    $types   = '';
    $values  = [];

    if (isset($input['name'])) {
        $fields[] = 'name = ?';
        $types   .= 's';
        $values[] = trim($input['name']);
    }
    if (isset($input['role'])) {
        $allowedRoles = ['user', 'admin', 'manager'];
        if (!in_array($input['role'], $allowedRoles)) {
            sendError('Role inválida');
        }
        $fields[] = 'role = ?';
        $types   .= 's';
        $values[] = $input['role'];
    }
    if (isset($input['department'])) {
        $fields[] = 'department = ?';
        $types   .= 's';
        $values[] = trim($input['department']);
    }

    if (empty($fields)) {
        sendError('Nenhum campo para atualizar');
    }

    $now      = date('Y-m-d H:i:s');
    $fields[] = 'updatedAt = ?';
    $types   .= 's';
    $values[] = $now;

    $types   .= 'i';
    $values[] = $userId;

    $sql  = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true]);
}

function handleDeleteUser(Database $db, ?array $input): void {
    if (!$input || empty($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = (int) $input['userId'];
    $stmt   = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->close();

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE DOCUMENTOS ====================

function handleListDocuments(Database $db): void {
    $result    = $db->query("SELECT * FROM documents ORDER BY createdAt DESC");
    $documents = [];
    while ($row = $result->fetch_assoc()) {
        $documents[] = $row;
    }
    sendResponse(['success' => true, 'documents' => $documents]);
}

// ==================== FUNÇÕES DE TREINAMENTOS ====================

function handleListTrainings(Database $db): void {
    $result    = $db->query("SELECT * FROM trainings ORDER BY createdAt DESC");
    $trainings = [];
    while ($row = $result->fetch_assoc()) {
        $trainings[] = $row;
    }
    sendResponse(['success' => true, 'trainings' => $trainings]);
}
