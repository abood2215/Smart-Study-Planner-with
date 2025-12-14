<?php
/**
 * AI-Powered Schedule Generation API
 * Generates smart study schedule based on user's courses, tasks, and preferences
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

$user_id = requireAuth();

try {
    $pdo = getDB();

    // Get user preferences
    $stmt = $pdo->prepare("SELECT * FROM user_preferences WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $preferences = $stmt->fetch();

    if (!$preferences) {
        // Create default preferences
        $stmt = $pdo->prepare("
            INSERT INTO user_preferences (user_id, preferred_study_time, daily_study_hours)
            VALUES (?, 'evening', 6.0)
        ");
        $stmt->execute([$user_id]);

        $stmt = $pdo->prepare("SELECT * FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $preferences = $stmt->fetch();
    }

    // Get courses
    $stmt = $pdo->prepare("
        SELECT id, name, difficulty, total_hours, completed_hours, progress
        FROM courses
        WHERE user_id = ?
        ORDER BY progress ASC
    ");
    $stmt->execute([$user_id]);
    $courses = $stmt->fetchAll();

    // Get pending tasks
    $stmt = $pdo->prepare("
        SELECT t.*, c.name as course_name, c.difficulty as course_difficulty
        FROM tasks t
        LEFT JOIN courses c ON t.course_id = c.id
        WHERE t.user_id = ? AND t.status != 'completed'
        ORDER BY t.deadline ASC, t.difficulty DESC
    ");
    $stmt->execute([$user_id]);
    $tasks = $stmt->fetchAll();

    if (empty($tasks) && empty($courses)) {
        sendSuccess([
            'schedule' => [],
            'message' => 'No courses or tasks found. Add some to generate a schedule.'
        ], 'No data to generate schedule');
        exit;
    }

    // Use AI to generate smart schedule
    $schedule = generateSmartSchedule($courses, $tasks, $preferences, $user_id, $pdo);

    sendSuccess([
        'schedule' => $schedule,
        'preferences' => $preferences,
        'stats' => [
            'total_courses' => count($courses),
            'total_tasks' => count($tasks),
            'sessions_created' => count($schedule)
        ]
    ], 'Schedule generated successfully');

} catch (Exception $e) {
    error_log("Schedule Generation Error: " . $e->getMessage());
    sendError('Failed to generate schedule: ' . $e->getMessage(), 500);
}

function generateSmartSchedule($courses, $tasks, $preferences, $user_id, $pdo) {
    $dailyHours = floatval($preferences['daily_study_hours'] ?? 6.0);
    $preferredTime = $preferences['preferred_study_time'] ?? 'evening';
    $sessionDuration = intval($preferences['session_duration_minutes'] ?? 90);
    $breakDuration = intval($preferences['break_duration_minutes'] ?? 15);

    // Define time slots based on preference
    $timeSlots = getTimeSlots($preferredTime);

    // Clear old schedules (older than today)
    $stmt = $pdo->prepare("DELETE FROM schedules WHERE user_id = ? AND scheduled_date < CURDATE()");
    $stmt->execute([$user_id]);

    $schedule = [];
    $today = new DateTime();

    // Generate schedule for next 7 days
    for ($day = 0; $day < 7; $day++) {
        $currentDate = clone $today;
        $currentDate->modify("+$day days");

        // Skip if it's Friday (weekend in some countries) - make it flexible
        $dayOfWeek = $currentDate->format('N'); // 1=Monday, 7=Sunday

        $dailySessions = floor($dailyHours * 60 / ($sessionDuration + $breakDuration));

        // Prioritize tasks by deadline and difficulty
        $dayTasks = prioritizeTasks($tasks, $courses, $currentDate);

        $sessionCount = 0;
        foreach ($timeSlots as $slot) {
            if ($sessionCount >= $dailySessions) break;
            if (empty($dayTasks)) break;

            $task = array_shift($dayTasks);

            $startTime = $slot['start'];
            $endTime = $slot['end'];

            // Create schedule entry
            $scheduleEntry = [
                'date' => $currentDate->format('Y-m-d'),
                'day_name' => $currentDate->format('l'),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'duration_minutes' => $sessionDuration,
                'task_id' => $task['id'],
                'task_title' => $task['title'],
                'course_name' => $task['course_name'] ?? 'General Study',
                'difficulty' => $task['difficulty'] ?? 'medium',
                'status' => 'scheduled'
            ];

            // Save to database
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO schedules
                    (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
                    ON DUPLICATE KEY UPDATE
                    start_time = VALUES(start_time),
                    end_time = VALUES(end_time)
                ");
                $stmt->execute([
                    $user_id,
                    $task['id'],
                    $currentDate->format('Y-m-d'),
                    $startTime,
                    $endTime,
                    $sessionDuration
                ]);

                $scheduleEntry['id'] = $pdo->lastInsertId();
            } catch (Exception $e) {
                error_log("Error saving schedule: " . $e->getMessage());
            }

            $schedule[] = $scheduleEntry;
            $sessionCount++;
        }
    }

    return $schedule;
}

function getTimeSlots($preferredTime) {
    $slots = [];

    switch ($preferredTime) {
        case 'morning':
            $slots = [
                ['start' => '07:00:00', 'end' => '08:30:00'],
                ['start' => '08:45:00', 'end' => '10:15:00'],
                ['start' => '10:30:00', 'end' => '12:00:00'],
            ];
            break;
        case 'afternoon':
            $slots = [
                ['start' => '13:00:00', 'end' => '14:30:00'],
                ['start' => '14:45:00', 'end' => '16:15:00'],
                ['start' => '16:30:00', 'end' => '18:00:00'],
            ];
            break;
        case 'evening':
        default:
            $slots = [
                ['start' => '18:00:00', 'end' => '19:30:00'],
                ['start' => '19:45:00', 'end' => '21:15:00'],
                ['start' => '21:30:00', 'end' => '23:00:00'],
            ];
            break;
    }

    return $slots;
}

function prioritizeTasks($tasks, $courses, $currentDate) {
    $prioritized = [];

    foreach ($tasks as $task) {
        $deadline = new DateTime($task['deadline']);
        $daysUntilDeadline = $currentDate->diff($deadline)->days;

        // Calculate priority score
        $urgencyScore = max(0, 10 - $daysUntilDeadline);
        $difficultyScore = ['easy' => 1, 'medium' => 2, 'hard' => 3][$task['difficulty'] ?? 'medium'];

        $task['priority_score'] = ($urgencyScore * 3) + ($difficultyScore * 2);
        $prioritized[] = $task;
    }

    // Sort by priority score (descending)
    usort($prioritized, function($a, $b) {
        return $b['priority_score'] - $a['priority_score'];
    });

    return $prioritized;
}
