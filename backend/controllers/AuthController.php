<?php

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * Register new user
     */
    public function register() {
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['name', 'email', 'password']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        // Sanitize input
        $name = sanitize($data['name']);
        $email = sanitize($data['email']);
        $password = $data['password'];

        // Validate email
        if (!validateEmail($email)) {
            sendError('Invalid email format', 400);
        }

        // Validate password length
        if (strlen($password) < 6) {
            sendError('Password must be at least 6 characters', 400);
        }

        // Create user
        $result = $this->userModel->create($name, $email, $password);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        // Auto login after registration
        $auth_result = $this->userModel->authenticate($email, $password);

        sendSuccess([
            'user_id' => $result['user_id'],
            'token' => $auth_result['token'],
            'user' => $auth_result['user']
        ], 'Registration successful', 201);
    }

    /**
     * Login user
     */
    public function login() {
     
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['email', 'password']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        $email = sanitize($data['email']);
        $password = $data['password'];

        // Authenticate
        $result = $this->userModel->authenticate($email, $password);

        if (!$result['success']) {
            sendError($result['message'], 401);
        }

        sendSuccess([
            'token' => $result['token'],
            'user' => $result['user']
        ], 'Login successful');
    }

    /**
     * Get current user profile
     */
    public function profile() {
        $user_id = requireAuth();

        $user = $this->userModel->findById($user_id);

        if (!$user) {
            sendError('User not found', 404);
        }

        // Get preferences
        $preferences = $this->userModel->getPreferences($user_id);

        sendSuccess([
            'user' => $user,
            'preferences' => $preferences
        ], 'Profile retrieved successfully');
    }

    /**
     * Update user profile
     */
    public function updateProfile() {
        $user_id = requireAuth();
        $data = getJsonInput();

        $result = $this->userModel->update($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Update user preferences
     */
    public function updatePreferences() {
        $user_id = requireAuth();
        $data = getJsonInput();

        $result = $this->userModel->updatePreferences($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Get user preferences
     */
    public function getPreferences() {
        $user_id = requireAuth();

        $preferences = $this->userModel->getPreferences($user_id);

        if (!$preferences) {
            sendError('Preferences not found', 404);
        }

        sendSuccess($preferences, 'Preferences retrieved successfully');
    }

    /**
     * Search for users by name or email
     */
    public function searchUsers() {
        $user_id = requireAuth();

        $searchTerm = $_GET['q'] ?? '';

        if (strlen($searchTerm) < 2) {
            sendError('Search term must be at least 2 characters', 400);
        }

        try {
            $db = getDB();

            $stmt = $db->prepare("
                SELECT id, name, email, skills, interests
                FROM users
                WHERE (name LIKE :search_name OR email LIKE :search_email)
                AND id != :user_id
                ORDER BY name ASC
                LIMIT 20
            ");

            $searchParam = '%' . $searchTerm . '%';
            $stmt->execute([
                'search_name' => $searchParam,
                'search_email' => $searchParam,
                'user_id' => $user_id
            ]);

            $users = $stmt->fetchAll();

            logMessage("Search users: found " . count($users) . " users for term: $searchTerm", 'DEBUG');

            sendSuccess($users, 'Users found successfully');

        } catch (PDOException $e) {
            logMessage("Error searching users: " . $e->getMessage(), 'ERROR');
            sendError('Failed to search users', 500);
        }
    }
}
