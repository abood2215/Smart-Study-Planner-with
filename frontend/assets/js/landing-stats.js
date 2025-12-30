// Landing Page Real-time Statistics
// This script calculates and displays actual platform statistics from localStorage

function calculatePlatformStats() {
    // Get all data from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');

    // Calculate statistics
    const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalStudyHours: 0,
        avgCompletion: 0
    };

    // Calculate total study hours
    if (studySessions.length > 0) {
        const totalMinutes = studySessions.reduce((sum, session) => {
            return sum + (session.actualDuration || 0);
        }, 0);
        stats.totalStudyHours = Math.round(totalMinutes / 60);
    }

    // Calculate average completion rate
    if (tasks.length > 0) {
        const totalCompletion = tasks.reduce((sum, task) => {
            return sum + (task.completionPercentage || 0);
        }, 0);
        stats.avgCompletion = Math.round(totalCompletion / tasks.length);
    }

    return stats;
}

function animateCounter(element, target, suffix = '', duration = 1500) {
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }
    }, 16);
}

function updateLandingStats() {
    const stats = calculatePlatformStats();

    // Get elements
    const totalUsersEl = document.getElementById('totalUsers');
    const totalCoursesEl = document.getElementById('totalCourses');
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const totalStudyHoursEl = document.getElementById('totalStudyHours');
    const avgCompletionEl = document.getElementById('avgCompletion');

    // Animate counters
    if (totalUsersEl) animateCounter(totalUsersEl, stats.totalUsers);
    if (totalCoursesEl) animateCounter(totalCoursesEl, stats.totalCourses);
    if (totalTasksEl) animateCounter(totalTasksEl, stats.totalTasks);
    if (completedTasksEl) animateCounter(completedTasksEl, stats.completedTasks);
    if (totalStudyHoursEl) animateCounter(totalStudyHoursEl, stats.totalStudyHours);
    if (avgCompletionEl) animateCounter(avgCompletionEl, stats.avgCompletion, '%');
}

// Initialize stats when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the landing page
    const statsSection = document.querySelector('.platform-stats');

    if (statsSection) {
        // Initial load
        updateLandingStats();

        // Create Intersection Observer for animation on scroll
        let animated = false;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    updateLandingStats();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);

        // Update stats every 30 seconds (in case of changes)
        setInterval(updateLandingStats, 30000);
    }
});

