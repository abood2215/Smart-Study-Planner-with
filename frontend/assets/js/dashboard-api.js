// Dashboard with API Integration
// Global chart instances
let timeDistributionChartInstance = null;
let weeklyProgressChartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

    if (!token || !currentUser.id) {
        window.location.href = 'login.html';
        return;
    }

    initDashboard();
});

// API Configuration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api';

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    };
}

async function initDashboard() {
    const user = JSON.parse(localStorage.getItem('current_user'));

    // Set username
    document.getElementById('userName').textContent = user.name || 'Student';

    // Set current date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);

    // Load data from API
    await loadDashboardData();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Setup add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }
}

async function loadDashboardData() {
    try {
        // Fetch courses, tasks, and schedule in parallel
        const [coursesResponse, tasksResponse, scheduleResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/schedule.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();
        const scheduleData = await scheduleResponse.json();

        if (coursesData.success && tasksData.success) {
            const courses = coursesData.data || [];
            const tasks = tasksData.data || [];
            const schedules = scheduleData.success ? (scheduleData.data || []) : [];

            // Update stats
            updateStats(courses, tasks);

            // Update tasks display
            updateUrgentTasks(tasks, courses);
            updateAllTasksTable(tasks, courses);

            // Update today's schedule
            updateTodaySchedule(schedules);

            // Populate courses dropdown
            populateCoursesDropdown(courses);

            // Update charts (with error handling)
            try {
                updateCharts(courses, tasks);
            } catch (chartError) {
                console.error('Error updating charts:', chartError);
                // Charts error shouldn't break the whole page
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Only show full error if it's a network error
        if (error.message && error.message.includes('fetch')) {
            document.querySelector('.main-content').innerHTML =
                '<div class="error-message">⚠️ Error loading data. Please make sure XAMPP is running.</div>';
        }
    }
}

function updateStats(courses, tasks) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}

function updateTodaySchedule(schedules) {
    const todayScheduleDiv = document.getElementById('todaySchedule');
    const today = new Date().toISOString().split('T')[0];

    const todaySchedules = schedules
        .filter(s => s.scheduled_date === today)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (todaySchedules.length === 0) {
        todayScheduleDiv.innerHTML = '<p class="empty-state">No scheduled tasks for today. Click "🔄 Refresh" to generate a schedule!</p>';
        return;
    }

    todayScheduleDiv.innerHTML = todaySchedules.map(schedule => `
        <div class="task-item ${schedule.status === 'completed' ? 'completed' : ''}">
            <div class="task-header">
                <div>
                    <div class="task-title">${schedule.task_title || 'Study Session'}</div>
                    <div class="task-meta">
                        <span>📚 ${schedule.course_name || 'General'}</span>
                        <span>⏰ ${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}</span>
                        <span>⏱️ ${schedule.duration_minutes}min</span>
                    </div>
                </div>
                <span class="badge badge-${schedule.difficulty || 'medium'}">${schedule.difficulty || 'medium'}</span>
            </div>
        </div>
    `).join('');
}

function updateUrgentTasks(tasks, courses) {
    const urgentTasksDiv = document.getElementById('urgentTasks');

    // Get tasks with upcoming deadlines (within 7 days)
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const urgentTasks = tasks
        .filter(t => t.status !== 'completed')
        .filter(t => {
            const deadline = new Date(t.deadline);
            return deadline >= today && deadline <= weekFromNow;
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    if (urgentTasks.length === 0) {
        urgentTasksDiv.innerHTML = '<p class="empty-state">No urgent tasks</p>';
        return;
    }

    urgentTasksDiv.innerHTML = urgentTasks.map(task => {
        const course = courses.find(c => c.id === task.course_id);
        const courseName = course ? course.name : 'No Course';
        const deadline = new Date(task.deadline);
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        return `
            <div class="task-item ${task.difficulty}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span>📚 ${courseName}</span>
                            <span>📅 ${daysUntil} days left</span>
                            <span>⏱️ ${task.estimated_hours}h</span>
                        </div>
                    </div>
                    <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateAllTasksTable(tasks, courses) {
    const tbody = document.getElementById('tasksTableBody');

    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tasks yet</td></tr>';
        return;
    }

    tbody.innerHTML = tasks.map(task => {
        const course = courses.find(c => c.id === task.course_id);
        const courseName = course ? course.name : 'No Course';
        const deadline = new Date(task.deadline).toLocaleDateString();

        return `
            <tr>
                <td>${task.title}</td>
                <td>${courseName}</td>
                <td>${deadline}</td>
                <td><span class="badge badge-${task.difficulty}">${task.difficulty}</span></td>
                <td><span class="badge badge-${task.status}">${task.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewTask(${task.id})" title="View">👁️</button>
                    <button class="btn-icon" onclick="editTask(${task.id})" title="Edit">✏️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function populateCoursesDropdown(courses) {
    const select = document.getElementById('taskCourse');
    if (!select) return;

    select.innerHTML = '<option value="">Select Course</option>' +
        courses.map(course => `<option value="${course.id}">${course.name}</option>`).join('');
}

function updateCharts(courses, tasks) {
    // Destroy existing charts if they exist
    if (timeDistributionChartInstance) {
        timeDistributionChartInstance.destroy();
        timeDistributionChartInstance = null;
    }
    if (weeklyProgressChartInstance) {
        weeklyProgressChartInstance.destroy();
        weeklyProgressChartInstance = null;
    }

    // Time Distribution Chart
    const timeCtx = document.getElementById('timeDistributionChart');
    if (timeCtx) {
        const courseLabels = courses.slice(0, 5).map(c => c.name);
        const courseHours = courses.slice(0, 5).map(c => parseFloat(c.total_hours || 0));

        timeDistributionChartInstance = new Chart(timeCtx, {
            type: 'doughnut',
            data: {
                labels: courseLabels,
                datasets: [{
                    data: courseHours,
                    backgroundColor: ['#4A90E2', '#50C878', '#FFB347', '#E25D5D', '#9B59B6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'bottom' }
                }
            }
        });
    }

    // Weekly Progress Chart
    const progressCtx = document.getElementById('weeklyProgressChart');
    if (progressCtx) {
        const courseLabels = courses.slice(0, 5).map(c => c.name);
        const progressData = courses.slice(0, 5).map(c => parseFloat(c.progress || 0));

        weeklyProgressChartInstance = new Chart(progressCtx, {
            type: 'bar',
            data: {
                labels: courseLabels,
                datasets: [{
                    label: 'Progress %',
                    data: progressData,
                    backgroundColor: '#4A90E2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

async function handleAddTask(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskName').value,
        course_id: document.getElementById('taskCourse').value,
        deadline: document.getElementById('taskDeadline').value,
        estimated_hours: document.getElementById('taskEstimatedHours').value,
        description: document.getElementById('taskDescription').value || '',
        difficulty: 'medium',
        status: 'pending'
    };

    try {
        const response = await fetch(`${API_BASE}/tasks.php`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Task added successfully!');
            closeModal('addTaskModal');
            document.getElementById('addTaskForm').reset();
            loadDashboardData(); // Reload data
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to add task'));
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('❌ Error adding task. Please try again.');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function filterTasks() {
    const filter = document.getElementById('taskFilter').value;
    loadDashboardData(); // Reload with filter
}

function viewTask(id) {
    window.location.href = `task-details.html?id=${id}`;
}

function editTask(id) {
    window.location.href = `edit-task.html?id=${id}`;
}

// Generate AI-powered schedule
async function generateSchedule() {
    if (!confirm('🤖 Generate a new AI-powered study schedule?\n\nThis will create an optimized schedule based on your tasks, preferences, and deadlines.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/generate-schedule.php`, {
            method: 'POST',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.data.stats || {};

            alert(`✅ Schedule Generated Successfully!\n\n` +
                  `📚 Courses: ${stats.total_courses || 0}\n` +
                  `📝 Tasks: ${stats.total_tasks || 0}\n` +
                  `📅 Study Sessions: ${stats.sessions_created || 0}\n\n` +
                  `Your schedule is optimized based on:\n` +
                  `- Task deadlines\n` +
                  `- Course difficulty\n` +
                  `- Your study preferences\n\n` +
                  `View your schedule in the Weekly Schedule page.`);

            // Reload dashboard data
            await loadDashboardData();
        } else {
            alert('⚠️ ' + (data.message || 'No schedule generated. Please add some tasks first!'));
        }
    } catch (error) {
        console.error('Error generating schedule:', error);
        alert('❌ Error generating schedule. Please make sure XAMPP is running and try again.');
    }
}
