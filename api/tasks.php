<?php
require_once __DIR__ . '/../controllers/TaskController.php';

$controller = new TaskController();
$method = $_SERVER['REQUEST_METHOD'];

// Get ID from query string
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    // Statistics endpoint
    if ($action === 'statistics') {
        if ($method === 'GET') {
            $controller->statistics();
        } else {
            sendError('Method not allowed', 405);
        }
        exit;
    }

    // Urgent tasks endpoint
    if ($action === 'urgent') {
        if ($method === 'GET') {
            $controller->urgent();
        } else {
            sendError('Method not allowed', 405);
        }
        exit;
    }

    // Progress update endpoint
    if ($action === 'progress' && $id) {
        if ($method === 'PUT' || $method === 'PATCH') {
            $controller->updateProgress($id);
        } else {
            sendError('Method not allowed', 405);
        }
        exit;
    }

    // CRUD operations
    switch ($method) {
        case 'GET':
            if ($id) {
                $controller->show($id);
            } else {
                $controller->index();
            }
            break;

        case 'POST':
            $controller->create();
            break;

        case 'PUT':
        case 'PATCH':
            if (!$id) {
                sendError('Task ID is required', 400);
            }
            $controller->update($id);
            break;

        case 'DELETE':
            if (!$id) {
                sendError('Task ID is required', 400);
            }
            $controller->delete($id);
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    logMessage("Tasks API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error', 500);
}
