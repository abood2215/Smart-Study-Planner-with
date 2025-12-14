<?php
/**
 * Reset user password script
 * Usage:
 *  php scripts/reset_password.php --email=you@example.com --password=NewPass123
 * If --password is omitted the script will prompt for it interactively.
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

$opts = getopt('', ['email:', 'password::']);

if (!isset($opts['email']) || !filter_var($opts['email'], FILTER_VALIDATE_EMAIL)) {
    echo "Usage: php scripts/reset_password.php --email=you@example.com [--password=NewPass123]\n";
    exit(1);
}

$email = $opts['email'];
$password = $opts['password'] ?? null;

if (empty($password)) {
    // Prompt for password without echo (Windows fallback)
    echo "Enter new password: ";
    if (preg_match('/^win/i', PHP_OS)) {
        $password = trim(stream_get_line(STDIN, 1024, PHP_EOL));
    } else {
        system('stty -echo');
        $password = trim(stream_get_line(STDIN, 1024, PHP_EOL));
        system('stty echo');
        echo PHP_EOL;
    }
}

if (strlen($password) < 6) {
    echo "Password must be at least 6 characters.\n";
    exit(1);
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, name FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo "No user found with email {$email}\n";
        exit(1);
    }

    $hashed = hashPassword($password);
    $upd = $db->prepare("UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id");
    $upd->execute(['password' => $hashed, 'id' => $user['id']]);

    echo "Password updated for {$user['email']} (user id: {$user['id']}).\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
