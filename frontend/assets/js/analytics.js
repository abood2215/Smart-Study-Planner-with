// if (!storage.isLoggedIn()) {
//     window.location.href = 'login.html';
// }

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('logoutBtn').addEventListener('click', function () {
        storage.logoutUser();
    });

    const tasks = storage.getTasks();
    const courses = storage.getCourses();
    const stats = storage.getStats();

    document.getElementById('totalCourses').textContent = stats.totalCourses;
    document.getElementById('totalTasks').textContent = stats.totalTasks;
    document.getElementById('completionRate').textContent = stats.completionRate + '%';
    document.getElementById('avgStudyTime').textContent = (stats.totalCourses > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.estimatedHoursPerWeek, 0) / courses.length)
        : 0);

    document.getElementById('pendingTasks').textContent = stats.pendingTasks;
    document.getElementById('inProgressTasks').textContent = stats.inProgressTasks;
    document.getElementById('completedTasks').textContent = stats.completedTasks;

    tasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course && !task.priority) {
            task.priority = aiEngine.calculatePriority(task, course);
        }
    });

    const highPriority = tasks.filter(t => (t.priority || 0) >= 70).length;
    const mediumPriority = tasks.filter(t => (t.priority || 0) >= 40 && (t.priority || 0) < 70).length;
    const lowPriority = tasks.filter(t => (t.priority || 0) < 40).length;

    document.getElementById('highPriority').textContent = highPriority;
    document.getElementById('mediumPriority').textContent = mediumPriority;
    document.getElementById('lowPriority').textContent = lowPriority;

    const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const remainingHours = tasks
        .filter(t => t.status !== 'completed')
        .reduce((sum, t) => sum + (t.estimatedHours || 0) * (1 - (t.completionPercentage || 0) / 100), 0);

    document.getElementById('plannedHours').textContent = totalPlannedHours.toFixed(1);
    document.getElementById('remainingHours').textContent = remainingHours.toFixed(1);
    document.getElementById('avgHoursPerTask').textContent = tasks.length > 0
        ? (totalPlannedHours / tasks.length).toFixed(1)
        : 0;

    new Chart(document.getElementById('tasksStatusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Completed'],
            datasets: [{
                data: [stats.pendingTasks, stats.inProgressTasks, stats.completedTasks],
                backgroundColor: ['#f59e0b', '#06b6d4', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    new Chart(document.getElementById('priorityChart'), {
        type: 'pie',
        data: {
            labels: ['High Priority', 'Medium Priority', 'Low Priority'],
            datasets: [{
                data: [highPriority, mediumPriority, lowPriority],
                backgroundColor: ['#ef4444', '#f59e0b', '#06b6d4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    const courseLabels = courses.map(c => c.courseName);
    const courseHours = courses.map(c => {
        const courseTasks = tasks.filter(t => t.courseId === c.id);
        return courseTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    });

    new Chart(document.getElementById('coursesTimeChart'), {
        type: 'bar',
        data: {
            labels: courseLabels,
            datasets: [{
                label: 'Hours',
                data: courseHours,
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const monthData = new Array(30).fill(0);
    tasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const day = deadline.getDate();
        if (day >= 1 && day <= 30) {
            monthData[day - 1]++;
        }
    });

    new Chart(document.getElementById('monthlyTasksChart'), {
        type: 'line',
        data: {
            labels: Array.from({ length: 30 }, (_, i) => i + 1),
            datasets: [{
                label: 'Task Count',
                data: monthData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });

    const tbody = document.getElementById('coursesBreakdown');
    const coursesData = courses.map(course => {
        const courseTasks = tasks.filter(t => t.courseId === course.id);
        const completedTasks = courseTasks.filter(t => t.status === 'completed').length;
        const completionRate = courseTasks.length > 0
            ? ((completedTasks / courseTasks.length) * 100).toFixed(0)
            : 0;
        const totalHours = courseTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

        return {
            name: course.courseName,
            difficulty: '⭐'.repeat(course.difficultyLevel),
            totalTasks: courseTasks.length,
            completedTasks,
            completionRate,
            hours: totalHours.toFixed(1)
        };
    });

    tbody.innerHTML = coursesData.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.difficulty}</td>
            <td>${c.totalTasks}</td>
            <td>${c.completedTasks}</td>
            <td>
                <span class="badge" style="background: ${c.completionRate >= 80 ? '#d1fae5' : c.completionRate >= 50 ? '#fef3c7' : '#fee2e2'};
                                             color: ${c.completionRate >= 80 ? '#065f46' : c.completionRate >= 50 ? '#92400e' : '#991b1b'};">
                    ${c.completionRate}%
                </span>
            </td>
            <td>${c.hours} hours</td>
        </tr>
    `).join('');
});
