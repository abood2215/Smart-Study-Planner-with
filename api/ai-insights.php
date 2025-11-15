<?php
/**
 * AI Insights API Endpoint
 * Provides AI-powered analysis and recommendations using OpenAI or Gemini
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

// dotenv.php is already loaded in config.php, environment variables are available

// Get user ID from authentication
$user_id = requireAuth();

// Get query parameters
$action = $_GET['action'] ?? 'study_analysis';

try {
    $pdo = getDB();

    // Fetch user's courses and tasks
    $stmt = $pdo->prepare("
        SELECT id, name, difficulty, total_hours, completed_hours, progress, performance
        FROM courses
        WHERE user_id = ?
    ");
    $stmt->execute([$user_id]);
    $courses = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT t.*, c.name as course_name
        FROM tasks t
        LEFT JOIN courses c ON t.course_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.deadline ASC
    ");
    $stmt->execute([$user_id]);
    $tasks = $stmt->fetchAll();

    // Prepare data summary for AI
    $totalCourses = count($courses);
    $totalTasks = count($tasks);
    $completedTasks = count(array_filter($tasks, fn($t) => $t['status'] === 'completed'));
    $pendingTasks = count(array_filter($tasks, fn($t) => $t['status'] === 'pending'));
    $inProgressTasks = count(array_filter($tasks, fn($t) => $t['status'] === 'in_progress'));

    $avgProgress = $totalCourses > 0
        ? array_sum(array_column($courses, 'progress')) / $totalCourses
        : 0;

    // Build context for AI
    $context = "Student Performance Analysis:\n\n";
    $context .= "Overall Statistics:\n";
    $context .= "- Total Courses: $totalCourses\n";
    $context .= "- Total Tasks: $totalTasks\n";
    $context .= "- Completed Tasks: $completedTasks\n";
    $context .= "- Pending Tasks: $pendingTasks\n";
    $context .= "- In Progress Tasks: $inProgressTasks\n";
    $context .= "- Average Course Progress: " . round($avgProgress, 1) . "%\n\n";

    $context .= "Courses Details:\n";
    foreach ($courses as $course) {
        $courseTasks = array_filter($tasks, fn($t) => $t['course_id'] === $course['id']);
        $courseTaskCount = count($courseTasks);
        $context .= "- {$course['name']} (Difficulty: {$course['difficulty']})\n";
        $context .= "  Progress: {$course['progress']}%, Performance: {$course['performance']}%\n";
        $context .= "  Total Hours: {$course['total_hours']}, Completed: {$course['completed_hours']}\n";
        $context .= "  Related Tasks: $courseTaskCount\n";
    }

    $context .= "\nUpcoming Deadlines:\n";
    $upcomingTasks = array_filter($tasks, function($t) {
        $deadline = strtotime($t['deadline']);
        $now = time();
        $daysUntil = ($deadline - $now) / (60 * 60 * 24);
        return $daysUntil >= 0 && $daysUntil <= 14 && $t['status'] !== 'completed';
    });
    foreach (array_slice($upcomingTasks, 0, 5) as $task) {
        $daysUntil = round((strtotime($task['deadline']) - time()) / (60 * 60 * 24));
        $context .= "- {$task['title']} ({$task['course_name']}): {$daysUntil} days left\n";
    }

    // Choose AI provider based on available keys
    $openaiKey = getenv('OPENAI_API_KEY');
    $geminiKey = getenv('GEMINI_API_KEY');

    if ($openaiKey && $openaiKey !== 'your-openai-api-key-here') {
        $insights = getOpenAIInsights($context, $action);
    } elseif ($geminiKey && $geminiKey !== 'your-gemini-api-key-here') {
        $insights = getGeminiInsights($context, $action);
    } else {
        // Fallback: Generate basic insights without AI
        $insights = generateBasicInsights($courses, $tasks);
    }

    sendSuccess([
        'insights' => $insights,
        'stats' => [
            'total_courses' => $totalCourses,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'avg_progress' => round($avgProgress, 1)
        ]
    ], 'AI insights generated successfully');

} catch (Exception $e) {
    error_log("AI Insights Error: " . $e->getMessage());
    sendError('Failed to generate insights: ' . $e->getMessage(), 500);
}

/**
 * Get insights from OpenAI
 */
function getOpenAIInsights($context, $action) {
    $apiKey = getenv('OPENAI_API_KEY');
    $apiUrl = getenv('OPENAI_API_URL') ?: 'https://api.openai.com/v1/chat/completions';

    $prompt = "Based on the following student data, provide a comprehensive analysis with:\n\n";
    $prompt .= "1. Overall Performance Assessment\n";
    $prompt .= "2. Strengths and Areas for Improvement\n";
    $prompt .= "3. Specific Study Recommendations\n";
    $prompt .= "4. Time Management Tips\n";
    $prompt .= "5. Priority Tasks to Focus On\n\n";
    $prompt .= $context;

    $data = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert academic advisor and study planner. Provide clear, actionable, and encouraging advice to help students succeed.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'max_tokens' => 800,
        'temperature' => 0.7
    ];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("OpenAI API Error: HTTP $httpCode - $response");
        throw new Exception("OpenAI API request failed");
    }

    $result = json_decode($response, true);
    return $result['choices'][0]['message']['content'] ?? 'Unable to generate insights';
}

/**
 * Get insights from Gemini
 */
function getGeminiInsights($context, $action) {
    $apiKey = getenv('GEMINI_API_KEY');
    $apiUrl = getenv('GEMINI_API_URL') ?: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent';

    $prompt = "Based on the following student data, provide a comprehensive analysis with:\n\n";
    $prompt .= "1. Overall Performance Assessment\n";
    $prompt .= "2. Strengths and Areas for Improvement\n";
    $prompt .= "3. Specific Study Recommendations\n";
    $prompt .= "4. Time Management Tips\n";
    $prompt .= "5. Priority Tasks to Focus On\n\n";
    $prompt .= $context;

    $data = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ]
    ];

    $url = $apiUrl . '?key=' . $apiKey;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Gemini API Error: HTTP $httpCode - $response");
        throw new Exception("Gemini API request failed");
    }

    $result = json_decode($response, true);
    return $result['candidates'][0]['content']['parts'][0]['text'] ?? 'Unable to generate insights';
}

/**
 * Generate basic insights without AI
 */
function generateBasicInsights($courses, $tasks) {
    $insights = "# Study Performance Analysis\n\n";

    $totalCourses = count($courses);
    $totalTasks = count($tasks);
    $completedTasks = count(array_filter($tasks, fn($t) => $t['status'] === 'completed'));
    $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

    $insights .= "## Overall Performance\n";
    $insights .= "You are managing $totalCourses courses with $totalTasks tasks. ";
    $insights .= "Your completion rate is $completionRate%. ";

    if ($completionRate >= 70) {
        $insights .= "Excellent work! You're staying on top of your studies.\n\n";
    } elseif ($completionRate >= 50) {
        $insights .= "Good progress, but there's room for improvement.\n\n";
    } else {
        $insights .= "You may need to focus more on completing your tasks.\n\n";
    }

    // Find struggling courses
    $strugglingCourses = array_filter($courses, fn($c) => floatval($c['progress']) < 50);
    if (count($strugglingCourses) > 0) {
        $insights .= "## Areas Needing Attention\n";
        foreach ($strugglingCourses as $course) {
            $insights .= "- **{$course['name']}**: Progress is only {$course['progress']}%. Consider dedicating more time to this course.\n";
        }
        $insights .= "\n";
    }

    // Upcoming deadlines
    $urgentTasks = array_filter($tasks, function($t) {
        $daysUntil = (strtotime($t['deadline']) - time()) / (60 * 60 * 24);
        return $daysUntil >= 0 && $daysUntil <= 7 && $t['status'] !== 'completed';
    });

    if (count($urgentTasks) > 0) {
        $insights .= "## Priority Tasks (Next 7 Days)\n";
        foreach (array_slice($urgentTasks, 0, 5) as $task) {
            $daysUntil = round((strtotime($task['deadline']) - time()) / (60 * 60 * 24));
            $insights .= "- **{$task['title']}**: Due in $daysUntil days\n";
        }
        $insights .= "\n";
    }

    $insights .= "## Recommendations\n";
    $insights .= "1. Focus on completing pending tasks before their deadlines\n";
    $insights .= "2. Dedicate more time to courses with low progress\n";
    $insights .= "3. Break down large tasks into smaller, manageable chunks\n";
    $insights .= "4. Schedule regular study sessions for consistent progress\n";

    return $insights;
}
