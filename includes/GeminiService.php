<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

class GeminiService {
    private $apiKey;
    private $apiUrl;

    public function __construct() {
        $this->apiKey = GEMINI_API_KEY;
        $this->apiUrl = GEMINI_API_URL;
    }

    /**
     * Make request to Gemini API with automatic retry on 503/429 errors
     */
    private function makeRequest($prompt) {
        $maxRetries = 3;
        $retryDelays = [1, 2, 5]; // seconds between retries
        $retryableStatusCodes = [503, 429]; // Server overloaded or quota exceeded

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            $response = $this->sendApiRequest($prompt);
            $httpCode = $response['httpCode'];

            // Success case
            if ($httpCode === 200) {
                return $this->parseApiResponse($response['body']);
            }

            // Retryable errors
            if (in_array($httpCode, $retryableStatusCodes) && $attempt < $maxRetries - 1) {
                $waitSeconds = $retryDelays[$attempt];
                logMessage("Gemini API HTTP $httpCode (retryable). Waiting {$waitSeconds}s before retry attempt " . ($attempt + 2) . "/$maxRetries", 'WARN');
                sleep($waitSeconds);
                continue; // Try again
            }

            // Non-retryable errors or final retry failed
            $errorMsg = "HTTP Error: $httpCode";
            $errorDetails = json_decode($response['body'], true);
            if (isset($errorDetails['error']['message'])) {
                $errorMsg .= " - " . $errorDetails['error']['message'];
            }
            logMessage("Gemini API HTTP error (final): $httpCode - {$response['body']}", 'ERROR');
            return ['success' => false, 'error' => $errorMsg, 'raw_response' => $response['body']];
        }

        return ['success' => false, 'error' => 'Max retries exceeded'];
    }

    /**
     * Send raw curl request to Gemini API
     */
    private function sendApiRequest($prompt) {
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
                'maxOutputTokens' => 1024,
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For localhost testing
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            logMessage("Gemini API curl error: $error", 'ERROR');
            return ['httpCode' => 0, 'body' => json_encode(['error' => $error])];
        }

        curl_close($ch);
        return ['httpCode' => $httpCode, 'body' => $response];
    }

    /**
     * Parse successful API response
     */
    private function parseApiResponse($response) {

        $result = json_decode($response, true);

        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return [
                'success' => true,
                'text' => $result['candidates'][0]['content']['parts'][0]['text']
            ];
        }

        // Log the full response for debugging
        logMessage("Gemini API unexpected response format: " . json_encode($result), 'ERROR');
        return ['success' => false, 'error' => 'Invalid response format', 'raw_response' => $response];
    }

    /**
     * Estimate task duration based on title and description
     */
    public function estimateTaskDuration($title, $description = '', $difficulty = 'medium') {
        $prompt = "أنت مساعد ذكي لتقدير وقت إنجاز المهام الدراسية.

المهمة:
العنوان: $title
الوصف: $description
الصعوبة: $difficulty

قدّر الوقت المطلوب لإنجاز هذه المهمة بالساعات.
أعطني فقط رقم الساعات المقدرة (مثال: 3.5 أو 5 أو 8).
لا تضف أي شرح، فقط الرقم.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        // Extract number from response
        $text = trim($result['text']);
        preg_match('/\d+\.?\d*/', $text, $matches);

        if (isset($matches[0])) {
            $hours = floatval($matches[0]);
            return [
                'success' => true,
                'estimated_hours' => $hours,
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
        $preferencesJson = json_encode($preferences, JSON_UNESCAPED_UNICODE);

        $prompt = "أنت مستشار دراسي ذكي. حلل البيانات التالية وأعطني نصائح وتوصيات:

المهام:
$tasksJson

الكورسات:
$coursesJson

تفضيلات الطالب:
$preferencesJson

أعطني:
1. أهم 3 مهام يجب التركيز عليها
2. نصائح لتحسين الأداء الدراسي
3. توصيات لإدارة الوقت

اكتب الإجابة بالعربية بشكل واضح ومنظم.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'recommendations' => $result['text']
        ];
    }

    /**
     * Analyze study progress and give insights
     */
    public function analyzeProgress($userId, $statistics) {
        $statsJson = json_encode($statistics, JSON_UNESCAPED_UNICODE);

        $prompt = "حلل الإحصائيات الدراسية التالية وأعطني تحليل شامل:

$statsJson

أعطني:
1. تقييم الأداء الحالي
2. نقاط القوة
3. المجالات التي تحتاج تحسين
4. نصائح محددة لزيادة الإنتاجية

اكتب التحليل بالعربية بشكل مفصل ومفيد.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'analysis' => $result['text']
        ];
    }

    /**
     * Generate study schedule suggestions
     */
    public function suggestStudySchedule($tasks, $dailyHours, $preferredTime) {
        $tasksJson = json_encode($tasks, JSON_UNESCAPED_UNICODE);

        $prompt = "أنت مخطط دراسي ذكي. لديك المهام التالية:

$tasksJson

الطالب يستطيع الدراسة $dailyHours ساعة يومياً، ويفضل الدراسة في فترة: $preferredTime

اقترح جدول دراسي مفصل لمدة أسبوع.
ضع في الاعتبار:
- أولويات المهام
- المواعيد النهائية
- فترات الراحة
- توزيع المهام بشكل متوازن

اكتب الجدول بالعربية بشكل منظم وواضح.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'schedule' => $result['text']
        ];
    }

    /**
     * Get tips for difficult courses
     */
    public function getCourseTips($courseName, $difficulty, $currentPerformance) {
        $prompt = "أنا طالب أدرس كورس: $courseName
الصعوبة: $difficulty
أدائي الحالي: $currentPerformance%

أعطني:
1. نصائح محددة لتحسين أدائي في هذا الكورس
2. استراتيجيات للدراسة الفعالة
3. مصادر تعليمية مقترحة
4. طرق للتغلب على الصعوبات

اكتب النصائح بالعربية بشكل عملي ومفيد.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'tips' => $result['text']
        ];
    }

    /**
     * Break down complex task into subtasks
     */
    public function breakdownTask($taskTitle, $taskDescription, $estimatedHours) {
        $prompt = "لديك مهمة دراسية كبيرة:
العنوان: $taskTitle
الوصف: $taskDescription
الوقت المقدر: $estimatedHours ساعة

قسّم هذه المهمة إلى مهام فرعية صغيرة (subtasks) يمكن إدارتها بسهولة.

لكل مهمة فرعية، أعطني:
- العنوان
- الوصف المختصر
- الوقت المقدر بالساعات

اكتب القائمة بالعربية بشكل منظم.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'subtasks' => $result['text']
        ];
    }

    /**
     * Motivational message based on progress
     */
    public function getMotivationalMessage($completedTasks, $totalTasks, $avgProgress) {
        $prompt = "الطالب أنجز $completedTasks من أصل $totalTasks مهمة.
متوسط التقدم: $avgProgress%

أعطني رسالة تحفيزية قصيرة (2-3 جمل) بالعربية تشجع الطالب على الاستمرار.
اجعل الرسالة إيجابية ومحفزة.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'message' => trim($result['text'])
        ];
    }

    /**
     * Suggest optimal study technique for course
     */
    public function suggestStudyTechnique($courseName, $difficulty, $learningGoal) {
        $prompt = "كورس: $courseName
الصعوبة: $difficulty
هدف التعلم: $learningGoal

اقترح أفضل تقنية دراسية (Study Technique) لهذا الكورس.
مثل: Pomodoro, Active Recall, Spaced Repetition, Mind Mapping, إلخ.

أعطني:
1. التقنية المقترحة
2. لماذا هي مناسبة لهذا الكورس
3. كيفية تطبيقها خطوة بخطوة

اكتب الإجابة بالعربية بشكل عملي.";

        $result = $this->makeRequest($prompt);

        if (!$result['success']) {
            return ['success' => false, 'error' => $result['error']];
        }

        return [
            'success' => true,
            'technique' => $result['text']
        ];
    }
}
