<?php
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/functions.php';

/**
 * AI Service - Supports both ChatGPT and Gemini
 */
class AIService {
    private $service;
    private $apiKey;
    private $apiUrl;
    private $model;

    public function __construct() {
        $this->service = AI_SERVICE; // 'chatgpt' or 'gemini'

        if ($this->service === 'chatgpt') {
            $this->apiKey = CHATGPT_API_KEY;
            $this->apiUrl = CHATGPT_API_URL;
            $this->model = CHATGPT_MODEL;
        } else {
            $this->apiKey = GEMINI_API_KEY;
            $this->apiUrl = GEMINI_API_URL;
            $this->model = 'gemini-2.5-pro';
        }
    }

    /**
     * Make request to AI API
     */
    private function makeRequest($prompt, $maxRetries = 3) {
        if ($this->service === 'chatgpt') {
            return $this->makeChatGPTRequest($prompt, $maxRetries);
        } else {
            return $this->makeGeminiRequest($prompt, $maxRetries);
        }
    }

    /**
     * Make request to ChatGPT API
     */
    private function makeChatGPTRequest($prompt, $maxRetries = 3) {
        $retryDelays = [1, 2, 5];

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            $data = [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 1500
            ];

            $ch = curl_init($this->apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                logMessage("ChatGPT API curl error: $error", 'ERROR');
                return ['success' => false, 'error' => $error];
            }

            curl_close($ch);

            if ($httpCode === 200) {
                $result = json_decode($response, true);
                if (isset($result['choices'][0]['message']['content'])) {
                    return [
                        'success' => true,
                        'text' => trim($result['choices'][0]['message']['content'])
                    ];
                }
                logMessage("ChatGPT API unexpected response format: " . $response, 'ERROR');
                return ['success' => false, 'error' => 'Invalid response format', 'raw_response' => $response];
            }

            // Retry on 429 (rate limit) or 503 (service unavailable)
            if (in_array($httpCode, [429, 503]) && $attempt < $maxRetries - 1) {
                $waitSeconds = $retryDelays[$attempt];
                logMessage("ChatGPT API HTTP $httpCode. Retrying in {$waitSeconds}s...", 'WARN');
                sleep($waitSeconds);
                continue;
            }

            // Final error
            $errorMsg = "HTTP Error: $httpCode";
            $errorDetails = json_decode($response, true);
            if (isset($errorDetails['error']['message'])) {
                $errorMsg .= " - " . $errorDetails['error']['message'];
            }
            logMessage("ChatGPT API error: $httpCode - $response", 'ERROR');
            return ['success' => false, 'error' => $errorMsg, 'raw_response' => $response];
        }

        return ['success' => false, 'error' => 'Max retries exceeded'];
    }

    /**
     * Make request to Gemini API
     */
    private function makeGeminiRequest($prompt, $maxRetries = 3) {
        $retryDelays = [1, 2, 5];

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            $url = $this->apiUrl . '?key=' . $this->apiKey;
            $data = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1500,
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                logMessage("Gemini API curl error: $error", 'ERROR');
                return ['success' => false, 'error' => $error];
            }

            curl_close($ch);

            if ($httpCode === 200) {
                $result = json_decode($response, true);
                if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                    return [
                        'success' => true,
                        'text' => trim($result['candidates'][0]['content']['parts'][0]['text'])
                    ];
                }
                logMessage("Gemini API unexpected response format: " . $response, 'ERROR');
                return ['success' => false, 'error' => 'Invalid response format', 'raw_response' => $response];
            }

            // Retry logic
            if (in_array($httpCode, [429, 503]) && $attempt < $maxRetries - 1) {
                $waitSeconds = $retryDelays[$attempt];
                logMessage("Gemini API HTTP $httpCode. Retrying in {$waitSeconds}s...", 'WARN');
                sleep($waitSeconds);
                continue;
            }

            // Final error
            $errorMsg = "HTTP Error: $httpCode";
            $errorDetails = json_decode($response, true);
            if (isset($errorDetails['error']['message'])) {
                $errorMsg .= " - " . $errorDetails['error']['message'];
            }
            logMessage("Gemini API error: $httpCode - $response", 'ERROR');
            return ['success' => false, 'error' => $errorMsg, 'raw_response' => $response];
        }

        return ['success' => false, 'error' => 'Max retries exceeded'];
    }

    /**
     * Generate project ideas based on user interests
     */
    public function generateProjectIdeas($interests, $difficulty = 'medium', $count = 5) {
        $prompt = "أنت خبير في توليد أفكار المشاريع البرمجية والتقنية.

المستخدم لديه الاهتمامات التالية:
$interests

مستوى الصعوبة المطلوب: $difficulty
عدد الأفكار المطلوبة: $count

يرجى إنشاء $count أفكار مشاريع مبتكرة وقابلة للتنفيذ مناسبة لهذه الاهتمامات.

لكل مشروع، قدم:
1. عنوان المشروع
2. وصف مختصر (2-3 جمل)
3. التقنيات المطلوبة
4. مستوى الصعوبة (easy/medium/hard)
5. الوقت المتوقع للإنجاز

اكتب الإجابة بالعربية بتنسيق واضح.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        // Parse response into structured data
        $rawResponse = $result['text'];
        $projects = [];
        $lines = explode("\n", $rawResponse);
        $currentProject = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (preg_match('/^(\d+)[.\):]/', $line)) {
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
        $prompt = "أنت خبير في تحليل السير الذاتية واستخراج المهارات والخبرات.

يرجى تحليل السيرة الذاتية التالية:

$cvText

قم باستخراج:
1. المهارات التقنية (Technical Skills) - قائمة بالمهارات البرمجية واللغات والأدوات
2. مجالات الاهتمام (Interests/Domains) - مثل: تطوير الويب، الذكاء الاصطناعي، تطبيقات الموبايل، إلخ
3. مستوى الخبرة (beginner/intermediate/advanced)
4. ملخص قصير عن الشخص

قدم الإجابة بتنسيق واضح ومنظم:

المهارات:
- [قائمة المهارات]

مجالات الاهتمام:
- [قائمة المجالات]

مستوى الخبرة:
[المستوى]

الملخص:
[ملخص مختصر]";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        $rawResponse = $result['text'];

        // Parse the response
        $skills = [];
        $interests = [];
        $experienceLevel = 'intermediate';
        $summary = '';

        $lines = explode("\n", $rawResponse);
        $currentSection = null;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Detect sections
            if (stripos($line, 'المهارات') !== false || stripos($line, 'skills') !== false) {
                $currentSection = 'skills';
                continue;
            }
            if (stripos($line, 'مجالات الاهتمام') !== false || stripos($line, 'interests') !== false) {
                $currentSection = 'interests';
                continue;
            }
            if (stripos($line, 'مستوى الخبرة') !== false || stripos($line, 'experience') !== false) {
                $currentSection = 'experience';
                continue;
            }
            if (stripos($line, 'الملخص') !== false || stripos($line, 'summary') !== false) {
                $currentSection = 'summary';
                continue;
            }

            // Extract data
            if ($currentSection === 'skills' && (strpos($line, '-') === 0 || strpos($line, '•') === 0)) {
                $skill = trim(substr($line, 1));
                if (!empty($skill)) {
                    $skills[] = $skill;
                }
            } elseif ($currentSection === 'interests' && (strpos($line, '-') === 0 || strpos($line, '•') === 0)) {
                $interest = trim(substr($line, 1));
                if (!empty($interest)) {
                    $interests[] = $interest;
                }
            } elseif ($currentSection === 'experience') {
                if (stripos($line, 'beginner') !== false || stripos($line, 'مبتدئ') !== false) {
                    $experienceLevel = 'beginner';
                } elseif (stripos($line, 'advanced') !== false || stripos($line, 'متقدم') !== false) {
                    $experienceLevel = 'advanced';
                } else {
                    $experienceLevel = 'intermediate';
                }
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
