<?php
// Schedule management API
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    $user_id = requireAuth();
    $db = getDB();

    // RESTful API: GET without action = list all
    if ($method === 'GET' && !$action && !$id) {
        $stmt = $db->prepare("
            SELECT s.*, t.title as task_title, c.name as course_name, t.difficulty
            FROM schedules s
            LEFT JOIN tasks t ON s.task_id = t.id
            LEFT JOIN courses c ON t.course_id = c.id
            WHERE s.user_id = :user_id
            ORDER BY s.scheduled_date ASC, s.start_time ASC
        ");
        $stmt->execute(['user_id' => $user_id]);
        $schedules = $stmt->fetchAll();

        sendSuccess($schedules, 'Schedules retrieved successfully');
        exit;
    }

    // GET with ID = get single schedule
    if ($method === 'GET' && $id) {
        $stmt = $db->prepare("
            SELECT s.*, t.title as task_title, c.name as course_name
            FROM schedules s
            LEFT JOIN tasks t ON s.task_id = t.id
            LEFT JOIN courses c ON t.course_id = c.id
            WHERE s.id = :id AND s.user_id = :user_id
        ");
        $stmt->execute(['id' => $id, 'user_id' => $user_id]);
        $schedule = $stmt->fetch();

        if (!$schedule) {
            sendError('Schedule not found', 404);
        }

        sendSuccess($schedule, 'Schedule retrieved successfully');
        exit;
    }

    // PUT/PATCH = update schedule
    if (($method === 'PUT' || $method === 'PATCH') && $id) {
        $data = getJsonInput();

        $stmt = $db->prepare("
            UPDATE schedules
            SET status = :status
            WHERE id = :id AND user_id = :user_id
        ");

        $result = $stmt->execute([
            'status' => $data['status'] ?? 'completed',
            'id' => $id,
            'user_id' => $user_id
        ]);

        if ($stmt->rowCount() === 0) {
            sendError('Schedule not found or no changes made', 404);
        }

        sendSuccess(null, 'Schedule updated successfully');
        exit;
    }

    // DELETE = delete schedule
    if ($method === 'DELETE' && $id) {
        $stmt = $db->prepare("DELETE FROM schedules WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $user_id]);

        if ($stmt->rowCount() === 0) {
            sendError('Schedule not found', 404);
        }

        sendSuccess(null, 'Schedule deleted successfully');
        exit;
    }

    // POST = create new schedule
    if ($method === 'POST' || $action === 'create') {
        $data = getJsonInput();

        $errors = validateRequired($data, ['task_id', 'scheduled_date', 'start_time', 'end_time']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        $stmt = $db->prepare("
            INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes)
            VALUES (:user_id, :task_id, :scheduled_date, :start_time, :end_time, :duration_minutes)
        ");

        $stmt->execute([
            'user_id' => $user_id,
            'task_id' => $data['task_id'],
            'scheduled_date' => $data['scheduled_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'duration_minutes' => $data['duration_minutes'] ?? 90
        ]);

        sendSuccess(['schedule_id' => $db->lastInsertId()], 'Schedule created successfully', 201);
        exit;
    }

    sendError('Invalid request', 400);

} catch (Exception $e) {
    logMessage("Schedule API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
