// Analytics Page with API Integration and AI Insights
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api';

let allCourses = [];
let allTasks = [];
let charts = {};

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    initAnalyticsPage();
});

async function initAnalyticsPage() {
    await loadData();

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

async function loadData() {
    try {
        const [coursesResponse, tasksResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();

        if (coursesData.success && tasksData.success) {
            allCourses = coursesData.data || [];
            allTasks = tasksData.data || [];

            updateStatistics();
            createCharts();
            displayCourseBreakdown();
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updateStatistics() {
    // Total courses and tasks
    document.getElementById('totalCourses').textContent = allCourses.length;
    document.getElementById('totalTasks').textContent = allTasks.length;

    // Task status counts
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;

    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('completedTasks').textContent = completed;

    // Completion rate
    const completionRate = allTasks.length > 0
        ? ((completed / allTasks.length) * 100).toFixed(1)
        : 0;
    document.getElementById('completionRate').textContent = completionRate + '%';

    // Priority distribution (based on difficulty)
    const high = allTasks.filter(t => t.difficulty === 'hard').length;
    const medium = allTasks.filter(t => t.difficulty === 'medium').length;
    const low = allTasks.filter(t => t.difficulty === 'easy').length;

    document.getElementById('highPriority').textContent = high;
    document.getElementById('mediumPriority').textContent = medium;
    document.getElementById('lowPriority').textContent = low;

    // Time statistics
    const totalHours = allTasks.reduce((sum, t) => sum + parseFloat(t.estimated_hours || 0), 0);
    const completedHours = allTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.estimated_hours || 0), 0);
    const remainingHours = totalHours - completedHours;
    const avgHours = allTasks.length > 0 ? (totalHours / allTasks.length).toFixed(1) : 0;

    document.getElementById('plannedHours').textContent = totalHours.toFixed(1);
    document.getElementById('remainingHours').textContent = remainingHours.toFixed(1);
    document.getElementById('avgHoursPerTask').textContent = avgHours;
    document.getElementById('avgStudyTime').textContent = avgHours + 'h';
}

function createCharts() {
    // Destroy existing charts if they exist
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
        }
    });
    charts = {};

    // Task Status Chart
    const statusCtx = document.getElementById('tasksStatusChart');
    if (statusCtx) {
        const statusData = {
            pending: allTasks.filter(t => t.status === 'pending').length,
            in_progress: allTasks.filter(t => t.status === 'in_progress').length,
            completed: allTasks.filter(t => t.status === 'completed').length
        };

        charts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Completed'],
                datasets: [{
                    data: [statusData.pending, statusData.in_progress, statusData.completed],
                    backgroundColor: ['#FFB347', '#4A90E2', '#50C878']
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
    }

    // Priority Chart
    const priorityCtx = document.getElementById('priorityChart');
    if (priorityCtx) {
        const priorityData = {
            high: allTasks.filter(t => t.difficulty === 'hard').length,
            medium: allTasks.filter(t => t.difficulty === 'medium').length,
            low: allTasks.filter(t => t.difficulty === 'easy').length
        };

        charts.priority = new Chart(priorityCtx, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Tasks by Priority',
                    data: [priorityData.high, priorityData.medium, priorityData.low],
                    backgroundColor: ['#E25D5D', '#FFB347', '#50C878']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Course Time Distribution Chart
    const courseTimeCtx = document.getElementById('coursesTimeChart');
    if (courseTimeCtx) {
        const courseLabels = allCourses.slice(0, 6).map(c => c.name);
        const courseHours = allCourses.slice(0, 6).map(c => parseFloat(c.total_hours || 0));

        charts.courseTime = new Chart(courseTimeCtx, {
            type: 'bar',
            data: {
                labels: courseLabels,
                datasets: [{
                    label: 'Total Hours',
                    data: courseHours,
                    backgroundColor: '#4A90E2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Monthly Tasks Chart
    const monthlyCtx = document.getElementById('monthlyTasksChart');
    if (monthlyCtx) {
        const tasksByMonth = getTasksByMonth();

        charts.monthly = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: tasksByMonth.labels,
                datasets: [{
                    label: 'Tasks',
                    data: tasksByMonth.data,
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function getTasksByMonth() {
    const monthCounts = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    allTasks.forEach(task => {
        const date = new Date(task.deadline);
        const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });

    const sorted = Object.entries(monthCounts).sort((a, b) => {
        return new Date(a[0]) - new Date(b[0]);
    });

    return {
        labels: sorted.map(([month]) => month),
        data: sorted.map(([, count]) => count)
    };
}

function displayCourseBreakdown() {
    const tbody = document.getElementById('coursesBreakdown');
    if (!tbody) return;

    if (allCourses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No courses yet</td></tr>';
        return;
    }

    tbody.innerHTML = allCourses.map(course => {
        const courseTasks = allTasks.filter(t => t.course_id === course.id);
        const taskCount = courseTasks.length;
        const completedCount = courseTasks.filter(t => t.status === 'completed').length;
        const completionRate = taskCount > 0
            ? ((completedCount / taskCount) * 100).toFixed(1)
            : 0;
        const totalTime = courseTasks.reduce((sum, t) => sum + parseFloat(t.estimated_hours || 0), 0);

        return `
            <tr>
                <td><strong>${course.name}</strong></td>
                <td><span class="badge badge-${course.difficulty}">${course.difficulty}</span></td>
                <td>${taskCount}</td>
                <td>${completedCount}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="progress-bar" style="flex: 1;">
                            <div class="progress-fill" style="width: ${completionRate}%"></div>
                        </div>
                        <span>${completionRate}%</span>
                    </div>
                </td>
                <td>${totalTime.toFixed(1)}h</td>
            </tr>
        `;
    }).join('');
}

async function loadAIInsights() {
    const container = document.getElementById('aiInsightsContainer');
    const button = document.getElementById('refreshInsights');

    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #dc2626;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
                <p>Please login first to view AI insights.</p>
            </div>
        `;
        return;
    }

    // Show loading state
    button.disabled = true;
    button.textContent = '⏳ Generating...';
    container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
            <p>Analyzing your study data with AI...</p>
            <p style="color: #666; font-size: 0.9em; margin-top: 8px;">This may take 5-10 seconds</p>
        </div>
    `;

    try {
        console.log('Fetching AI insights from:', `${API_BASE}/ai-insights.php`);
        console.log('Using token:', token.substring(0, 20) + '...');

        const response = await fetch(`${API_BASE}/ai-insights.php`, {
            method: 'GET',
            headers: getHeaders()
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            displayAIInsights(data.data.insights);
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #dc2626;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                    <p><strong>Failed to generate insights</strong></p>
                    <p style="margin-top: 8px; color: #666;">${data.message || 'Unknown error'}</p>
                    ${data.message === 'Unauthorized' ? '<p style="margin-top: 8px; font-size: 0.9em;">Try logging out and logging in again.</p>' : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading AI insights:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #dc2626;">
                <div style="font-size: 48px; margin-bottom: 12px;">❌</div>
                <p><strong>Error loading AI insights</strong></p>
                <p style="margin-top: 8px; color: #666;">${error.message}</p>
                <p style="margin-top: 12px; font-size: 0.9em;">
                    Please check:<br>
                    - XAMPP is running<br>
                    - You are logged in<br>
                    - Check browser console for details
                </p>
            </div>
        `;
    } finally {
        button.disabled = false;
        button.textContent = '🔄 Refresh Insights';
    }
}

function displayAIInsights(insights) {
    const container = document.getElementById('aiInsightsContainer');

    // Convert markdown-style text to HTML
    let html = insights
        .replace(/^# (.+)$/gm, '<h2 style="color: #1e40af; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
        .replace(/^## (.+)$/gm, '<h3 style="color: #2563eb; margin-top: 20px; margin-bottom: 10px;">$1</h3>')
        .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 8px;">$2</li>')
        .replace(/\n\n/g, '</p><p style="margin-bottom: 12px; line-height: 1.6;">')
        .replace(/\n/g, '<br>');

    container.innerHTML = `
        <div style="color: #1e293b; line-height: 1.6;">
            <p style="margin-bottom: 12px; line-height: 1.6;">${html}</p>
        </div>
    `;
}
