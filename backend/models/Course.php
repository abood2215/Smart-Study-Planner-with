<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

class Course {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    /**
     * Create new course
     */
    public function create($user_id, $data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO courses (user_id, name, difficulty, total_hours, completed_hours, progress, performance)
                VALUES (:user_id, :name, :difficulty, :total_hours, :completed_hours, :progress, :performance)
            ");

            $stmt->execute([
                'user_id' => $user_id,
                'name' => $data['name'],
                'difficulty' => $data['difficulty'] ?? 'medium',
                'total_hours' => $data['total_hours'] ?? 0,
                'completed_hours' => $data['completed_hours'] ?? 0,
                'progress' => $data['progress'] ?? 0,
                'performance' => $data['performance'] ?? 0
            ]);

            $course_id = $this->db->lastInsertId();

            return [
                'success' => true,
                'course_id' => $course_id,
                'message' => 'Course created successfully'
            ];

        } catch (PDOException $e) {
            logMessage("Course creation error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to create course'];
        }
    }

    /**
     * Get all courses for user
     */
    public function getAll($user_id, $filters = []) {
        try {
            $sql = "SELECT * FROM courses WHERE user_id = :user_id";
            $params = ['user_id' => $user_id];

            if (isset($filters['difficulty'])) {
                $sql .= " AND difficulty = :difficulty";
                $params['difficulty'] = $filters['difficulty'];
            }

            $sql .= " ORDER BY created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching courses: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get single course
     */
    public function getById($id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM courses
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                'id' => $id,
                'user_id' => $user_id
            ]);

            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching course: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Update course
     */
    public function update($id, $user_id, $data) {
        try {
            $fields = [];
            $params = ['id' => $id, 'user_id' => $user_id];

            $allowed_fields = [
                'name', 'difficulty', 'total_hours', 'completed_hours',
                'progress', 'performance'
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

            $sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Course not found'];
            }

            return ['success' => true, 'message' => 'Course updated successfully'];

        } catch (PDOException $e) {
            logMessage("Course update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update course'];
        }
    }

    /**
     * Delete course
     */
    public function delete($id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM courses
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                'id' => $id,
                'user_id' => $user_id
            ]);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Course not found'];
            }

            return ['success' => true, 'message' => 'Course deleted successfully'];

        } catch (PDOException $e) {
            logMessage("Course deletion error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to delete course'];
        }
    }

    /**
     * Update progress
     */
    public function updateProgress($id, $user_id, $completed_hours) {
        try {
            $course = $this->getById($id, $user_id);
            if (!$course) {
                return ['success' => false, 'message' => 'Course not found'];
            }

            $progress = 0;
            if ($course['total_hours'] > 0) {
                $progress = min(100, ($completed_hours / $course['total_hours']) * 100);
            }

            $stmt = $this->db->prepare("
                UPDATE courses
                SET completed_hours = :completed_hours, progress = :progress
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                'completed_hours' => $completed_hours,
                'progress' => $progress,
                'id' => $id,
                'user_id' => $user_id
            ]);

            return [
                'success' => true,
                'message' => 'Progress updated successfully',
                'progress' => $progress
            ];

        } catch (PDOException $e) {
            logMessage("Progress update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update progress'];
        }
    }

    /**
     * Get course statistics
     */
    public function getStatistics($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*) as total_courses,
                    SUM(total_hours) as total_hours,
                    SUM(completed_hours) as completed_hours,
                    AVG(progress) as avg_progress,
                    AVG(performance) as avg_performance
                FROM courses
                WHERE user_id = :user_id
            ");

            $stmt->execute(['user_id' => $user_id]);
            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching course statistics: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }
}
