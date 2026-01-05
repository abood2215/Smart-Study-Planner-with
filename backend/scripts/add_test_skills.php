<?php
/**
 * Add Skills to Test Users
 * This script adds skills and interests to test users for better matching
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

$db = getDB();

echo "Adding skills to test users...\n\n";

$updates = [
    [
        'id' => 2,
        'name' => 'Sarah Johnson',
        'skills' => 'HTML, CSS, JavaScript, React, Node.js, Web Development',
        'interests' => 'Web Development, Frontend, UI/UX Design'
    ],
    [
        'id' => 3,
        'name' => 'Michael Chen',
        'skills' => 'Python, Django, Flask, Database Design, Backend Development',
        'interests' => 'Backend Development, Data Science, API Development'
    ],
    [
        'id' => 4,
        'name' => 'Emma Davis',
        'skills' => 'JavaScript, TypeScript, Vue.js, Angular, Web Development',
        'interests' => 'Web Development, Full Stack, Mobile Apps'
    ],
    [
        'id' => 5,
        'name' => 'Admin User',
        'skills' => 'Project Management, Agile, Scrum, Leadership, Web Development',
        'interests' => 'Project Management, Team Building, Web Development'
    ]
];

foreach ($updates as $user) {
    $stmt = $db->prepare("
        UPDATE users
        SET skills = :skills, interests = :interests
        WHERE id = :id
    ");

    $stmt->execute([
        'id' => $user['id'],
        'skills' => $user['skills'],
        'interests' => $user['interests']
    ]);

    echo "✓ Updated {$user['name']}\n";
    echo "  Skills: {$user['skills']}\n";
    echo "  Interests: {$user['interests']}\n\n";
}

echo "==============================================\n";
echo "All test users updated successfully!\n";
echo "==============================================\n";
