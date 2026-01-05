<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/GeminiService.php';
require_once __DIR__ . '/../includes/OpenAIService.php';
require_once __DIR__ . '/../models/Task.php';
require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/User.php';

class AIController {
    private $gemini;
    private $openai;
    private $activeService;
    private $taskModel;
    private $courseModel;
    private $userModel;

    public function __construct() {
        $this->gemini = new GeminiService();
        $this->openai = new OpenAIService();
        
        // Prefer OpenAI if key is set and valid (from config.php defined constants)
        $openaiKey = OPENAI_API_KEY;
        if ($openaiKey && $openaiKey !== 'your-openai-api-key-here' && $openaiKey !== 'YOUR_OPENAI_API_KEY_HERE' && strpos($openaiKey, 'sk-') === 0) {
            $this->activeService = $this->openai;
        } else {
            $this->activeService = $this->gemini;
        }
        
        $this->taskModel = new Task();
        $this->courseModel = new Course();
        $this->userModel = new User();
    }

    /**
     * Estimate task duration using AI
     */
    public function estimateTaskDuration() {
        $user_id = requireAuth();
        $data = getJsonInput();

        if (!isset($data['title'])) {
            sendError('Task title is required', 400);
        }

        $result = $this->activeService->estimateTaskDuration(
            $data['title'],
            $data['description'] ?? '',
            $data['difficulty'] ?? 'medium'
        );

        if (!$result['success']) {
            sendError('Failed to estimate duration: ' . $result['error'], 500);
        }

        sendSuccess([
            'estimated_hours' => $result['estimated_hours'],
            'raw_response' => $result['raw_response'] ?? ''
        ], 'Duration estimated successfully');
    }

    /**
     * Get AI-powered study recommendations
     */
    public function getRecommendations() {
        $user_id = requireAuth();

        // Get user data
        $tasks = $this->taskModel->getAll($user_id);
        $courses = $this->courseModel->getAll($user_id);
        $preferences = $this->userModel->getPreferences($user_id);

        if (empty($tasks) && empty($courses)) {
            sendSuccess([
                'recommendations' => 'لا توجد بيانات كافية لتقديم توصيات. يرجى إضافة مهام وكورسات أولاً.'
            ], 'No data available');
        }

        $result = $this->activeService->getStudyRecommendations($tasks, $courses, $preferences);

        if (!$result['success']) {
            sendError('Failed to get recommendations: ' . $result['error'], 500);
        }

        sendSuccess([
            'recommendations' => $result['recommendations']
        ], 'Recommendations generated successfully');
    }

    /**
     * Analyze study progress with AI
     */
    public function analyzeProgress() {
        $user_id = requireAuth();

        // Get statistics
        $taskStats = $this->taskModel->getStatistics($user_id);
        $courseStats = $this->courseModel->getStatistics($user_id);

        $statistics = [
            'tasks' => $taskStats,
            'courses' => $courseStats
        ];

        $result = $this->activeService->analyzeProgress($user_id, $statistics);

        if (!$result['success']) {
            sendError('Failed to analyze progress: ' . $result['error'], 500);
        }

        sendSuccess([
            'analysis' => $result['analysis'],
            'statistics' => $statistics
        ], 'Progress analyzed successfully');
    }

    /**
     * Generate AI study schedule
     */
    public function generateSchedule() {
        $user_id = requireAuth();

        // Get pending tasks
        $tasks = $this->taskModel->getAll($user_id, ['status' => 'pending']);
        $preferences = $this->userModel->getPreferences($user_id);

        if (empty($tasks)) {
            sendSuccess([
                'schedule' => 'لا توجد مهام معلقة لإنشاء جدول دراسي.'
            ], 'No pending tasks');
        }

        $dailyHours = $preferences['daily_study_hours'] ?? 4;
        $preferredTime = $preferences['preferred_study_time'] ?? 'morning';

        $result = $this->activeService->suggestStudySchedule($tasks, $dailyHours, $preferredTime);

        if (!$result['success']) {
            sendError('Failed to generate schedule: ' . $result['error'], 500);
        }

        sendSuccess([
            'schedule' => $result['schedule']
        ], 'Schedule generated successfully');
    }

    /**
     * Get tips for a specific course
     */
    public function getCourseTips($courseId) {
        $user_id = requireAuth();

        $course = $this->courseModel->getById($courseId, $user_id);

        if (!$course) {
            sendError('Course not found', 404);
        }

        $result = $this->activeService->getCourseTips(
            $course['name'],
            $course['difficulty'],
            $course['performance']
        );

        if (!$result['success']) {
            sendError('Failed to get tips: ' . $result['error'], 500);
        }

        sendSuccess([
            'course' => $course,
            'tips' => $result['tips']
        ], 'Tips generated successfully');
    }

    /**
     * Break down complex task into subtasks
     */
    public function breakdownTask($taskId) {
        $user_id = requireAuth();

        $task = $this->taskModel->getById($taskId, $user_id);

        if (!$task) {
            sendError('Task not found', 404);
        }

        $result = $this->activeService->breakdownTask(
            $task['title'],
            $task['description'] ?? '',
            $task['estimated_hours']
        );

        if (!$result['success']) {
            sendError('Failed to breakdown task: ' . $result['error'], 500);
        }

        sendSuccess([
            'task' => $task,
            'subtasks' => $result['subtasks']
        ], 'Task breakdown generated successfully');
    }

    /**
     * Get motivational message
     */
    public function getMotivation() {
        $user_id = requireAuth();

        $stats = $this->taskModel->getStatistics($user_id);

        $result = $this->activeService->getMotivationalMessage(
            $stats['completed_tasks'],
            $stats['total_tasks'],
            $stats['avg_progress']
        );

        if (!$result['success']) {
            sendError('Failed to get motivation: ' . $result['error'], 500);
        }

        sendSuccess([
            'message' => $result['message'],
            'statistics' => $stats
        ], 'Motivational message generated');
    }

    /**
     * Suggest study technique for course
     */
    public function suggestStudyTechnique($courseId) {
        $user_id = requireAuth();
        $data = getJsonInput();

        $course = $this->courseModel->getById($courseId, $user_id);

        if (!$course) {
            sendError('Course not found', 404);
        }

        $learningGoal = $data['learning_goal'] ?? 'فهم المادة وتحقيق أداء ممتاز';

        $result = $this->activeService->suggestStudyTechnique(
            $course['name'],
            $course['difficulty'],
            $learningGoal
        );

        if (!$result['success']) {
            sendError('Failed to suggest technique: ' . $result['error'], 500);
        }

        sendSuccess([
            'course' => $course,
            'technique' => $result['technique']
        ], 'Study technique suggested successfully');
    }

    /**
     * Smart task creation with AI assistance
     */
    public function createSmartTask() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['title', 'deadline']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        // Use AI to estimate duration if not provided
        if (!isset($data['estimated_hours'])) {
            $estimateResult = $this->activeService->estimateTaskDuration(
                $data['title'],
                $data['description'] ?? '',
                $data['difficulty'] ?? 'medium'
            );

            if ($estimateResult['success']) {
                $data['estimated_hours'] = $estimateResult['estimated_hours'];
            } else {
                // Fallback to default
                $data['estimated_hours'] = 3;
            }
        }

        // Create task
        $result = $this->taskModel->create($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'task_id' => $result['task_id'],
            'priority_score' => $result['priority_score'],
            'estimated_hours' => $data['estimated_hours'],
            'ai_assisted' => !isset($data['estimated_hours'])
        ], 'Smart task created successfully', 201);
    }

    /**
     * Generate project ideas based on interests
     */
    public function generateProjects() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        if (!isset($data['interests']) || empty($data['interests'])) {
            sendError('Interests are required', 400);
        }

        $interests = $data['interests'];
        $difficulty = $data['difficulty'] ?? 'medium';
        $count = $data['count'] ?? 5;

        $result = $this->activeService->generateProjectIdeas($interests, $difficulty, $count);

        if (!$result['success']) {
            sendError('Failed to generate project ideas: ' . $result['error'], 500);
        }

        sendSuccess([
            'projects' => $result['projects'],
            'raw_response' => $result['raw_response'] ?? ''
        ], 'Project ideas generated successfully');
    }

    /**
     * Analyze CV and extract skills
     */
    public function analyzeCV() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        if (!isset($data['cv_text']) || empty($data['cv_text'])) {
            sendError('CV text is required', 400);
        }

        $cvText = $data['cv_text'];

        $result = $this->activeService->analyzeCVText($cvText);

        if (!$result['success']) {
            sendError('Failed to analyze CV: ' . $result['error'], 500);
        }

        // Update user profile with extracted data
        $db = getDB();
        $updateData = [];

        if (!empty($result['skills'])) {
            $updateData['skills'] = is_array($result['skills']) ? implode(', ', $result['skills']) : $result['skills'];
        }

        if (!empty($result['interests'])) {
            $updateData['interests'] = is_array($result['interests']) ? implode(', ', $result['interests']) : $result['interests'];
        }

        if (!empty($updateData)) {
            $fields = [];
            $params = ['user_id' => $user_id];

            foreach ($updateData as $field => $value) {
                $fields[] = "$field = :$field";
                $params[$field] = $value;
            }

            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        sendSuccess([
            'skills' => $result['skills'],
            'interests' => $result['interests'],
            'experience_level' => $result['experience_level'] ?? 'intermediate',
            'summary' => $result['summary'] ?? '',
            'profile_updated' => !empty($updateData)
        ], 'CV analyzed successfully');
    }

    /**
     * Generate CV based on skills and interests
     */
    public function generateCV() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        if (empty($data['skills']) && empty($data['interests'])) {
            sendError('Either skills or interests are required', 400);
        }

        // Get user information for personalization
        $user = $this->userModel->findById($user_id);
        $userName = $user['name'] ?? '';
        $userEmail = $user['email'] ?? '';

        $skills = $data['skills'] ?? '';
        $interests = $data['interests'] ?? '';

        $result = $this->activeService->generateCV($skills, $interests, $userName, $userEmail);

        if (!$result['success']) {
            sendError('Failed to generate CV: ' . $result['error'], 500);
        }

        // Save the generated CV to the database
        try {
            $db = getDB();
            $stmt = $db->prepare("UPDATE users SET cv = :cv WHERE id = :user_id");
            $stmt->execute([
                'cv' => $result['cv_text'],
                'user_id' => $user_id
            ]);
        } catch (PDOException $e) {
            logMessage("Error saving CV: " . $e->getMessage(), 'ERROR');
            // Continue even if save fails - still return the generated CV
        }

        sendSuccess([
            'cv_text' => $result['cv_text'],
            'raw_response' => $result['raw_response'] ?? '',
            'cv_saved' => true
        ], 'CV generated and saved successfully');
    }
}
