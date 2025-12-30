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
const API_BASE = 'http://localhost/Smart-Study-Planner-with/backend/api';

// Pagination state
let currentPage = 1;
const tasksPerPage = 10;
let allTasksData = [];
let allCoursesData = [];
let currentFilter = 'all';

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
                // Charts error shouldn't break the whole page
            }
        }
    } catch (error) {
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get tomorrow as well (in case of timezone differences)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Show schedules for today OR the earliest available date
    // This handles timezone differences between client and server
    const todaySchedules = schedules
        .filter(s => {
            const scheduleDate = String(s.scheduled_date).split(' ')[0];
            // Match today, tomorrow, or if no matches, get the earliest future schedule
            const match = scheduleDate === todayStr || scheduleDate === tomorrowStr;
            return match;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // If no schedules for today/tomorrow, show the earliest upcoming schedules
    let displaySchedules = todaySchedules;
    let headerText = "Your Schedule Today";

    if (todaySchedules.length === 0 && schedules.length > 0) {
        // Get the earliest date from all schedules
        const earliestDate = schedules[0].scheduled_date.split(' ')[0];
        displaySchedules = schedules.filter(s => s.scheduled_date.split(' ')[0] === earliestDate).slice(0, 5);

        // Calculate days difference
        const earliest = new Date(earliestDate);
        const diffDays = Math.ceil((earliest - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            headerText = "Your Schedule Tomorrow";
        } else if (diffDays > 1) {
            headerText = `Upcoming Schedule (in ${diffDays} days)`;
        }
    }

    if (displaySchedules.length === 0) {
        todayScheduleDiv.innerHTML = '<p class="empty-state">📅 No schedule yet.<br>Click "🤖 Generate Schedule" button above to let AI create your optimized study plan!</p>';
        return;
    }

    // Update the section header if needed to show "Tomorrow" or "Upcoming"
    const sectionHeaders = document.querySelectorAll('.dashboard-section h2');
    sectionHeaders.forEach(header => {
        if (header.textContent.includes('Your Schedule Today') ||
            header.textContent.includes('Tomorrow') ||
            header.textContent.includes('Upcoming')) {
            header.textContent = headerText;
        }
    });

    todayScheduleDiv.innerHTML = displaySchedules.map(schedule => `
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

    // Get tasks with upcoming deadlines (within next 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const futureLimit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const urgentTasks = tasks
        .filter(t => t.status !== 'completed')
        .filter(t => {
            const deadline = new Date(t.deadline);
            deadline.setHours(0, 0, 0, 0); // Reset time for fair comparison
            const isUrgent = deadline >= today && deadline <= futureLimit;
            return isUrgent;
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    if (urgentTasks.length === 0) {
        urgentTasksDiv.innerHTML = '<p class="empty-state">No urgent tasks in the next 30 days</p>';
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
    // Store data globally for pagination and filtering
    allTasksData = tasks;
    allCoursesData = courses;

    // Render the current page
    renderTasksPage();
}

function renderTasksPage() {
    const tbody = document.getElementById('tasksTableBody');
    const paginationDiv = document.getElementById('tasksPagination');

    // Apply filter
    let filteredTasks = allTasksData;
    if (currentFilter !== 'all') {
        filteredTasks = allTasksData.filter(t => t.status === currentFilter);
    }

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tasks found</td></tr>';
        paginationDiv.style.display = 'none';
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    // Render table rows
    tbody.innerHTML = paginatedTasks.map(task => {
        const course = allCoursesData.find(c => c.id === task.course_id);
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

    // Show/update pagination
    if (filteredTasks.length > tasksPerPage) {
        paginationDiv.style.display = 'flex';
        updatePagination(filteredTasks.length, totalPages);
    } else {
        paginationDiv.style.display = 'none';
    }
}

function updatePagination(totalTasks, totalPages) {
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    // Update info text
    const startIndex = (currentPage - 1) * tasksPerPage + 1;
    const endIndex = Math.min(currentPage * tasksPerPage, totalTasks);
    paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalTasks} tasks`;

    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    // Generate page numbers
    let pages = '';
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
            pages += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
    } else {
        // Show first page
        pages += `<button class="page-number ${currentPage === 1 ? 'active' : ''}" onclick="goToPage(1)">1</button>`;

        // Show ellipsis or pages around current
        if (currentPage > 3) {
            pages += '<span class="page-ellipsis">...</span>';
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }

        // Show ellipsis or last page
        if (currentPage < totalPages - 2) {
            pages += '<span class="page-ellipsis">...</span>';
        }

        pages += `<button class="page-number ${currentPage === totalPages ? 'active' : ''}" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    pageNumbers.innerHTML = pages;
}

function goToPage(page) {
    currentPage = page;
    renderTasksPage();
}

function changePage(direction) {
    currentPage += direction;
    renderTasksPage();
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
    currentFilter = document.getElementById('taskFilter').value;
    currentPage = 1; // Reset to first page when filtering
    renderTasksPage(); // Re-render with new filter
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

    // Show loading state
    const todayScheduleDiv = document.getElementById('todaySchedule');
    todayScheduleDiv.innerHTML = '<p class="empty-state">🤖 AI is generating your personalized schedule...</p>';

    try {
        const response = await fetch(`${API_BASE}/generate-schedule.php`, {
            method: 'POST',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.data.stats || {};

            // Show success message
            alert(`✅ Schedule Generated Successfully!\n\n` +
                  `📚 Courses: ${stats.total_courses || 0}\n` +
                  `📝 Tasks: ${stats.total_tasks || 0}\n` +
                  `📅 Study Sessions: ${stats.sessions_created || 0}\n\n` +
                  `Your AI-optimized schedule is based on:\n` +
                  `- Task deadlines and urgency\n` +
                  `- Course difficulty levels\n` +
                  `- Your study time preferences\n` +
                  `- Optimal learning patterns\n\n` +
                  `Check "Your Schedule Today" section below!`);

            // Reload dashboard data to show the new schedule
            await loadDashboardData();
        } else {
            todayScheduleDiv.innerHTML = '<p class="empty-state">⚠️ ' + (data.message || 'No schedule generated. Please add some tasks first!') + '</p>';
        }
    } catch (error) {
        todayScheduleDiv.innerHTML = '<p class="empty-state">❌ Error generating schedule. Please make sure XAMPP is running and try again.</p>';
        alert('❌ Error generating schedule. Please make sure XAMPP is running and try again.');
    }
}
