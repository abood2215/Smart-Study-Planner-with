<?php
/**
 * List users script
 * Usage: php scripts/list_users.php
 */
require_once __DIR__ . '/../includes/db.php';

try {
    $db = getDB();
    $stmt = $db->query("SELECT id, name, email, created_at FROM users ORDER BY id ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($users)) {
        echo "No users found in the database.\n";
        exit(0);
    }

    // Print header
    echo sprintf("%-4s %-25s %-35s %s\n", 'ID', 'Name', 'Email', 'Created At');
    echo str_repeat('-', 80) . "\n";

    foreach ($users as $u) {
        echo sprintf("%-4s %-25s %-35s %s\n", $u['id'], $u['name'], $u['email'], $u['created_at']);
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
