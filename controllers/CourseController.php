<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Course.php';

class CourseController {
    private $courseModel;

    public function __construct() {
        $this->courseModel = new Course();
    }

    /**
     * Get all courses
     */
    public function index() {
        $user_id = requireAuth();

        $filters = [];
        if (isset($_GET['difficulty'])) {
            $filters['difficulty'] = sanitize($_GET['difficulty']);
        }

        $courses = $this->courseModel->getAll($user_id, $filters);

        sendSuccess($courses, 'Courses retrieved successfully');
    }

    /**
     * Get single course
     */
    public function show($id) {
        $user_id = requireAuth();

        $course = $this->courseModel->getById($id, $user_id);

        if (!$course) {
            sendError('Course not found', 404);
        }

        sendSuccess($course, 'Course retrieved successfully');
    }

    /**
     * Create new course
     */
    public function create() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['name']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        // Sanitize input
        $data['name'] = sanitize($data['name']);

        // Validate difficulty
        if (isset($data['difficulty']) && !in_array($data['difficulty'], ['easy', 'medium', 'hard'])) {
            sendError('Invalid difficulty level', 400);
        }

        $result = $this->courseModel->create($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'course_id' => $result['course_id']
        ], $result['message'], 201);
    }

    /**
     * Update course
     */
    public function update($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Sanitize input
        if (isset($data['name'])) {
            $data['name'] = sanitize($data['name']);
        }

        // Validate difficulty
        if (isset($data['difficulty']) && !in_array($data['difficulty'], ['easy', 'medium', 'hard'])) {
            sendError('Invalid difficulty level', 400);
        }

        $result = $this->courseModel->update($id, $user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Delete course
     */
    public function delete($id) {
        $user_id = requireAuth();

        $result = $this->courseModel->delete($id, $user_id);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Update course progress
     */
    public function updateProgress($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        if (!isset($data['completed_hours'])) {
            sendError('completed_hours is required', 400);
        }

        $result = $this->courseModel->updateProgress($id, $user_id, $data['completed_hours']);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'progress' => $result['progress']
        ], $result['message']);
    }

    /**
     * Get course statistics
     */
    public function statistics() {
        $user_id = requireAuth();

        $stats = $this->courseModel->getStatistics($user_id);

        if (!$stats) {
            sendError('Failed to retrieve statistics', 500);
        }

        sendSuccess($stats, 'Statistics retrieved successfully');
    }
}
