<?php
/**
 * OpenAI Service - Integration with OpenAI API for AI features
 */
class OpenAIService {
    private $apiKey;
    private $apiUrl;
    private $model = 'gpt-4o-mini'; // Using cost-effective model by default

    public function __construct($apiKey = null, $apiUrl = null) {
        $this->apiKey = $apiKey ?? OPENAI_API_KEY;
        $this->apiUrl = $apiUrl ?? OPENAI_API_URL;
    }

    /**
     * Generate AI insights using OpenAI
     * @param string $prompt The prompt to send to OpenAI
     * @param array $options Additional options
     * @return array Response with 'success' and 'content' or 'error'
     */
    public function generateInsights($prompt, $options = []) {
        try {
            if (empty($this->apiKey) || $this->apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
                return [
                    'success' => false,
                    'error' => 'OpenAI API key not configured'
                ];
            }

            $model = $options['model'] ?? $this->model;
            $temperature = $options['temperature'] ?? 0.7;
            $maxTokens = $options['max_tokens'] ?? 500;

            $payload = [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => $temperature,
                'max_tokens' => $maxTokens
            ];

            $response = $this->makeRequest($payload);

            if ($response['success']) {
                return [
                    'success' => true,
                    'content' => $response['content'],
                    'model' => $model
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $response['error'] ?? 'Unknown error occurred'
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Exception: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate schedule recommendations
     * @param array $taskData Task information
     * @param array $userPrefs User preferences
     * @return array Recommendations
     */
    public function generateScheduleRecommendation($taskData, $userPrefs = []) {
        $prompt = "Based on the following task details, suggest an optimal study schedule:\n\n";
        $prompt .= "Task: " . ($taskData['title'] ?? 'Unknown') . "\n";
        $prompt .= "Deadline: " . ($taskData['deadline'] ?? 'Unknown') . "\n";
        $prompt .= "Estimated hours: " . ($taskData['estimated_hours'] ?? 0) . "\n";
        $prompt .= "Difficulty: " . ($taskData['difficulty'] ?? 'medium') . "\n";
        $prompt .= "User preference: " . ($userPrefs['preferred_study_time'] ?? 'morning') . "\n";
        $prompt .= "Daily study hours: " . ($userPrefs['daily_study_hours'] ?? 4) . "\n\n";
        $prompt .= "Please provide a concise schedule recommendation with specific time blocks and study sessions.";

        return $this->generateInsights($prompt, [
            'temperature' => 0.5,
            'max_tokens' => 300
        ]);
    }

    /**
     * Generate task priority analysis
     * @param array $tasks List of tasks
     * @return array Analysis with priority recommendations
     */
    public function analyzePriorities($tasks) {
        $taskList = "";
        foreach ($tasks as $task) {
            $taskList .= "- " . $task['title'] . " (Deadline: " . $task['deadline'] . ", Progress: " . $task['progress'] . "%)\n";
        }

        $prompt = "Analyze the following tasks and suggest a priority order for completion:\n\n" . $taskList . "\n";
        $prompt .= "Provide a brief justification for the order based on deadline urgency and task dependencies.";

        return $this->generateInsights($prompt, [
            'temperature' => 0.3,
            'max_tokens' => 400
        ]);
    }

    /**
     * Generate study tips based on course
     * @param string $courseName Course name
     * @param string $topic Current topic
     * @return array Tips and strategies
     */
    public function generateStudyTips($courseName, $topic) {
        $prompt = "Provide 3-5 effective study tips for learning about '$topic' in the course '$courseName'. ";
        $prompt .= "Include practical strategies and common pitfalls to avoid.";

        return $this->generateInsights($prompt, [
            'temperature' => 0.6,
            'max_tokens' => 350
        ]);
    }

    /**
     * Make HTTP request to OpenAI API
     * @param array $payload Request payload
     * @return array Response
     */
    private function makeRequest($payload) {
        try {
            // Ensure UTF-8 encoding for all content
            $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $this->apiUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json; charset=utf-8',
                    'Authorization: Bearer ' . $this->apiKey
                ],
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $jsonPayload,
                CURLOPT_TIMEOUT => 30
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                return [
                    'success' => false,
                    'error' => 'CURL error: ' . $error
                ];
            }

            if ($httpCode !== 200) {
                return [
                    'success' => false,
                    'error' => "HTTP $httpCode: " . $response
                ];
            }

            $decoded = json_decode($response, true);

            if (isset($decoded['choices'][0]['message']['content'])) {
                return [
                    'success' => true,
                    'content' => $decoded['choices'][0]['message']['content']
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Unexpected API response format'
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Estimate task duration based on title and description
     */
    public function estimateTaskDuration($title, $description = '', $difficulty = 'medium') {
        $prompt = "Estimate the time required to complete this task in hours:\n\n";
        $prompt .= "Title: $title\n";
        $prompt .= "Description: $description\n";
        $prompt .= "Difficulty: $difficulty\n\n";
        $prompt .= "Give me ONLY a number (e.g., 3.5 or 5 or 8). No explanation.";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.3,
            'max_tokens' => 50
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        $text = trim($result['content']);
        preg_match('/\d+\.?\d*/', $text, $matches);

        if (isset($matches[0])) {
            return [
                'success' => true,
                'estimated_hours' => floatval($matches[0]),
                'raw_response' => $text
            ];
        }

        return ['success' => false, 'error' => 'Could not extract duration'];
    }

    /**
     * Get study recommendations for a student
     */
    public function getStudyRecommendations($tasks, $courses, $preferences) {
        $tasksJson = json_encode($tasks, JSON_UNESCAPED_UNICODE);
        $coursesJson = json_encode($courses, JSON_UNESCAPED_UNICODE);

        $prompt = "Analyze the following student data and give recommendations:\n\n";
        $prompt .= "Tasks: $tasksJson\n\n";
        $prompt .= "Courses: $coursesJson\n\n";
        $prompt .= "Provide: 1) Top 3 tasks to focus on 2) Study improvement tips 3) Time management advice";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.7,
            'max_tokens' => 600
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'recommendations' => $result['content']];
    }

    /**
     * Analyze study progress and give insights
     */
    public function analyzeProgress($userId, $statistics) {
        $statsJson = json_encode($statistics, JSON_UNESCAPED_UNICODE);

        $prompt = "Analyze these study statistics and provide comprehensive feedback:\n\n$statsJson\n\n";
        $prompt .= "Include: 1) Performance assessment 2) Strengths 3) Areas to improve 4) Productivity tips";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.6,
            'max_tokens' => 500
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'analysis' => $result['content']];
    }

    /**
     * Generate study schedule suggestions
     */
    public function suggestStudySchedule($tasks, $dailyHours, $preferredTime) {
        $tasksJson = json_encode($tasks, JSON_UNESCAPED_UNICODE);

        $prompt = "Create a detailed weekly study schedule.\n\n";
        $prompt .= "Tasks: $tasksJson\n";
        $prompt .= "Available hours per day: $dailyHours\n";
        $prompt .= "Preferred study time: $preferredTime\n\n";
        $prompt .= "Consider task priorities and deadlines. Include break times.";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.5,
            'max_tokens' => 700
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'schedule' => $result['content']];
    }

    /**
     * Get tips for difficult courses
     */
    public function getCourseTips($courseName, $difficulty, $currentPerformance) {
        $prompt = "I'm studying: $courseName (Difficulty: $difficulty, My performance: $currentPerformance%)\n\n";
        $prompt .= "Give me: 1) Specific study tips 2) Effective strategies 3) Resource recommendations 4) How to overcome difficulties";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.6,
            'max_tokens' => 400
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'tips' => $result['content']];
    }

    /**
     * Break down complex task into subtasks
     */
    public function breakdownTask($taskTitle, $taskDescription, $estimatedHours) {
        $prompt = "Break down this task into manageable subtasks:\n\n";
        $prompt .= "Title: $taskTitle\n";
        $prompt .= "Description: $taskDescription\n";
        $prompt .= "Total estimated hours: $estimatedHours\n\n";
        $prompt .= "For each subtask, provide: title, brief description, estimated hours";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.5,
            'max_tokens' => 500
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'subtasks' => $result['content']];
    }

    /**
     * Motivational message based on progress
     */
    public function getMotivationalMessage($completedTasks, $totalTasks, $avgProgress) {
        $prompt = "The student completed $completedTasks of $totalTasks tasks. Average progress: $avgProgress%.\n\n";
        $prompt .= "Write a short, encouraging motivational message (2-3 sentences).";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.8,
            'max_tokens' => 100
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'message' => trim($result['content'])];
    }

    /**
     * Suggest optimal study technique for course
     */
    public function suggestStudyTechnique($courseName, $difficulty, $learningGoal) {
        $prompt = "Course: $courseName (Difficulty: $difficulty)\nGoal: $learningGoal\n\n";
        $prompt .= "Suggest the best study technique (e.g., Pomodoro, Active Recall, Spaced Repetition, Mind Mapping).\n";
        $prompt .= "Include: 1) Recommended technique 2) Why it's suitable 3) Step-by-step implementation";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.6,
            'max_tokens' => 400
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return ['success' => true, 'technique' => $result['content']];
    }

    /**
     * Generate project ideas based on user interests
     */
    public function generateProjectIdeas($interests, $difficulty = 'medium', $count = 5) {
        $prompt = "Generate $count innovative and practical project ideas based on these interests:\n\n";
        $prompt .= "Interests: $interests\n";
        $prompt .= "Difficulty level: $difficulty\n\n";
        $prompt .= "For each project, provide:\n";
        $prompt .= "1. Project title\n";
        $prompt .= "2. Brief description (2-3 sentences)\n";
        $prompt .= "3. Required technologies/skills\n";
        $prompt .= "4. Difficulty level (easy/medium/hard)\n";
        $prompt .= "5. Estimated completion time";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.8,
            'max_tokens' => 1000
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        $rawResponse = $result['content'];
        $projects = [];

        // Try multiple parsing strategies

        // Strategy 1: Split by numbered patterns (1., 2., 3., etc.)
        $lines = explode("\n", $rawResponse);
        $currentProject = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Match various project numbering formats: "1.", "1)", "1:", "Project 1:", "### 1.", etc.
            if (preg_match('/^(#{1,3}\s*)?(Project\s+)?(\d+)[.)\:]/', $line)) {
                if ($currentProject) {
                    $projects[] = $currentProject;
                }
                $currentProject = ['raw' => $line];
            } elseif ($currentProject) {
                $currentProject['raw'] .= "\n" . $line;
            }
        }

        if ($currentProject) {
            $projects[] = $currentProject;
        }

        // Strategy 2: If no projects found, try splitting by "---" or "###"
        if (empty($projects)) {
            $sections = preg_split('/\n(---+|\#{3,})\n/', $rawResponse);
            foreach ($sections as $section) {
                $section = trim($section);
                if (!empty($section) && strlen($section) > 50) {
                    $projects[] = ['raw' => $section];
                }
            }
        }

        // Strategy 3: If still no projects, try splitting by double newlines
        if (empty($projects)) {
            $sections = preg_split('/\n\n+/', $rawResponse);
            $tempProjects = [];
            foreach ($sections as $section) {
                $section = trim($section);
                // Only include sections that look like project descriptions
                if (!empty($section) &&
                    strlen($section) > 100 &&
                    (stripos($section, 'project') !== false ||
                     preg_match('/\d+[.\)]/', $section))) {
                    $tempProjects[] = ['raw' => $section];
                }
            }

            // Only use this strategy if we found at least 2 projects
            if (count($tempProjects) >= 2) {
                $projects = $tempProjects;
            }
        }

        return [
            'success' => true,
            'projects' => $projects,
            'raw_response' => $rawResponse
        ];
    }

    /**
     * Analyze CV text and extract skills and interests
     */
    public function analyzeCVText($cvText) {
        $prompt = "Analyze this CV and extract:\n\n$cvText\n\n";
        $prompt .= "Provide in a structured format:\n";
        $prompt .= "1. Technical Skills (list)\n";
        $prompt .= "2. Areas of Interest (list)\n";
        $prompt .= "3. Experience Level (beginner/intermediate/advanced)\n";
        $prompt .= "4. Brief Summary";

        $result = $this->generateInsights($prompt, [
            'temperature' => 0.4,
            'max_tokens' => 600
        ]);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        $rawResponse = $result['content'];
        $skills = [];
        $interests = [];
        $experienceLevel = 'intermediate';
        $summary = '';

        $lines = explode("\n", $rawResponse);
        $currentSection = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (stripos($line, 'skill') !== false || stripos($line, 'Technical') !== false) {
                $currentSection = 'skills';
                continue;
            }
            if (stripos($line, 'interest') !== false || stripos($line, 'Areas') !== false) {
                $currentSection = 'interests';
                continue;
            }
            if (stripos($line, 'experience') !== false || stripos($line, 'Level') !== false) {
                $currentSection = 'experience';
                continue;
            }
            if (stripos($line, 'summary') !== false) {
                $currentSection = 'summary';
                continue;
            }

            if ($currentSection === 'skills' && (strpos($line, '-') === 0 || strpos($line, '•') === 0)) {
                $skill = trim(substr($line, 1));
                if (!empty($skill)) $skills[] = $skill;
            } elseif ($currentSection === 'interests' && (strpos($line, '-') === 0 || strpos($line, '•') === 0)) {
                $interest = trim(substr($line, 1));
                if (!empty($interest)) $interests[] = $interest;
            } elseif ($currentSection === 'experience') {
                if (stripos($line, 'beginner') !== false) $experienceLevel = 'beginner';
                elseif (stripos($line, 'advanced') !== false) $experienceLevel = 'advanced';
            } elseif ($currentSection === 'summary') {
                $summary .= $line . ' ';
            }
        }

        return [
            'success' => true,
            'skills' => $skills,
            'interests' => $interests,
            'experience_level' => $experienceLevel,
            'summary' => trim($summary),
            'raw_response' => $rawResponse
        ];
    }
}
?>
