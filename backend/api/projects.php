<?php
/**
 * Projects API Endpoint
 *
 * This file serves as the routing layer for all project-related API requests.
 * It handles project CRUD operations, team management, and project discovery.
 *
 * @package Smart Study Planner
 * @category API
 * @author Smart Study Planner Team
 * @version 1.0
 */

require_once __DIR__ . '/../controllers/ProjectController.php';

// Initialize the Project controller
$controller = new ProjectController();

// Get the HTTP request method (GET, POST, PUT, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// Get action and ID parameters from query string
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    switch ($action) {
        // Get all projects
        case 'list':
        case null:
            if ($method === 'GET') {
                $controller->index();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Get single project
        case 'get':
            if ($method === 'GET' && $id) {
                $controller->show($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        // Create new project
        case 'create':
            if ($method === 'POST') {
                $controller->create();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Update project
        case 'update':
            if ($method === 'POST' && $id) {
                $controller->update($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        // Delete project
        case 'delete':
            if ($method === 'POST' && $id) {
                $controller->delete($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        // Add team member
        case 'add-member':
            if ($method === 'POST' && $id) {
                $controller->addMember($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        // Remove team member
        case 'remove-member':
            if ($method === 'POST' && $id) {
                $controller->removeMember($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        // Get project statistics
        case 'statistics':
        case 'stats':
            if ($method === 'GET') {
                $controller->statistics();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Search for teammates
        case 'find-teammates':
        case 'search-teammates':
            if ($method === 'GET' && $id) {
                $controller->searchTeammates($id);
            } else {
                sendError('Project ID is required', 400);
            }
            break;

        default:
            sendError('Invalid action', 404);
    }
} catch (Exception $e) {
    logMessage("Projects API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
