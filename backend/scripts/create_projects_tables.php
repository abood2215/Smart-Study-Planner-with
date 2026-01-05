<?php
/**
 * Database Migration Script - Projects Tables
 *
 * This script creates the necessary tables for the Project Hub feature:
 * - projects: Main projects table
 * - project_team: Team members for each project
 * - Adds interests and skills columns to users table
 *
 * @package Smart Study Planner
 * @category Database Migration
 * @author Smart Study Planner Team
 * @version 1.0
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

try {
    $db = getDB();

    echo "Starting database migration for Projects feature...\n\n";

    // Create projects table
    echo "Creating 'projects' table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(100) DEFAULT 'general',
            status ENUM('active', 'completed', 'archived') DEFAULT 'active',
            required_skills TEXT,
            is_public TINYINT(1) DEFAULT 1,
            max_team_size INT DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_owner (owner_id),
            INDEX idx_status (status),
            INDEX idx_category (category),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ 'projects' table created successfully.\n\n";

    // Create project_team table
    echo "Creating 'project_team' table...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS project_team (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('owner', 'member') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_member (project_id, user_id),
            INDEX idx_project (project_id),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ 'project_team' table created successfully.\n\n";

    // Add interests and skills columns to users table if they don't exist
    echo "Adding 'interests' and 'skills' columns to 'users' table...\n";

    // Check if columns exist first
    $result = $db->query("SHOW COLUMNS FROM users LIKE 'interests'");
    if ($result->rowCount() == 0) {
        $db->exec("ALTER TABLE users ADD COLUMN interests TEXT AFTER email");
        echo "✓ Added 'interests' column.\n";
    } else {
        echo "- 'interests' column already exists.\n";
    }

    $result = $db->query("SHOW COLUMNS FROM users LIKE 'skills'");
    if ($result->rowCount() == 0) {
        $db->exec("ALTER TABLE users ADD COLUMN skills TEXT AFTER interests");
        echo "✓ Added 'skills' column.\n";
    } else {
        echo "- 'skills' column already exists.\n";
    }

    echo "\n";
    echo "================================================\n";
    echo "Migration completed successfully!\n";
    echo "================================================\n\n";

    echo "Summary:\n";
    echo "- projects table: Created\n";
    echo "- project_team table: Created\n";
    echo "- users.interests: Added/Verified\n";
    echo "- users.skills: Added/Verified\n\n";

    echo "You can now use the Project Hub features!\n";

} catch (PDOException $e) {
    echo "ERROR: Migration failed!\n";
    echo "Error message: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    exit(1);
}
