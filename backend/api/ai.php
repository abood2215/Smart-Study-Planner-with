<?php
require_once __DIR__ . '/../controllers/AIController.php';

$controller = new AIController();
$method = $_SERVER['REQUEST_METHOD'];

// Get action from query string
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    switch ($action) {
        // Estimate task duration
        case 'estimate-duration':
            if ($method === 'POST') {
                $controller->estimateTaskDuration();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Get study recommendations
        case 'recommendations':
            if ($method === 'GET') {
                $controller->getRecommendations();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Analyze progress
        case 'analyze-progress':
            if ($method === 'GET') {
                $controller->analyzeProgress();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Generate study schedule
        case 'generate-schedule':
            if ($method === 'GET') {
                $controller->generateSchedule();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Get course tips
        case 'course-tips':
            if ($method === 'GET' && $id) {
                $controller->getCourseTips($id);
            } else {
                sendError('Course ID is required', 400);
            }
            break;

        // Breakdown task into subtasks
        case 'breakdown-task':
            if ($method === 'GET' && $id) {
                $controller->breakdownTask($id);
            } else {
                sendError('Task ID is required', 400);
            }
            break;

        // Get motivational message
        case 'motivation':
            if ($method === 'GET') {
                $controller->getMotivation();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        // Suggest study technique
        case 'study-technique':
            if ($method === 'POST' && $id) {
                $controller->suggestStudyTechnique($id);
            } else {
                sendError('Course ID is required', 400);
            }
            break;

        // Create smart task with AI assistance
        case 'create-smart-task':
            if ($method === 'POST') {
                $controller->createSmartTask();
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        default:
            sendError('Invalid action', 404);
    }
} catch (Exception $e) {
    logMessage("AI API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
