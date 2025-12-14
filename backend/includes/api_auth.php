<?php
// Simple authentication endpoint (demo)
// Adds CORS headers and handles JSON/form POST for login/register

// CORS headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Read JSON body if present
$raw = file_get_contents('php://input');
$json = null;
if (!empty($raw)) {
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $json = $decoded;
    }
}

// Merge form data and JSON data
$data = array_merge($_POST ?? [], $json ?? []);

// Determine action
$action = $_GET['action'] ?? ($data['action'] ?? null);

// Helper to emit JSON and exit
$respond = function(array $payload, int $status = 200) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
};

// Register flow (demo)
if ($action === 'register' || (isset($data['username']) && isset($data['email']) && isset($data['password']))) {
    $username = trim((string)($data['username'] ?? ''));
    $email    = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($username === '' || $email === '' || $password === '') {
        $respond(['success' => false, 'message' => 'Missing required fields (username, email, password)'], 400);
    }

    // TODO: Persist user in DB (includes/db.php is currently a stub)
    $respond([
        'success' => true,
        'message' => 'Registered successfully',
        'user'    => [
            'id'       => uniqid('u_', true),
            'username' => $username,
            'email'    => $email,
        ],
    ]);
}

// Login flow (demo)
if ($action === 'login' || (isset($data['email']) && isset($data['password']))) {
    $email    = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($email === '' || $password === '') {
        $respond(['success' => false, 'message' => 'Email and password are required'], 400);
    }

    // TODO: Verify credentials against DB
    $respond([
        'success' => true,
        'message' => 'Login successful',
        'user'    => [
            'email' => $email,
        ],
    ]);
}

// Fallback
$respond(['success' => false, 'message' => 'Unsupported request'], 404);

