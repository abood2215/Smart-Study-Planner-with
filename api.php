<?php
/**
 * Backend API Router
 * This file acts as the main entry point for all API requests
 * Routes requests to appropriate API endpoints in backend/api/
 */

// Set base path for backend
define('BACKEND_PATH', __DIR__ . '/backend');
define('BASE_PATH', BACKEND_PATH);

// Get the requested API endpoint
$request_uri = $_SERVER['REQUEST_URI'];
$request_path = parse_url($request_uri, PHP_URL_PATH);

// Extract the API endpoint name (e.g., /api/tasks.php -> tasks)
if (preg_match('/\/api\/([a-z\-]+\.php)/i', $request_path, $matches)) {
    $api_file = $matches[1];
    $api_path = BACKEND_PATH . '/api/' . $api_file;
    
    if (file_exists($api_path)) {
        require_once $api_path;
        exit;
    }
}

// If no valid API endpoint found
http_response_code(404);
echo json_encode([
    'success' => false,
    'message' => 'API endpoint not found'
]);
?>
