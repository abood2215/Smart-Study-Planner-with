<?php
/**
 * Matchmaking API Endpoint
 *
 * This file handles AI-powered matchmaking between students and projects
 * based on skills, interests, and compatibility.
 *
 * @package Smart Study Planner
 * @category API
 * @author Smart Study Planner Team
 * @version 1.0
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Project.php';
require_once __DIR__ . '/../models/User.php';

// Get the HTTP request method
$method = $_SERVER['REQUEST_METHOD'];

// Get action from query string
$action = $_GET['action'] ?? 'match';

try {
    // Require authentication for all matchmaking endpoints
    $user_id = requireAuth();

    $db = getDB();
    $projectModel = new Project();
    $userModel = new User();

    switch ($action) {
        /**
         * Find matching projects for a user based on their skills and interests
         */
        case 'find-projects':
            if ($method === 'GET') {
                // Get user profile
                $stmt = $db->prepare("SELECT interests, skills FROM users WHERE id = :user_id");
                $stmt->execute(['user_id' => $user_id]);
                $user = $stmt->fetch();

                if (!$user) {
                    sendError('User not found', 404);
                }

                // Get all public projects the user is not part of
                $stmt = $db->prepare("
                    SELECT p.*,
                        u.name as owner_name,
                        COUNT(DISTINCT pt.user_id) as team_count,
                        (
                            CASE
                                WHEN p.required_skills IS NOT NULL AND :skills IS NOT NULL
                                THEN (
                                    (LENGTH(:skills) - LENGTH(REPLACE(LOWER(:skills), LOWER(p.required_skills), '')))
                                    / GREATEST(LENGTH(p.required_skills), 1)
                                )
                                ELSE 0
                            END +
                            CASE
                                WHEN p.category IS NOT NULL AND :interests IS NOT NULL
                                THEN (
                                    (LENGTH(:interests) - LENGTH(REPLACE(LOWER(:interests), LOWER(p.category), '')))
                                    / GREATEST(LENGTH(p.category), 1)
                                )
                                ELSE 0
                            END
                        ) as match_score
                    FROM projects p
                    LEFT JOIN users u ON p.owner_id = u.id
                    LEFT JOIN project_team pt ON p.id = pt.project_id
                    WHERE p.is_public = 1
                    AND p.status = 'active'
                    AND p.id NOT IN (
                        SELECT project_id FROM project_team WHERE user_id = :user_id
                    )
                    GROUP BY p.id
                    HAVING team_count < p.max_team_size
                    ORDER BY match_score DESC, p.created_at DESC
                    LIMIT 20
                ");

                $stmt->execute([
                    'user_id' => $user_id,
                    'skills' => $user['skills'],
                    'interests' => $user['interests']
                ]);

                $matches = $stmt->fetchAll();
                sendSuccess($matches, 'Matching projects found successfully');

            } else {
                sendError('Method not allowed', 405);
            }
            break;

        /**
         * Find matching teammates for a specific project
         */
        case 'find-teammates':
            if ($method === 'GET') {
                $project_id = $_GET['project_id'] ?? null;

                if (!$project_id) {
                    sendError('project_id is required', 400);
                }

                // Check if user has access to this project
                if (!$projectModel->userHasAccess($project_id, $user_id)) {
                    sendError('Access denied', 403);
                }

                $matches = $projectModel->findMatchingTeammates($project_id);
                sendSuccess($matches, 'Potential teammates found successfully');

            } else {
                sendError('Method not allowed', 405);
            }
            break;

        /**
         * Calculate compatibility score between user and project
         */
        case 'calculate-compatibility':
            if ($method === 'POST') {
                $data = getJsonInput();

                if (!isset($data['project_id'])) {
                    sendError('project_id is required', 400);
                }

                $project = $projectModel->getById($data['project_id']);
                if (!$project) {
                    sendError('Project not found', 404);
                }

                // Get user profile
                $stmt = $db->prepare("SELECT interests, skills FROM users WHERE id = :user_id");
                $stmt->execute(['user_id' => $user_id]);
                $user = $stmt->fetch();

                // Calculate compatibility score
                $score = 0;
                $factors = [];

                // Skills match
                if ($project['required_skills'] && $user['skills']) {
                    $required = array_map('trim', explode(',', strtolower($project['required_skills'])));
                    $userSkills = array_map('trim', explode(',', strtolower($user['skills'])));
                    $matches = count(array_intersect($required, $userSkills));
                    $skillScore = $matches / count($required) * 100;
                    $score += $skillScore * 0.6; // 60% weight
                    $factors['skills'] = round($skillScore, 2);
                }

                // Interest match
                if ($project['category'] && $user['interests']) {
                    $interests = array_map('trim', explode(',', strtolower($user['interests'])));
                    $interestMatch = in_array(strtolower($project['category']), $interests);
                    $interestScore = $interestMatch ? 100 : 0;
                    $score += $interestScore * 0.4; // 40% weight
                    $factors['interests'] = $interestScore;
                }

                sendSuccess([
                    'compatibility_score' => round($score, 2),
                    'factors' => $factors,
                    'recommendation' => $score >= 70 ? 'highly_compatible' :
                                      ($score >= 40 ? 'compatible' : 'low_compatibility')
                ], 'Compatibility calculated successfully');

            } else {
                sendError('Method not allowed', 405);
            }
            break;

        /**
         * Get recommended users for a user to connect with
         */
        case 'find-connections':
            if ($method === 'GET') {
                // Get user profile
                $stmt = $db->prepare("SELECT interests, skills FROM users WHERE id = :user_id");
                $stmt->execute(['user_id' => $user_id]);
                $currentUser = $stmt->fetch();

                if (!$currentUser) {
                    sendError('User not found', 404);
                }

                // Find users with similar interests/skills
                $stmt = $db->prepare("
                    SELECT id, name, email, interests, skills,
                        (
                            CASE
                                WHEN skills IS NOT NULL AND :skills IS NOT NULL
                                THEN (LENGTH(skills) - LENGTH(REPLACE(LOWER(skills), LOWER(:skills), '')))
                                ELSE 0
                            END +
                            CASE
                                WHEN interests IS NOT NULL AND :interests IS NOT NULL
                                THEN (LENGTH(interests) - LENGTH(REPLACE(LOWER(interests), LOWER(:interests), '')))
                                ELSE 0
                            END
                        ) as similarity_score
                    FROM users
                    WHERE id != :user_id
                    AND (skills IS NOT NULL OR interests IS NOT NULL)
                    ORDER BY similarity_score DESC
                    LIMIT 20
                ");

                $stmt->execute([
                    'user_id' => $user_id,
                    'skills' => $currentUser['skills'],
                    'interests' => $currentUser['interests']
                ]);

                $connections = $stmt->fetchAll();
                sendSuccess($connections, 'Recommended connections found successfully');

            } else {
                sendError('Method not allowed', 405);
            }
            break;

        default:
            sendError('Invalid action', 404);
    }

} catch (Exception $e) {
    logMessage("Matchmaking API Error: " . $e->getMessage(), 'ERROR');
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
