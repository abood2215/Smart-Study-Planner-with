<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smart_study_planner2');

// Application settings
define('APP_NAME', 'Smart Study Planner');
define('APP_URL', 'http://localhost/Smart-Study-Planner-with');
define('BASE_PATH', __DIR__ . '/..');

// Security settings
// If a .env loader exists, load environment variables from project root
if (file_exists(__DIR__ . '/dotenv.php')) {
    require_once __DIR__ . '/dotenv.php';
}
define('JWT_SECRET', 'your-secret-key-change-this-in-production'); // Change in production
define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);
define('SESSION_LIFETIME', 3600 * 24); // 24 hours

// API settings
define('API_VERSION', 'v1');
define('JSON_OPTIONS', JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// AI API Configuration
// Choose which AI service to use: 'gemini' or 'chatgpt'
define('AI_SERVICE', getenv('AI_SERVICE') !== false ? getenv('AI_SERVICE') : 'chatgpt');

// Gemini AI API
// Get API keys at: https://makersuite.google.com/app/apikey
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') !== false ? getenv('GEMINI_API_KEY') : 'YOUR_GEMINI_API_KEY_HERE');
define('GEMINI_API_URL', getenv('GEMINI_API_URL') !== false ? getenv('GEMINI_API_URL') : 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent');

// ChatGPT (OpenAI) API
// Get API keys at: https://platform.openai.com/api-keys
define('CHATGPT_API_KEY', getenv('CHATGPT_API_KEY') !== false ? getenv('CHATGPT_API_KEY') : 'YOUR_CHATGPT_API_KEY_HERE');
define('CHATGPT_API_URL', getenv('CHATGPT_API_URL') !== false ? getenv('CHATGPT_API_URL') : 'https://api.openai.com/v1/chat/completions');
define('CHATGPT_MODEL', getenv('CHATGPT_MODEL') !== false ? getenv('CHATGPT_MODEL') : 'gpt-4o-mini');

// Timezone
date_default_timezone_set('Asia/Amman');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS settings (only for web requests, not CLI)
if (php_sapi_name() !== 'cli' && !defined('CLI_MODE')) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    // Handle preflight OPTIONS request
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
