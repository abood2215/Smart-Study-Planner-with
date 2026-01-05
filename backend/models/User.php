<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

class User {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    /**
     * Create new user
     */
    public function create($name, $email, $password) {
        try {
            // Check if email exists
            if ($this->findByEmail($email)) {
                return ['success' => false, 'message' => 'Email already exists'];
            }

            $hashed_password = hashPassword($password);

            $stmt = $this->db->prepare("
                INSERT INTO users (name, email, password)
                VALUES (:name, :email, :password)
            ");

            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'password' => $hashed_password
            ]);

            $user_id = $this->db->lastInsertId();

            // Create default preferences
            $this->createDefaultPreferences($user_id);

            return [
                'success' => true,
                'user_id' => $user_id,
                'message' => 'User created successfully'
            ];

        } catch (PDOException $e) {
            logMessage("User creation error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to create user'];
        }
    }

    /**
     * Find user by email
     */
    public function findByEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    /**
     * Find user by ID
     */
    public function findById($id) {
        $stmt = $this->db->prepare("SELECT id, name, email, interests, skills, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Authenticate user
     */
    public function authenticate($email, $password) {
        $user = $this->findByEmail($email);

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        if (!verifyPassword($password, $user['password'])) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        $token = generateToken($user['id']);

        return [
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ];
    }

    /**
     * Update user
     */
    public function update($id, $data) {
        try {
            $fields = [];
            $params = ['id' => $id];

            if (isset($data['name'])) {
                $fields[] = 'name = :name';
                $params['name'] = $data['name'];
            }

            if (isset($data['email'])) {
                // Check if new email is already taken
                $existing = $this->findByEmail($data['email']);
                if ($existing && $existing['id'] != $id) {
                    return ['success' => false, 'message' => 'Email already exists'];
                }
                $fields[] = 'email = :email';
                $params['email'] = $data['email'];
            }

            if (isset($data['password'])) {
                $fields[] = 'password = :password';
                $params['password'] = hashPassword($data['password']);
            }

            if (isset($data['interests'])) {
                $fields[] = 'interests = :interests';
                $params['interests'] = sanitize($data['interests']);
            }

            if (isset($data['skills'])) {
                $fields[] = 'skills = :skills';
                $params['skills'] = sanitize($data['skills']);
            }

            if (empty($fields)) {
                return ['success' => false, 'message' => 'No fields to update'];
            }

            $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return ['success' => true, 'message' => 'User updated successfully'];

        } catch (PDOException $e) {
            logMessage("User update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update user'];
        }
    }

    /**
     * Delete user
     */
    public function delete($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute(['id' => $id]);

            return ['success' => true, 'message' => 'User deleted successfully'];

        } catch (PDOException $e) {
            logMessage("User deletion error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to delete user'];
        }
    }

    /**
     * Create default preferences for new user
     */
    private function createDefaultPreferences($user_id) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_preferences (user_id)
                VALUES (:user_id)
            ");
            $stmt->execute(['user_id' => $user_id]);
        } catch (PDOException $e) {
            logMessage("Error creating default preferences: " . $e->getMessage(), 'ERROR');
        }
    }

    /**
     * Get user preferences
     */
    public function getPreferences($user_id) {
        $stmt = $this->db->prepare("SELECT * FROM user_preferences WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $user_id]);
        return $stmt->fetch();
    }

    /**
     * Update user preferences
     */
    public function updatePreferences($user_id, $data) {
        try {
            $fields = [];
            $params = ['user_id' => $user_id];

            $allowed_fields = [
                'preferred_study_time',
                'daily_study_hours',
                'break_duration_minutes',
                'session_duration_minutes',
                'timezone'
            ];

            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                return ['success' => false, 'message' => 'No fields to update'];
            }

            $sql = "UPDATE user_preferences SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return ['success' => true, 'message' => 'Preferences updated successfully'];

        } catch (PDOException $e) {
            logMessage("Preferences update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update preferences'];
        }
    }
}
