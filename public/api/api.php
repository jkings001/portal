<?php
/**
 * API Principal - Portal de Atendimento JKINGS
 * Endpoints para autenticação, chamados, notificações, etc
 */

require_once 'config.php';

// Obter ação da requisição
$action = $_GET['action'] ?? $_POST['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

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
            handleListTickets($db, $input);
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
            handleListUsers($db, $input);
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
            handleListDocuments($db, $input);
            break;

        // ==================== TREINAMENTOS ====================
        case 'listTrainings':
            handleListTrainings($db, $input);
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

function handleLogin($db, $input) {
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        sendError('Email e senha são obrigatórios');
    }

    $email = $db->escape($input['email']);
    $password = $db->escape($input['password']);

    $result = $db->query("SELECT * FROM users WHERE email = '$email' LIMIT 1");
    $user = $result->fetch_assoc();

    if (!$user) {
        sendError('Usuário não encontrado', 401);
    }

    // Verificar senha (em produção, use password_verify com hash)
    if ($user['password'] !== $password) {
        sendError('Senha incorreta', 401);
    }

    // Atualizar lastSignedIn
    $now = date('Y-m-d H:i:s');
    $db->query("UPDATE users SET lastSignedIn = '$now' WHERE id = {$user['id']}");

    // Retornar usuário sem a senha
    unset($user['password']);
    sendResponse(['success' => true, 'user' => $user]);
}

function handleLogout() {
    sendResponse(['success' => true]);
}

function handleGetUser($db, $input) {
    if (!$input || !isset($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = intval($input['userId']);
    $result = $db->query("SELECT * FROM users WHERE id = $userId LIMIT 1");
    $user = $result->fetch_assoc();

    if (!$user) {
        sendError('Usuário não encontrado', 404);
    }

    unset($user['password']);
    sendResponse(['success' => true, 'user' => $user]);
}

// ==================== FUNÇÕES DE CHAMADOS ====================

function handleListTickets($db, $input) {
    $result = $db->query("SELECT * FROM tickets ORDER BY createdAt DESC");
    $tickets = [];

    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }

    sendResponse(['success' => true, 'tickets' => $tickets]);
}

function handleGetTicketsByUser($db, $input) {
    if (!$input || !isset($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = intval($input['userId']);
    $result = $db->query("SELECT * FROM tickets WHERE userId = $userId ORDER BY createdAt DESC");
    $tickets = [];

    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }

    sendResponse(['success' => true, 'tickets' => $tickets]);
}

function handleCreateTicket($db, $input) {
    if (!$input || !isset($input['title']) || !isset($input['userId'])) {
        sendError('title e userId são obrigatórios');
    }

    $title = $db->escape($input['title']);
    $description = $db->escape($input['description'] ?? '');
    $userId = intval($input['userId']);
    $userName = $db->escape($input['userName'] ?? '');
    $department = $db->escape($input['department'] ?? '');
    $priority = $db->escape($input['priority'] ?? 'media');
    $status = 'pendente';
    $now = date('Y-m-d H:i:s');

    // Gerar ticketId único
    $result = $db->query("SELECT COUNT(*) as count FROM tickets");
    $row = $result->fetch_assoc();
    $ticketId = 'TK-' . str_pad($row['count'] + 1, 3, '0', STR_PAD_LEFT);

    $query = "INSERT INTO tickets (ticketId, title, description, userId, userName, department, priority, status, createdAt, updatedAt) 
              VALUES ('$ticketId', '$title', '$description', $userId, '$userName', '$department', '$priority', '$status', '$now', '$now')";

    $db->query($query);

    sendResponse(['success' => true, 'ticketId' => $ticketId]);
}

function handleUpdateTicketStatus($db, $input) {
    if (!$input || !isset($input['ticketId']) || !isset($input['status'])) {
        sendError('ticketId e status são obrigatórios');
    }

    $ticketId = intval($input['ticketId']);
    $status = $db->escape($input['status']);
    $now = date('Y-m-d H:i:s');

    $db->query("UPDATE tickets SET status = '$status', updatedAt = '$now' WHERE id = $ticketId");

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE NOTIFICAÇÕES ====================

function handleGetNotifications($db, $input) {
    if (!$input || !isset($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = intval($input['userId']);
    $result = $db->query("SELECT * FROM notifications WHERE userId = $userId ORDER BY createdAt DESC LIMIT 50");
    $notifications = [];

    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }

    sendResponse(['success' => true, 'notifications' => $notifications]);
}

function handleMarkNotificationAsRead($db, $input) {
    if (!$input || !isset($input['notificationId'])) {
        sendError('notificationId é obrigatório');
    }

    $notificationId = intval($input['notificationId']);
    $db->query("UPDATE notifications SET read = 1 WHERE id = $notificationId");

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE USUÁRIOS ====================

function handleListUsers($db, $input) {
    $result = $db->query("SELECT id, name, email, role, department, createdAt FROM users ORDER BY createdAt DESC");
    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    sendResponse(['success' => true, 'users' => $users]);
}

function handleCreateUser($db, $input) {
    if (!$input || !isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
        sendError('name, email e password são obrigatórios');
    }

    $name = $db->escape($input['name']);
    $email = $db->escape($input['email']);
    $password = $db->escape($input['password']);
    $role = $db->escape($input['role'] ?? 'user');
    $department = $db->escape($input['department'] ?? '');
    $now = date('Y-m-d H:i:s');

    $db->query("INSERT INTO users (name, email, password, role, department, createdAt, updatedAt, lastSignedIn) 
               VALUES ('$name', '$email', '$password', '$role', '$department', '$now', '$now', '$now')");

    sendResponse(['success' => true]);
}

function handleUpdateUser($db, $input) {
    if (!$input || !isset($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = intval($input['userId']);
    $updates = [];

    if (isset($input['name'])) {
        $updates[] = "name = '" . $db->escape($input['name']) . "'";
    }
    if (isset($input['role'])) {
        $updates[] = "role = '" . $db->escape($input['role']) . "'";
    }
    if (isset($input['department'])) {
        $updates[] = "department = '" . $db->escape($input['department']) . "'";
    }

    if (empty($updates)) {
        sendError('Nenhum campo para atualizar');
    }

    $updates[] = "updatedAt = '" . date('Y-m-d H:i:s') . "'";
    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = $userId";

    $db->query($query);

    sendResponse(['success' => true]);
}

function handleDeleteUser($db, $input) {
    if (!$input || !isset($input['userId'])) {
        sendError('userId é obrigatório');
    }

    $userId = intval($input['userId']);
    $db->query("DELETE FROM users WHERE id = $userId");

    sendResponse(['success' => true]);
}

// ==================== FUNÇÕES DE DOCUMENTOS ====================

function handleListDocuments($db, $input) {
    $result = $db->query("SELECT * FROM documents ORDER BY createdAt DESC");
    $documents = [];

    while ($row = $result->fetch_assoc()) {
        $documents[] = $row;
    }

    sendResponse(['success' => true, 'documents' => $documents]);
}

// ==================== FUNÇÕES DE TREINAMENTOS ====================

function handleListTrainings($db, $input) {
    $result = $db->query("SELECT * FROM trainings ORDER BY createdAt DESC");
    $trainings = [];

    while ($row = $result->fetch_assoc()) {
        $trainings[] = $row;
    }

    sendResponse(['success' => true, 'trainings' => $trainings]);
}
