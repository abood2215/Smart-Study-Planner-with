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
}
?>
