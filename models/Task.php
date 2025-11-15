<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

class Task {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    /**
     * Create new task
     */
    public function create($user_id, $data) {
        try {
            // Calculate priority score
            $priority_score = calculatePriorityScore(
                $data['deadline'],
                $data['difficulty'] ?? 'medium',
                $data['progress'] ?? 0,
                0
            );

            // Determine initial status
            $status = 'pending';
            $days = daysUntilDeadline($data['deadline']);
            if ($days < 0) {
                $status = 'overdue';
            }

            $stmt = $this->db->prepare("
                INSERT INTO tasks (
                    user_id, course_id, title, description, deadline, difficulty,
                    estimated_hours, completed_hours, progress, priority_score, status
                )
                VALUES (
                    :user_id, :course_id, :title, :description, :deadline, :difficulty,
                    :estimated_hours, :completed_hours, :progress, :priority_score, :status
                )
            ");

            $stmt->execute([
                'user_id' => $user_id,
                'course_id' => $data['course_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'deadline' => $data['deadline'],
                'difficulty' => $data['difficulty'] ?? 'medium',
                'estimated_hours' => $data['estimated_hours'] ?? 1,
                'completed_hours' => $data['completed_hours'] ?? 0,
                'progress' => $data['progress'] ?? 0,
                'priority_score' => $priority_score,
                'status' => $status
            ]);

            $task_id = $this->db->lastInsertId();

            return [
                'success' => true,
                'task_id' => $task_id,
                'message' => 'Task created successfully',
                'priority_score' => $priority_score
            ];

        } catch (PDOException $e) {
            logMessage("Task creation error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to create task'];
        }
    }

    /**
     * Get all tasks for user
     */
    public function getAll($user_id, $filters = []) {
        try {
            $sql = "
                SELECT t.*, c.name as course_name
                FROM tasks t
                LEFT JOIN courses c ON t.course_id = c.id
                WHERE t.user_id = :user_id
            ";
            $params = ['user_id' => $user_id];

            if (isset($filters['status'])) {
                $sql .= " AND t.status = :status";
                $params['status'] = $filters['status'];
            }

            if (isset($filters['difficulty'])) {
                $sql .= " AND t.difficulty = :difficulty";
                $params['difficulty'] = $filters['difficulty'];
            }

            if (isset($filters['course_id'])) {
                $sql .= " AND t.course_id = :course_id";
                $params['course_id'] = $filters['course_id'];
            }

            // Default order by priority
            $order = $filters['order_by'] ?? 'priority_score';
            $direction = $filters['direction'] ?? 'DESC';
            $sql .= " ORDER BY t.$order $direction";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching tasks: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get single task
     */
    public function getById($id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT t.*, c.name as course_name
                FROM tasks t
                LEFT JOIN courses c ON t.course_id = c.id
                WHERE t.id = :id AND t.user_id = :user_id
            ");

            $stmt->execute([
                'id' => $id,
                'user_id' => $user_id
            ]);

            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching task: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Update task
     */
    public function update($id, $user_id, $data) {
        try {
            // Get current task
            $current = $this->getById($id, $user_id);
            if (!$current) {
                return ['success' => false, 'message' => 'Task not found'];
            }

            $fields = [];
            $params = ['id' => $id, 'user_id' => $user_id];

            $allowed_fields = [
                'course_id', 'title', 'description', 'deadline', 'difficulty',
                'estimated_hours', 'completed_hours', 'progress', 'status'
            ];

            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            // Recalculate priority if relevant fields changed
            if (isset($data['deadline']) || isset($data['difficulty']) || isset($data['progress'])) {
                $priority_score = calculatePriorityScore(
                    $data['deadline'] ?? $current['deadline'],
                    $data['difficulty'] ?? $current['difficulty'],
                    $data['progress'] ?? $current['progress'],
                    0
                );
                $fields[] = "priority_score = :priority_score";
                $params['priority_score'] = $priority_score;
            }

            if (empty($fields)) {
                return ['success' => false, 'message' => 'No fields to update'];
            }

            $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = :id AND user_id = :user_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Task not found'];
            }

            return ['success' => true, 'message' => 'Task updated successfully'];

        } catch (PDOException $e) {
            logMessage("Task update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update task'];
        }
    }

    /**
     * Delete task
     */
    public function delete($id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM tasks
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                'id' => $id,
                'user_id' => $user_id
            ]);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Task not found'];
            }

            return ['success' => true, 'message' => 'Task deleted successfully'];

        } catch (PDOException $e) {
            logMessage("Task deletion error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to delete task'];
        }
    }

    /**
     * Update task progress
     */
    public function updateProgress($id, $user_id, $completed_hours, $progress) {
        try {
            $task = $this->getById($id, $user_id);
            if (!$task) {
                return ['success' => false, 'message' => 'Task not found'];
            }

            // Determine status
            $status = $task['status'];
            if ($progress >= 100) {
                $status = 'completed';
            } elseif ($progress > 0) {
                $status = 'in_progress';
            }

            // Recalculate priority
            $priority_score = calculatePriorityScore(
                $task['deadline'],
                $task['difficulty'],
                $progress,
                0
            );

            $stmt = $this->db->prepare("
                UPDATE tasks
                SET completed_hours = :completed_hours,
                    progress = :progress,
                    status = :status,
                    priority_score = :priority_score
                WHERE id = :id AND user_id = :user_id
            ");

            $stmt->execute([
                'completed_hours' => $completed_hours,
                'progress' => $progress,
                'status' => $status,
                'priority_score' => $priority_score,
                'id' => $id,
                'user_id' => $user_id
            ]);

            // Log progress
            $this->logProgress($user_id, $id, $completed_hours, $progress);

            return [
                'success' => true,
                'message' => 'Progress updated successfully',
                'progress' => $progress,
                'status' => $status
            ];

        } catch (PDOException $e) {
            logMessage("Progress update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update progress'];
        }
    }

    /**
     * Log progress
     */
    private function logProgress($user_id, $task_id, $hours_logged, $progress_percentage, $notes = '') {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO progress_logs (user_id, task_id, hours_logged, progress_percentage, notes)
                VALUES (:user_id, :task_id, :hours_logged, :progress_percentage, :notes)
            ");

            $stmt->execute([
                'user_id' => $user_id,
                'task_id' => $task_id,
                'hours_logged' => $hours_logged,
                'progress_percentage' => $progress_percentage,
                'notes' => $notes
            ]);

        } catch (PDOException $e) {
            logMessage("Error logging progress: " . $e->getMessage(), 'ERROR');
        }
    }

    /**
     * Get task statistics
     */
    public function getStatistics($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                    SUM(estimated_hours) as total_estimated_hours,
                    SUM(completed_hours) as total_completed_hours,
                    AVG(progress) as avg_progress
                FROM tasks
                WHERE user_id = :user_id
            ");

            $stmt->execute(['user_id' => $user_id]);
            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching task statistics: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Get urgent tasks (deadline within 7 days)
     */
    public function getUrgentTasks($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT t.*, c.name as course_name
                FROM tasks t
                LEFT JOIN courses c ON t.course_id = c.id
                WHERE t.user_id = :user_id
                AND t.status != 'completed'
                AND t.deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY t.deadline ASC, t.priority_score DESC
            ");

            $stmt->execute(['user_id' => $user_id]);
            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching urgent tasks: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Update overdue tasks
     */
    public function updateOverdueTasks($user_id) {
        try {
            $stmt = $this->db->prepare("
                UPDATE tasks
                SET status = 'overdue'
                WHERE user_id = :user_id
                AND status NOT IN ('completed')
                AND deadline < CURDATE()
            ");

            $stmt->execute(['user_id' => $user_id]);

            return ['success' => true, 'updated' => $stmt->rowCount()];

        } catch (PDOException $e) {
            logMessage("Error updating overdue tasks: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update overdue tasks'];
        }
    }
}
