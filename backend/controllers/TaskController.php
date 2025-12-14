<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Task.php';

class TaskController {
    private $taskModel;

    public function __construct() {
        $this->taskModel = new Task();
    }

    /**
     * Get all tasks
     */
    public function index() {
        $user_id = requireAuth();

        // Update overdue tasks first
        $this->taskModel->updateOverdueTasks($user_id);

        $filters = [];
        if (isset($_GET['status'])) {
            $filters['status'] = sanitize($_GET['status']);
        }
        if (isset($_GET['difficulty'])) {
            $filters['difficulty'] = sanitize($_GET['difficulty']);
        }
        if (isset($_GET['course_id'])) {
            $filters['course_id'] = intval($_GET['course_id']);
        }
        if (isset($_GET['order_by'])) {
            $filters['order_by'] = sanitize($_GET['order_by']);
        }
        if (isset($_GET['direction'])) {
            $filters['direction'] = strtoupper(sanitize($_GET['direction']));
        }

        $tasks = $this->taskModel->getAll($user_id, $filters);

        sendSuccess($tasks, 'Tasks retrieved successfully');
    }

    /**
     * Get single task
     */
    public function show($id) {
        $user_id = requireAuth();

        $task = $this->taskModel->getById($id, $user_id);

        if (!$task) {
            sendError('Task not found', 404);
        }

        sendSuccess($task, 'Task retrieved successfully');
    }

    /**
     * Create new task
     */
    public function create() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['title', 'deadline']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        // Sanitize input
        $data['title'] = sanitize($data['title']);
        if (isset($data['description'])) {
            $data['description'] = sanitize($data['description']);
        }

        // Validate difficulty
        if (isset($data['difficulty']) && !in_array($data['difficulty'], ['easy', 'medium', 'hard'])) {
            sendError('Invalid difficulty level', 400);
        }

        // Validate deadline format
        if (!strtotime($data['deadline'])) {
            sendError('Invalid deadline format', 400);
        }

        $result = $this->taskModel->create($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'task_id' => $result['task_id'],
            'priority_score' => $result['priority_score']
        ], $result['message'], 201);
    }

    /**
     * Update task
     */
    public function update($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Sanitize input
        if (isset($data['title'])) {
            $data['title'] = sanitize($data['title']);
        }
        if (isset($data['description'])) {
            $data['description'] = sanitize($data['description']);
        }

        // Validate difficulty
        if (isset($data['difficulty']) && !in_array($data['difficulty'], ['easy', 'medium', 'hard'])) {
            sendError('Invalid difficulty level', 400);
        }

        // Validate status
        if (isset($data['status']) && !in_array($data['status'], ['pending', 'in_progress', 'completed', 'overdue'])) {
            sendError('Invalid status', 400);
        }

        // Validate deadline format
        if (isset($data['deadline']) && !strtotime($data['deadline'])) {
            sendError('Invalid deadline format', 400);
        }

        $result = $this->taskModel->update($id, $user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Delete task
     */
    public function delete($id) {
        $user_id = requireAuth();

        $result = $this->taskModel->delete($id, $user_id);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Update task progress
     */
    public function updateProgress($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        if (!isset($data['completed_hours']) || !isset($data['progress'])) {
            sendError('completed_hours and progress are required', 400);
        }

        // Validate progress range
        if ($data['progress'] < 0 || $data['progress'] > 100) {
            sendError('Progress must be between 0 and 100', 400);
        }

        $result = $this->taskModel->updateProgress(
            $id,
            $user_id,
            $data['completed_hours'],
            $data['progress']
        );

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'progress' => $result['progress'],
            'status' => $result['status']
        ], $result['message']);
    }

    /**
     * Get task statistics
     */
    public function statistics() {
        $user_id = requireAuth();

        $stats = $this->taskModel->getStatistics($user_id);

        if (!$stats) {
            sendError('Failed to retrieve statistics', 500);
        }

        sendSuccess($stats, 'Statistics retrieved successfully');
    }

    /**
     * Get urgent tasks
     */
    public function urgent() {
        $user_id = requireAuth();

        $tasks = $this->taskModel->getUrgentTasks($user_id);

        sendSuccess($tasks, 'Urgent tasks retrieved successfully');
    }
}
