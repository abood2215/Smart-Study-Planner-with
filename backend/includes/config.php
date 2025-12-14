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

// Gemini AI API
// Prefer reading the key from an environment variable for safety. If not set,
// keep a placeholder so the checker page prompts the developer to add a valid key.
// Get API keys at: https://makersuite.google.com/app/apikey
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') !== false ? getenv('GEMINI_API_KEY') : 'YOUR_API_KEY_HERE');
// Use the stable v1 endpoint by default; change if you need a different model.
define('GEMINI_API_URL', getenv('GEMINI_API_URL') !== false ? getenv('GEMINI_API_URL') : 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent');

// OpenAI API Configuration
// Get API keys at: https://platform.openai.com/api-keys
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') !== false ? getenv('OPENAI_API_KEY') : 'YOUR_OPENAI_API_KEY_HERE');
define('OPENAI_API_URL', getenv('OPENAI_API_URL') !== false ? getenv('OPENAI_API_URL') : 'https://api.openai.com/v1/chat/completions');

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
