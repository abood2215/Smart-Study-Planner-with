<?php
// Progress tracking API
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Course.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    $user_id = requireAuth();

    $taskModel = new Task();
    $courseModel = new Course();

    switch ($action) {
        case 'tasks':
            // Get task statistics
            if ($method === 'GET') {
                $stats = $taskModel->getStatistics($user_id);
                sendSuccess($stats, 'Task statistics retrieved successfully');
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        case 'courses':
            // Get course statistics
            if ($method === 'GET') {
                $stats = $courseModel->getStatistics($user_id);
                sendSuccess($stats, 'Course statistics retrieved successfully');
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        case 'overview':
            // Get overall progress overview
            if ($method === 'GET') {
                $taskStats = $taskModel->getStatistics($user_id);
                $courseStats = $courseModel->getStatistics($user_id);

                sendSuccess([
                    'tasks' => $taskStats,
                    'courses' => $courseStats,
                    'overall_progress' => [
                        'total_tasks' => $taskStats['total_tasks'] ?? 0,
                        'completed_tasks' => $taskStats['completed_tasks'] ?? 0,
                        'total_courses' => $courseStats['total_courses'] ?? 0,
                        'avg_course_progress' => $courseStats['avg_progress'] ?? 0
                    ]
                ], 'Progress overview retrieved successfully');
            } else {
                sendError('Method not allowed', 405);
            }
            break;

        default:
            sendError('Invalid action. Use: tasks, courses, or overview', 404);
    }
} catch (Exception $e) {
    logMessage("Progress API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error', 500);
}
