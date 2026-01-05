<?php
/**
 * Project Model
 *
 * Handles all database operations related to projects including
 * creation, retrieval, updates, team management, and matchmaking.
 *
 * @package Smart Study Planner
 * @category Model
 * @author Smart Study Planner Team
 * @version 1.0
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

class Project {
    private $db;

    /**
     * Constructor - Initialize database connection
     */
    public function __construct() {
        $this->db = getDB();
    }

    /**
     * Create new project
     *
     * @param int $user_id Owner user ID
     * @param array $data Project data
     * @return array Result with success status and project_id
     */
    public function create($user_id, $data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO projects (
                    owner_id, name, description, plan, category, status,
                    required_skills, is_public, max_team_size
                )
                VALUES (
                    :owner_id, :name, :description, :plan, :category, :status,
                    :required_skills, :is_public, :max_team_size
                )
            ");

            $stmt->execute([
                'owner_id' => $user_id,
                'name' => $data['name'],
                'description' => $data['description'],
                'plan' => $data['plan'] ?? null,
                'category' => $data['category'] ?? 'general',
                'status' => $data['status'] ?? 'active',
                'required_skills' => $data['required_skills'] ?? null,
                'is_public' => $data['is_public'] ?? 1,
                'max_team_size' => $data['max_team_size'] ?? 5
            ]);

            $project_id = $this->db->lastInsertId();

            // Add owner as first team member
            $addMemberResult = $this->addMember($project_id, $user_id, 'owner');

            if (!$addMemberResult['success']) {
                logMessage("Failed to add owner to project team: " . $addMemberResult['message'], 'ERROR');
                // Continue anyway since owner_id is set in projects table
            }

            logMessage("Project $project_id created successfully by user $user_id", 'INFO');

            return [
                'success' => true,
                'project_id' => $project_id,
                'message' => 'Project created successfully'
            ];

        } catch (PDOException $e) {
            logMessage("Project creation error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to create project'];
        }
    }

    /**
     * Get user's projects
     *
     * @param int $user_id User ID
     * @param array $filters Optional filters
     * @return array List of projects
     */
    public function getUserProjects($user_id, $filters = []) {
        try {
            $sql = "
                SELECT DISTINCT p.*,
                    COUNT(DISTINCT pt.user_id) as team_count
                FROM projects p
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE (p.owner_id = :owner_id OR pt.user_id = :team_user_id)
            ";
            $params = [
                'owner_id' => $user_id,
                'team_user_id' => $user_id
            ];

            // Apply filters
            if (isset($filters['status'])) {
                $sql .= " AND p.status = :status";
                $params['status'] = $filters['status'];
            }

            if (isset($filters['category'])) {
                $sql .= " AND p.category = :category";
                $params['category'] = $filters['category'];
            }

            if (isset($filters['search'])) {
                $sql .= " AND (p.name LIKE :search OR p.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching user projects: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get all public projects
     *
     * @param array $filters Optional filters
     * @return array List of public projects
     */
    public function getAllPublic($filters = []) {
        try {
            $sql = "
                SELECT p.*,
                    u.name as owner_name,
                    COUNT(DISTINCT pt.user_id) as team_count
                FROM projects p
                LEFT JOIN users u ON p.owner_id = u.id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE p.is_public = 1
            ";
            $params = [];

            // Apply filters
            if (isset($filters['status'])) {
                $sql .= " AND p.status = :status";
                $params['status'] = $filters['status'];
            }

            if (isset($filters['category'])) {
                $sql .= " AND p.category = :category";
                $params['category'] = $filters['category'];
            }

            if (isset($filters['search'])) {
                $sql .= " AND (p.name LIKE :search OR p.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching public projects: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get projects owned by user
     *
     * @param int $user_id User ID
     * @param array $filters Optional filters
     * @return array List of owned projects
     */
    public function getOwnedProjects($user_id, $filters = []) {
        try {
            $sql = "
                SELECT p.*,
                    COUNT(DISTINCT pt.user_id) as team_count
                FROM projects p
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE p.owner_id = :owner_id
            ";
            $params = ['owner_id' => $user_id];

            // Apply filters
            if (isset($filters['status'])) {
                $sql .= " AND p.status = :status";
                $params['status'] = $filters['status'];
            }

            if (isset($filters['category'])) {
                $sql .= " AND p.category = :category";
                $params['category'] = $filters['category'];
            }

            if (isset($filters['search'])) {
                $sql .= " AND (p.name LIKE :search OR p.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching owned projects: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get projects where user is a member (but not owner)
     *
     * @param int $user_id User ID
     * @param array $filters Optional filters
     * @return array List of member projects
     */
    public function getMemberProjects($user_id, $filters = []) {
        try {
            $sql = "
                SELECT DISTINCT p.*,
                    u.name as owner_name,
                    COUNT(DISTINCT pt2.user_id) as team_count
                FROM projects p
                INNER JOIN project_team pt ON p.id = pt.project_id AND pt.user_id = :user_id
                LEFT JOIN users u ON p.owner_id = u.id
                LEFT JOIN project_team pt2 ON p.id = pt2.project_id
                WHERE p.owner_id != :owner_id
            ";
            $params = [
                'user_id' => $user_id,
                'owner_id' => $user_id
            ];

            // Apply filters
            if (isset($filters['status'])) {
                $sql .= " AND p.status = :status";
                $params['status'] = $filters['status'];
            }

            if (isset($filters['category'])) {
                $sql .= " AND p.category = :category";
                $params['category'] = $filters['category'];
            }

            if (isset($filters['search'])) {
                $sql .= " AND (p.name LIKE :search OR p.description LIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }

            $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching member projects: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get single project by ID
     *
     * @param int $id Project ID
     * @return array|null Project data
     */
    public function getById($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*,
                    u.name as owner_name,
                    u.email as owner_email
                FROM projects p
                LEFT JOIN users u ON p.owner_id = u.id
                WHERE p.id = :id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching project: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Update project
     *
     * @param int $id Project ID
     * @param array $data Update data
     * @return array Result with success status
     */
    public function update($id, $data) {
        try {
            $fields = [];
            $params = ['id' => $id];

            $allowed_fields = [
                'name', 'description', 'category', 'status',
                'required_skills', 'is_public', 'max_team_size'
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

            $sql = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Project not found'];
            }

            return ['success' => true, 'message' => 'Project updated successfully'];

        } catch (PDOException $e) {
            logMessage("Project update error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to update project'];
        }
    }

    /**
     * Delete project
     *
     * @param int $id Project ID
     * @return array Result with success status
     */
    public function delete($id) {
        try {
            // Delete team members first
            $stmt = $this->db->prepare("DELETE FROM project_team WHERE project_id = :id");
            $stmt->execute(['id' => $id]);

            // Delete project
            $stmt = $this->db->prepare("DELETE FROM projects WHERE id = :id");
            $stmt->execute(['id' => $id]);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Project not found'];
            }

            return ['success' => true, 'message' => 'Project deleted successfully'];

        } catch (PDOException $e) {
            logMessage("Project deletion error: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to delete project'];
        }
    }

    /**
     * Check if user is project owner
     *
     * @param int $project_id Project ID
     * @param int $user_id User ID
     * @return bool True if user is owner
     */
    public function isOwner($project_id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM projects
                WHERE id = :project_id AND owner_id = :user_id
            ");

            $stmt->execute([
                'project_id' => $project_id,
                'user_id' => $user_id
            ]);

            return $stmt->fetchColumn() > 0;

        } catch (PDOException $e) {
            logMessage("Error checking project ownership: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Check if user has access to project
     *
     * @param int $project_id Project ID
     * @param int $user_id User ID
     * @return bool True if user has access
     */
    public function userHasAccess($project_id, $user_id) {
        try {
            // First, check if project exists and get basic info
            $stmt = $this->db->prepare("
                SELECT owner_id, is_public FROM projects WHERE id = :project_id
            ");
            $stmt->execute(['project_id' => $project_id]);
            $project = $stmt->fetch();

            if (!$project) {
                logMessage("Project $project_id does not exist", 'WARNING');
                return false;
            }

            // Check if user is the owner
            if ($project['owner_id'] == $user_id) {
                logMessage("User $user_id has access to project $project_id (owner)", 'DEBUG');
                return true;
            }

            // Check if project is public
            if ($project['is_public'] == 1) {
                logMessage("User $user_id has access to project $project_id (public)", 'DEBUG');
                return true;
            }

            // Check if user is a team member
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM project_team
                WHERE project_id = :project_id AND user_id = :user_id
            ");
            $stmt->execute([
                'project_id' => $project_id,
                'user_id' => $user_id
            ]);

            if ($stmt->fetchColumn() > 0) {
                logMessage("User $user_id has access to project $project_id (team member)", 'DEBUG');
                return true;
            }

            logMessage("User $user_id does NOT have access to project $project_id (owner: {$project['owner_id']}, is_public: {$project['is_public']})", 'WARNING');
            return false;

        } catch (PDOException $e) {
            logMessage("Error checking project access: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Add team member to project
     *
     * @param int $project_id Project ID
     * @param int $user_id User ID to add
     * @param string $role Member role (owner, member)
     * @return array Result with success status
     */
    public function addMember($project_id, $user_id, $role = 'member') {
        try {
            // Check if already a member
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM project_team
                WHERE project_id = :project_id AND user_id = :user_id
            ");
            $stmt->execute([
                'project_id' => $project_id,
                'user_id' => $user_id
            ]);

            if ($stmt->fetchColumn() > 0) {
                return ['success' => false, 'message' => 'User is already a team member'];
            }

            // Add member
            $stmt = $this->db->prepare("
                INSERT INTO project_team (project_id, user_id, role)
                VALUES (:project_id, :user_id, :role)
            ");

            $stmt->execute([
                'project_id' => $project_id,
                'user_id' => $user_id,
                'role' => $role
            ]);

            return ['success' => true, 'message' => 'Team member added successfully'];

        } catch (PDOException $e) {
            logMessage("Error adding team member: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to add team member'];
        }
    }

    /**
     * Remove team member from project
     *
     * @param int $project_id Project ID
     * @param int $user_id User ID to remove
     * @return array Result with success status
     */
    public function removeMember($project_id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM project_team
                WHERE project_id = :project_id AND user_id = :user_id AND role != 'owner'
            ");

            $stmt->execute([
                'project_id' => $project_id,
                'user_id' => $user_id
            ]);

            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Member not found or cannot remove owner'];
            }

            return ['success' => true, 'message' => 'Team member removed successfully'];

        } catch (PDOException $e) {
            logMessage("Error removing team member: " . $e->getMessage(), 'ERROR');
            return ['success' => false, 'message' => 'Failed to remove team member'];
        }
    }

    /**
     * Get all team members for a project
     *
     * @param int $project_id Project ID
     * @return array List of team members
     */
    public function getTeamMembers($project_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT pt.*, u.name, u.email, u.interests, u.skills
                FROM project_team pt
                LEFT JOIN users u ON pt.user_id = u.id
                WHERE pt.project_id = :project_id
                ORDER BY pt.joined_at ASC
            ");

            $stmt->execute(['project_id' => $project_id]);
            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching team members: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get user statistics
     *
     * @param int $user_id User ID
     * @return array|null Statistics data
     */
    public function getUserStatistics($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT CASE WHEN p.owner_id = :owner_id THEN p.id END) as owned_projects,
                    COUNT(DISTINCT pt.project_id) as member_projects,
                    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
                    COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects
                FROM projects p
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE p.owner_id = :where_owner_id OR pt.user_id = :team_user_id
            ");

            $stmt->execute([
                'owner_id' => $user_id,
                'where_owner_id' => $user_id,
                'team_user_id' => $user_id
            ]);
            return $stmt->fetch();

        } catch (PDOException $e) {
            logMessage("Error fetching project statistics: " . $e->getMessage(), 'ERROR');
            return [
                'owned_projects' => 0,
                'member_projects' => 0,
                'active_projects' => 0,
                'completed_projects' => 0
            ];
        }
    }

    /**
     * Find matching teammates based on project requirements
     *
     * @param int $project_id Project ID
     * @return array List of potential teammates
     */
    public function findMatchingTeammates($project_id) {
        try {
            $project = $this->getById($project_id);
            if (!$project) {
                return [];
            }

            $required_skills = $project['required_skills'] ?: '';
            $category = $project['category'] ?: '';

            // Enhanced matching algorithm with multiple factors
            $stmt = $this->db->prepare("
                SELECT u.id, u.name, u.email, u.interests, u.skills,
                    (
                        -- Skills match (60% weight)
                        CASE
                            WHEN u.skills IS NOT NULL AND :required_skills1 != ''
                            THEN (
                                (LENGTH(LOWER(u.skills)) - LENGTH(REPLACE(LOWER(u.skills), LOWER(:required_skills2), '')))
                                / GREATEST(LENGTH(:required_skills3), 1) * 0.6
                            )
                            ELSE 0
                        END
                        +
                        -- Interest match (30% weight)
                        CASE
                            WHEN u.interests IS NOT NULL AND :category1 != ''
                            THEN (
                                (LENGTH(LOWER(u.interests)) - LENGTH(REPLACE(LOWER(u.interests), LOWER(:category2), '')))
                                / GREATEST(LENGTH(:category3), 1) * 0.3
                            )
                            ELSE 0
                        END
                        +
                        -- Has any skills (10% weight)
                        CASE
                            WHEN u.skills IS NOT NULL AND u.skills != ''
                            THEN 0.1
                            ELSE 0
                        END
                    ) as match_score
                FROM users u
                WHERE u.id NOT IN (
                    SELECT user_id FROM project_team WHERE project_id = :project_id
                )
                HAVING match_score > 0
                ORDER BY match_score DESC
                LIMIT 20
            ");

            $stmt->execute([
                'project_id' => $project_id,
                'required_skills1' => $required_skills,
                'required_skills2' => $required_skills,
                'required_skills3' => $required_skills,
                'category1' => $category,
                'category2' => $category,
                'category3' => $category
            ]);

            $matches = $stmt->fetchAll();

            logMessage("Found " . count($matches) . " matching teammates for project $project_id", 'DEBUG');

            return $matches;

        } catch (PDOException $e) {
            logMessage("Error finding matching teammates: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get comments for a project
     *
     * @param int $project_id Project ID
     * @return array List of comments with user info
     */
    public function getComments($project_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*,
                    u.name as user_name,
                    u.email as user_email
                FROM project_comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.project_id = :project_id
                ORDER BY c.created_at ASC
            ");

            $stmt->execute(['project_id' => $project_id]);

            return $stmt->fetchAll();

        } catch (PDOException $e) {
            logMessage("Error fetching comments: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Add a comment to a project
     *
     * @param array $data Comment data
     * @return array Result with success status
     */
    public function addComment($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO project_comments (project_id, user_id, comment, parent_id)
                VALUES (:project_id, :user_id, :comment, :parent_id)
            ");

            $stmt->execute([
                'project_id' => $data['project_id'],
                'user_id' => $data['user_id'],
                'comment' => $data['comment'],
                'parent_id' => $data['parent_id']
            ]);

            $comment_id = $this->db->lastInsertId();

            return [
                'success' => true,
                'comment_id' => $comment_id,
                'message' => 'Comment added successfully'
            ];

        } catch (PDOException $e) {
            logMessage("Error adding comment: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Failed to add comment'
            ];
        }
    }

    /**
     * Update project status
     *
     * @param int $project_id Project ID
     * @param string $status New status
     * @return array Result with success status
     */
    public function updateStatus($project_id, $status) {
        try {
            $stmt = $this->db->prepare("
                UPDATE projects
                SET status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :project_id
            ");

            $stmt->execute([
                'status' => $status,
                'project_id' => $project_id
            ]);

            return [
                'success' => true,
                'message' => 'Status updated successfully'
            ];

        } catch (PDOException $e) {
            logMessage("Error updating project status: " . $e->getMessage(), 'ERROR');
            return [
                'success' => false,
                'message' => 'Failed to update status'
            ];
        }
    }
}
