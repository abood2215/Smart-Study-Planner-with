// ==================== Dashboard Management ====================

document.addEventListener('DOMContentLoaded', function() {
    // Redirect to login if not authenticated
    if (!storage.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initDashboard();
});

// ==================== Dashboard Initialization ====================
function initDashboard() {
    const user = storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set username
    document.getElementById('userName').textContent = user.username;

    // Set current date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    try {
        document.getElementById('currentDate').textContent = new Intl.DateTimeFormat('en-US-u-ca-gregory', options).format(today);
    } catch (e) {
        document.getElementById('currentDate').textContent = new Intl.DateTimeFormat('en-GB', options).format(today);
    }

    // Seed demo data so the dashboard is not empty
    if (typeof storage.seedDemoDataIfEmpty === 'function') {
        storage.seedDemoDataIfEmpty();
    }

    // Initial renders
    updateStats();
    updateTodaySchedule();
    updateUrgentTasks();
    updateAllTasksTable();
    populateCoursesDropdown();
    initCharts();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    // Add task (quick add on dashboard)
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) addTaskForm.addEventListener('submit', handleAddTask);
}

// ==================== Stats Update ====================
function updateStats() {
    const stats = storage.getStats();
    document.getElementById('totalCourses').textContent = stats.totalCourses;
    document.getElementById('totalTasks').textContent = stats.totalTasks;
    document.getElementById('completedTasks').textContent = stats.completedTasks;
    document.getElementById('pendingTasks').textContent = stats.pendingTasks;
}

// ==================== Today's Schedule ====================
function updateTodaySchedule() {
    const user = storage.getCurrentUser();
    const tasks = storage.getTasks();
    const courses = storage.getCourses();

    const activeTasks = tasks.filter(t => t.status !== 'completed');
    if (activeTasks.length === 0) {
        document.getElementById('todaySchedule').innerHTML =
            '<p class="empty-state">No active tasks. Add tasks to see your schedule.</p>';
        return;
    }

    // Compute priorities
    activeTasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course) task.priorityScore = aiEngine.calculatePriority(task, course);
    });

    const schedule = aiEngine.allocateStudyTime(activeTasks, courses, user.studyHoursPerDay);
    const detailedSchedule = aiEngine.createDailySchedule(schedule, user.preferredTime, user.studyHoursPerDay);

    const scheduleHTML = detailedSchedule.map(item => `
        <div class="schedule-item">
            <div class="task-header">
                <div>
                    <div class="task-title">${item.taskName}</div>
                    <div class="task-meta">
                        <span>Course: ${item.courseName}</span>
                        <span>Time: ${item.timeSlot.start} - ${item.timeSlot.end}</span>
                        <span>Session: ${item.sessionHours} hours</span>
                    </div>
                </div>
                <span class="badge badge-${getPriorityLevel(item.priority)}">Priority ${item.priority}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('todaySchedule').innerHTML = scheduleHTML ||
        '<p class="empty-state">No schedule available.</p>';
}

// ==================== Urgent Tasks ====================
function updateUrgentTasks() {
    const tasks = storage.getTasks();
    const courses = storage.getCourses();

    // Due within 3 days
    const urgentTasks = tasks.filter(t => {
        if (t.status === 'completed') return false;
        const deadline = new Date(t.deadline);
        const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 3;
    });

    urgentTasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course) task.priorityScore = aiEngine.calculatePriority(task, course);
    });
    urgentTasks.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    if (urgentTasks.length === 0) {
        document.getElementById('urgentTasks').innerHTML =
            '<p class="empty-state">No urgent tasks due soon.</p>';
        return;
    }

    const tasksHTML = urgentTasks.map(task => {
        const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const dueText = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} day(s)`;
        return `
            <div class="task-item priority-${getPriorityLevel(task.priorityScore)}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.taskName}</div>
                        <div class="task-meta">
                            <span>Course: ${task.courseName}</span>
                            <span>Due: ${dueText}</span>
                        </div>
                    </div>
                    <span class="badge badge-${getPriorityLevel(task.priorityScore)}">${task.priorityScore || 'N/A'}</span>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('urgentTasks').innerHTML = tasksHTML;
}

// ==================== All Tasks Table ====================
function updateAllTasksTable() {
    const tasks = storage.getTasks();
    const tbody = document.getElementById('tasksTableBody');

    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tasks available</td></tr>';
        return;
    }

    const tasksHTML = tasks.map(task => {
        const deadline = new Date(task.deadline);
        const isOverdue = deadline < new Date() && task.status !== 'completed';
        return `
            <tr class="${isOverdue ? 'overdue' : ''}">
                <td>${task.taskName}</td>
                <td>${task.courseName}</td>
                <td>${formatDate(task.deadline)} ${isOverdue ? '(overdue)' : ''}</td>
                <td>
                    <span class="badge badge-${getPriorityLevel(task.priorityScore)}">${task.priorityScore || 'N/A'}</span>
                </td>
                <td>
                    <span class="badge badge-${task.status}">${getStatusText(task.status)}</span>
                </td>
                <td>
                    <button onclick="editTask(${task.id})" class="btn btn-sm">Edit</button>
                    <button onclick="deleteTask(${task.id})" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = tasksHTML;
}

// ==================== Charts ====================
function initCharts() {
    initTimeDistributionChart();
    initWeeklyProgressChart();
}

function initTimeDistributionChart() {
    if (typeof Chart === 'undefined') return;
    const tasks = storage.getTasks();
    const courses = storage.getCourses();
    const timeByCourse = {};
    courses.forEach(course => {
        const courseTasks = tasks.filter(t => t.courseId === course.id && t.status !== 'completed');
        const totalHours = courseTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        timeByCourse[course.courseName] = totalHours;
    });
    const labels = Object.keys(timeByCourse);
    const data = Object.values(timeByCourse);
    const ctx = document.getElementById('timeChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#06b6d4'] }] },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

function initWeeklyProgressChart() {
    if (typeof Chart === 'undefined') return;
    const tasks = storage.getTasks();
    const labels = tasks.map(t => t.taskName).slice(0, 7);
    const data = tasks.map(t => t.completionPercentage || 0).slice(0, 7);
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Completion %', data, borderColor: '#6366f1', backgroundColor: '#a5b4fc33' }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
    });
}

// ==================== Quick Add Task ====================
function populateCoursesDropdown() {
    const courses = storage.getCourses();
    const select = document.getElementById('quickTaskCourse');
    if (!select) return;
    select.innerHTML = courses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
}

function handleAddTask(e) {
    e.preventDefault();
    const taskData = {
        taskName: document.getElementById('taskName').value,
        courseId: document.getElementById('quickTaskCourse').value,
        deadline: document.getElementById('taskDeadline').value,
        estimatedHours: document.getElementById('taskEstimatedHours').value,
        description: document.getElementById('taskDescription').value
    };
    const result = storage.addTask(taskData);
    if (result.success) {
        closeModal('addTaskModal');
        document.getElementById('addTaskForm').reset();
        updateStats();
        updateTodaySchedule();
        updateUrgentTasks();
        updateAllTasksTable();
        initCharts();
    } else {
        alert(result.message);
    }
}

// ==================== Task Actions ====================
function editTask(taskId) {
    alert('Edit task from the Tasks page.');
}

function deleteTask(taskId) {
    if (confirm('Delete this task? This action cannot be undone.')) {
        storage.deleteTask(taskId);
        updateStats();
        updateTodaySchedule();
        updateUrgentTasks();
        updateAllTasksTable();
        initCharts();
    }
}

function filterTasks() {
    const filter = document.getElementById('taskFilter').value;
    storage.getTasks(filter);
    updateAllTasksTable();
}

// ==================== Modal Management ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
};

// ==================== Helper Functions ====================
function getPriorityLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}
