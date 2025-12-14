<?php
/**
 * Database Export/Backup Script
 * Exports the entire smart_study_planner2 database to SQL file
 * Usage: php scripts/export_database.php [filename]
 */

require_once __DIR__ . '/../includes/db.php';

class DatabaseExporter {
    private $db;
    private $database_name = 'smart_study_planner2';
    private $tables = ['users', 'courses', 'tasks', 'schedules', 'user_preferences', 'progress_logs'];

    public function __construct() {
        $this->db = getDB();
    }

    /**
     * Export entire database to SQL file
     */
    public function export($filename = null) {
        if (!$filename) {
            $filename = 'smart_study_planner2_' . date('Y-m-d_H-i-s') . '.sql';
        }

        $filepath = __DIR__ . '/../database/' . $filename;

        // Start output buffer
        ob_start();

        // Write SQL header
        echo "-- Smart Study Planner Database Export\n";
        echo "-- Exported: " . date('Y-m-d H:i:s') . "\n";
        echo "-- Database: {$this->database_name}\n";
        echo "\n";
        echo "-- Create database\n";
        echo "CREATE DATABASE IF NOT EXISTS {$this->database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
        echo "USE {$this->database_name};\n";
        echo "\n";

        // Export each table
        foreach ($this->tables as $table) {
            try {
                echo $this->exportTable($table);
                echo "\n";
            } catch (Exception $e) {
                echo "-- Error exporting table {$table}: " . $e->getMessage() . "\n";
            }
        }

        echo "-- Export completed: " . date('Y-m-d H:i:s') . "\n";

        // Get content
        $content = ob_get_clean();

        // Write to file
        if (file_put_contents($filepath, $content)) {
            echo "✓ Database exported successfully to: {$filepath}\n";
            echo "  File size: " . number_format(filesize($filepath) / 1024, 2) . " KB\n";
            return true;
        } else {
            echo "✗ Failed to write export file\n";
            return false;
        }
    }

    /**
     * Export a single table structure and data
     */
    private function exportTable($table) {
        $output = "-- ============================================\n";
        $output .= "-- Table: {$table}\n";
        $output .= "-- ============================================\n\n";

        // Get CREATE TABLE statement
        $stmt = $this->db->query("SHOW CREATE TABLE {$table}");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            $output .= "DROP TABLE IF EXISTS {$table};\n";
            $output .= $result['Create Table'] . ";\n\n";
        }

        // Get data
        $stmt = $this->db->query("SELECT * FROM {$table}");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $columns = array_keys($rows[0]);
            $column_list = implode('`, `', $columns);

            $output .= "INSERT INTO {$table} (`{$column_list}`) VALUES\n";

            $values = [];
            foreach ($rows as $row) {
                $value_list = [];
                foreach ($row as $value) {
                    if ($value === null) {
                        $value_list[] = 'NULL';
                    } else {
                        $value_list[] = $this->db->quote($value);
                    }
                }
                $values[] = "(" . implode(", ", $value_list) . ")";
            }

            $output .= implode(",\n", $values) . ";\n";
        }

        return $output;
    }

    /**
     * List all backups in database folder
     */
    public function listBackups() {
        $db_dir = __DIR__ . '/../database/';
        $files = glob($db_dir . 'smart_study_planner2_*.sql');

        if (empty($files)) {
            echo "No backups found.\n";
            return;
        }

        echo "Available backups:\n";
        echo str_repeat("-", 70) . "\n";

        foreach ($files as $file) {
            $filename = basename($file);
            $size = number_format(filesize($file) / 1024, 2);
            $date = date('Y-m-d H:i:s', filemtime($file));
            echo sprintf("  %-50s %8s KB  %s\n", $filename, $size, $date);
        }

        echo str_repeat("-", 70) . "\n";
    }
}

// Main execution
if (php_sapi_name() !== 'cli') {
    echo "This script must be run from the command line.\n";
    exit(1);
}

$opts = getopt('', ['backup', 'list', 'file:']);
$exporter = new DatabaseExporter();

if (isset($opts['list'])) {
    $exporter->listBackups();
} else {
    $filename = $opts['file'] ?? null;
    $exporter->export($filename);
}

?>
