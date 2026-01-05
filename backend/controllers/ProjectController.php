<?php
/**
 * ProjectController
 *
 * Handles all project-related operations including creation, management,
 * team member management, and project discovery.
 *
 * @package Smart Study Planner
 * @category Controller
 * @author Smart Study Planner Team
 * @version 1.0
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Project.php';

class ProjectController {
    private $projectModel;

    /**
     * Constructor - Initialize the project model
     */
    public function __construct() {
        $this->projectModel = new Project();
    }

    /**
     * Get all projects
     * Supports filtering by status, category, and search
     */
    public function index() {
        $user_id = requireAuth();

        $filters = [];

        // Filter by status (active, completed, archived)
        if (isset($_GET['status'])) {
            $filters['status'] = sanitize($_GET['status']);
        }

        // Filter by category
        if (isset($_GET['category'])) {
            $filters['category'] = sanitize($_GET['category']);
        }

        // Search by name or description
        if (isset($_GET['search'])) {
            $filters['search'] = sanitize($_GET['search']);
        }

        // Get user's own projects or all public projects
        $scope = $_GET['scope'] ?? 'own'; // 'own' or 'all'

        if ($scope === 'all') {
            $projects = $this->projectModel->getAllPublic($filters);
        } else {
            $projects = $this->projectModel->getUserProjects($user_id, $filters);
        }

        sendSuccess($projects, 'Projects retrieved successfully');
    }

    /**
     * Get single project with full details
     */
    public function show($id) {
        $user_id = requireAuth();

        $project = $this->projectModel->getById($id);

        if (!$project) {
            sendError('Project not found', 404);
        }

        // Check if user has access to this project
        // Users have access if they are:
        // 1. The project owner
        // 2. A team member
        // 3. The project is public (is_public = 1)
        if (!$this->projectModel->userHasAccess($id, $user_id)) {
            logMessage("Access denied for user $user_id to project $id (owner: {$project['owner_id']}, is_public: {$project['is_public']})", 'WARNING');
            sendError('You do not have permission to view this project. Only the owner, team members, or if the project is public can access it.', 403);
        }

        // Get team members
        $project['team'] = $this->projectModel->getTeamMembers($id);

        sendSuccess($project, 'Project retrieved successfully');
    }

    /**
     * Create new project
     */
    public function create() {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        $errors = validateRequired($data, ['name', 'description']);
        if (!empty($errors)) {
            sendError('Validation failed', 400, $errors);
        }

        // Sanitize input
        $data['name'] = sanitize($data['name']);
        $data['description'] = sanitize($data['description']);

        if (isset($data['category'])) {
            $data['category'] = sanitize($data['category']);
        }

        // Validate status
        if (isset($data['status']) && !in_array($data['status'], ['active', 'completed', 'archived'])) {
            sendError('Invalid status', 400);
        }

        $result = $this->projectModel->create($user_id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess([
            'project_id' => $result['project_id']
        ], $result['message'], 201);
    }

    /**
     * Update project
     */
    public function update($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Check if user is the owner
        if (!$this->projectModel->isOwner($id, $user_id)) {
            sendError('Only project owner can update the project', 403);
        }

        // Sanitize input
        if (isset($data['name'])) {
            $data['name'] = sanitize($data['name']);
        }
        if (isset($data['description'])) {
            $data['description'] = sanitize($data['description']);
        }
        if (isset($data['category'])) {
            $data['category'] = sanitize($data['category']);
        }

        // Validate status
        if (isset($data['status']) && !in_array($data['status'], ['active', 'completed', 'archived'])) {
            sendError('Invalid status', 400);
        }

        $result = $this->projectModel->update($id, $data);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Delete project
     */
    public function delete($id) {
        $user_id = requireAuth();

        // Check if user is the owner
        if (!$this->projectModel->isOwner($id, $user_id)) {
            sendError('Only project owner can delete the project', 403);
        }

        $result = $this->projectModel->delete($id);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Add team member to project
     */
    public function addMember($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        if (!isset($data['member_id'])) {
            sendError('member_id is required', 400);
        }

        // Check if user is the owner
        if (!$this->projectModel->isOwner($id, $user_id)) {
            sendError('Only project owner can add members', 403);
        }

        $result = $this->projectModel->addMember($id, $data['member_id'], $data['role'] ?? 'member');

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Remove team member from project
     */
    public function removeMember($id) {
        $user_id = requireAuth();
        $data = getJsonInput();

        // Validate required fields
        if (!isset($data['member_id'])) {
            sendError('member_id is required', 400);
        }

        // Check if user is the owner
        if (!$this->projectModel->isOwner($id, $user_id)) {
            sendError('Only project owner can remove members', 403);
        }

        $result = $this->projectModel->removeMember($id, $data['member_id']);

        if (!$result['success']) {
            sendError($result['message'], 400);
        }

        sendSuccess(null, $result['message']);
    }

    /**
     * Get project statistics for a user
     */
    public function statistics() {
        $user_id = requireAuth();

        $stats = $this->projectModel->getUserStatistics($user_id);

        if (!$stats) {
            sendError('Failed to retrieve statistics', 500);
        }

        sendSuccess($stats, 'Statistics retrieved successfully');
    }

    /**
     * Search for team members based on skills and interests
     */
    public function searchTeammates($id) {
        $user_id = requireAuth();

        // Check if user has access to this project
        if (!$this->projectModel->userHasAccess($id, $user_id)) {
            sendError('Access denied', 403);
        }

        $project = $this->projectModel->getById($id);

        if (!$project) {
            sendError('Project not found', 404);
        }

        // Get matching users based on project requirements
        $matches = $this->projectModel->findMatchingTeammates($id);

        sendSuccess($matches, 'Potential teammates retrieved successfully');
    }
}
