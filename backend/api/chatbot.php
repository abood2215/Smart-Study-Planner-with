<?php
/**
 * Chatbot API Endpoint
 * Handles AI-powered chat interactions
 */

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/OpenAIService.php';

try {
    // Set UTF-8 encoding for database
    if (function_exists('mysqli_set_charset')) {
        mysqli_set_charset($GLOBALS['connection'], 'utf8mb4');
    }
    
    // Debug: Log request headers
    logMessage("Chatbot API Request - Method: " . $_SERVER['REQUEST_METHOD'] . ", Headers: " . json_encode(getallheaders()), 'INFO');
    
    // Require authentication
    $user_id = requireAuth();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $data = getJsonInput();

    if (!isset($data['message']) || empty(trim($data['message']))) {
        sendError('Message is required', 400);
    }

    // Handle Arabic and other UTF-8 text
    $userMessage = $data['message'];
    if (is_string($userMessage)) {
        $userMessage = trim($userMessage);
        // Ensure UTF-8 encoding
        if (!mb_check_encoding($userMessage, 'UTF-8')) {
            $userMessage = mb_convert_encoding($userMessage, 'UTF-8');
        }
    }
    $userMessage = sanitize($userMessage);

    // Initialize OpenAI service
    $aiService = new OpenAIService();

    // Build context for better responses
    $systemPrompt = "You are a helpful study assistant for the 'Smart Study Planner' application. ";
    $systemPrompt .= "Help students with their courses, tasks, scheduling, study strategies, and general academic questions. ";
    $systemPrompt .= "Be encouraging, provide practical advice, and keep responses concise (2-3 paragraphs max). ";
    $systemPrompt .= "If asked about features, explain how to use the app. If asked personal questions unrelated to studying, politely redirect.";

    // Generate response using OpenAI
    $response = $aiService->generateInsights(
        $systemPrompt . "\n\nStudent question: " . $userMessage,
        [
            'temperature' => 0.7,
            'max_tokens' => 300
        ]
    );

    if (!$response['success']) {
        // Fallback response if API fails
        $fallbackResponse = getFallbackResponse($userMessage);
        sendSuccess([
            'response' => $fallbackResponse,
            'source' => 'fallback'
        ], 'Response generated');
    } else {
        sendSuccess([
            'response' => trim($response['content']),
            'source' => 'openai'
        ], 'Response generated');
    }

} catch (Exception $e) {
    logMessage("Chatbot API Error: " . $e->getMessage(), 'ERROR');
    sendError('Failed to process your message', 500);
}

/**
 * Provide fallback responses when AI API is unavailable
 */
function getFallbackResponse($message) {
    $message = strtolower($message);
    
    // Handle both Arabic and English messages
    
    // Arabic keywords
    if (strpos($message, 'مرحبا') !== false || strpos($message, 'هلا') !== false || strpos($message, 'السلام') !== false) {
        return "مرحباً! أنا مساعدك الدراسي. كيف يمكنني مساعدتك اليوم؟ يمكنك أن تسأل عن: الدروس، المهام، جدول الدراسة، أو نصائح للدراسة الفعالة. 📚";
    }
    
    if (strpos($message, 'كيفية') !== false || strpos($message, 'كيف') !== false) {
        return "يمكنني مساعدتك في تقنيات وأساليب الدراسة! ما الموضوع المحدد الذي تود المساعدة فيه؟ اخبرني عن الموضوع بالتفصيل. 📖";
    }
    
    if (strpos($message, 'تحفيز') !== false || strpos($message, 'متعب') !== false || strpos($message, 'إرهاق') !== false) {
        return "تذكر: كل خطوة صغيرة مهمة! قسّم مهامك لأجزاء أصغر، خذ فترات راحة، واحتفل بتقدمك. أنت تستطيع! 💪";
    }
    
    if (strpos($message, 'مهمة') !== false || strpos($message, 'واجب') !== false) {
        return "حسناً! أخبرني أكثر عن مهمتك - ما المادة، والموعد النهائي، ومستوى التقدم الحالي؟ هذا سيساعدني في إعطاؤك اقتراحات أفضل. ✅";
    }
    
    if (strpos($message, 'جدول') !== false || strpos($message, 'وقت') !== false || strpos($message, 'إدارة') !== false) {
        return "إدارة الوقت أساسية للنجاح! جرّب تقنية بومودورو (25 دقيقة دراسة + 5 دقائق راحة). استخدم ميزة الجدول لتخطيط جلسات الدراسة. ⏰";
    }
    
    if (strpos($message, 'python') !== false) {
        return "Python لغة رائعة! ابدأ بالأساسيات: المتغيرات، أنواع البيانات، التحكم في التدفق. ثم مارس كتابة برامج صغيرة. 🐍";
    }
    
    if (strpos($message, 'javascript') !== false || strpos($message, 'جافا') !== false) {
        return "JavaScript يقوّي تفاعل الويب! احرص على إتقان DOM والدوال والمتغيرات. ثم استكشف الأطر والمكتبات. 🌐";
    }
    
    if (strpos($message, 'database') !== false || strpos($message, 'sql') !== false || strpos($message, 'قاعدة بيانات') !== false) {
        return "قواعد البيانات مهمة جداً! تعلم SQL الأساسية: SELECT, INSERT, UPDATE, DELETE. مارس مع بيانات حقيقية! 🗄️";
    }

    // English keywords (for compatibility)
    if (strpos($message, 'hello') !== false || strpos($message, 'hi') !== false) {
        return "Hello! I'm your Study Assistant. How can I help you with your studies today? You can ask me about courses, tasks, scheduling, or study tips.";
    }

    if (strpos($message, 'how to') !== false || strpos($message, 'how do i') !== false) {
        return "I can help you with study techniques and strategies! What specific topic would you like help with? Please describe what you're trying to learn, and I'll provide guidance.";
    }

    if (strpos($message, 'motivation') !== false || strpos($message, 'tired') !== false) {
        return "Remember, every small step counts! Break your tasks into smaller chunks, take breaks, and celebrate your progress. You've got this! 💪";
    }

    if (strpos($message, 'task') !== false || strpos($message, 'assignment') !== false) {
        return "Great! Tell me more about your task - what's the subject, deadline, and current progress? This will help me give you better suggestions.";
    }

    if (strpos($message, 'schedule') !== false || strpos($message, 'time') !== false) {
        return "Time management is key to success! Try the Pomodoro technique (25 min study + 5 min break). Use the Schedule feature to plan your study sessions.";
    }

    // Default response (in both languages)
    return "هذا سؤال مثير للاهتمام! بينما أركز على المواضيع المتعلقة بالدراسة، أنا هنا للمساعدة. هل يمكنك إعطائي السياق حول ما تدرسه أو تحاول إنجازه؟";
}
?>
