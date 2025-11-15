<?php
require_once __DIR__ . '/../controllers/AuthController.php';

$controller = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse URL to get action
$path = parse_url($uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Get action from query string or path
$action = $_GET['action'] ?? end($path_parts);

try {
    switch ($action) {
        case 'register':
            if ($method === 'POST') {
                $controller->register();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        case 'login':
            if ($method === 'POST') {
                $controller->login();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        case 'profile':
            if ($method === 'GET') {
                $controller->profile();
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                $controller->updateProfile();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        case 'preferences':
            if ($method === 'GET') {
                $controller->getPreferences();
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                $controller->updatePreferences();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        default:
            sendError('Invalid action', 404);
    }
} catch (Exception $e) {
    logMessage("Auth API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error', 500);
}
