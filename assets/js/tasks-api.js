// Tasks Page with API Integration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api';

let allTasks = [];
let allCourses = [];

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    initTasksPage();
});

async function initTasksPage() {
    // Load data
    await loadData();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Setup add task form
    const addForm = document.getElementById('addTaskForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddTask);
    }

    // Setup edit task form
    const editForm = document.getElementById('editTaskForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTask);
    }
}

async function loadData() {
    try {
        // Fetch courses and tasks in parallel
        const [coursesResponse, tasksResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();

        if (coursesData.success && tasksData.success) {
            allCourses = coursesData.data || [];
            allTasks = tasksData.data || [];

            // Populate dropdowns
            populateCoursesDropdown();
            populateCourseFilter();

            // Display tasks
            filterTasksDisplay();
        } else {
            console.error('Failed to load data');
            showError('Failed to load data. Please refresh the page.');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Error loading data. Please make sure XAMPP is running.');
    }
}

function populateCoursesDropdown() {
    const selects = ['taskCourse', 'editTaskCourse'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Course</option>' +
                allCourses.map(course => `<option value="${course.id}">${course.name}</option>`).join('');
        }
    });
}

function populateCourseFilter() {
    const filterSelect = document.getElementById('filterCourse');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">All Courses</option>' +
            allCourses.map(course => `<option value="${course.id}">${course.name}</option>`).join('');
    }
}

function filterTasksDisplay() {
    const searchTerm = document.getElementById('searchTask')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const courseFilter = document.getElementById('filterCourse')?.value || 'all';

    let filtered = allTasks.filter(task => {
        // Search filter
        const matchesSearch = !searchTerm ||
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm));

        // Status filter
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

        // Course filter
        const matchesCourse = courseFilter === 'all' || task.course_id == courseFilter;

        return matchesSearch && matchesStatus && matchesCourse;
    });

    displayTasks(filtered);
}

function displayTasks(tasks) {
    const grid = document.getElementById('tasksGrid');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = tasks.map(task => {
        const course = allCourses.find(c => c.id === task.course_id);
        const courseName = course ? course.name : 'No Course';
        const deadline = new Date(task.deadline);
        const today = new Date();
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        let deadlineClass = '';
        let deadlineText = '';
        if (daysUntil < 0) {
            deadlineClass = 'overdue';
            deadlineText = `${Math.abs(daysUntil)} days overdue`;
        } else if (daysUntil === 0) {
            deadlineClass = 'today';
            deadlineText = 'Due today';
        } else if (daysUntil <= 3) {
            deadlineClass = 'urgent';
            deadlineText = `${daysUntil} days left`;
        } else {
            deadlineText = `${daysUntil} days left`;
        }

        const statusBadge = getStatusBadge(task.status);
        const progress = parseFloat(task.progress || 0);

        return `
            <div class="task-card ${task.status}">
                <div class="task-header">
                    <h3>${task.title}</h3>
                    <span class="badge badge-${task.status}">${statusBadge}</span>
                </div>
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-label">📚 Course:</span>
                        <span>${courseName}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">📅 Deadline:</span>
                        <span class="${deadlineClass}">${deadline.toLocaleDateString()} (${deadlineText})</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">⏱️ Estimated:</span>
                        <span>${task.estimated_hours}h</span>
                    </div>
                    ${task.difficulty ? `
                    <div class="meta-item">
                        <span class="meta-label">💪 Difficulty:</span>
                        <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
                    </div>
                    ` : ''}
                </div>
                ${task.description ? `
                <div class="task-description">
                    <p>${task.description}</p>
                </div>
                ` : ''}
                <div class="task-progress">
                    <div class="progress-header">
                        <span>Progress</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary" onclick="editTask(${task.id})">✏️ Edit</button>
                    <button class="btn btn-sm btn-success" onclick="markComplete(${task.id})"
                            ${task.status === 'completed' ? 'disabled' : ''}>
                        ✅ Complete
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'overdue': 'Overdue'
    };
    return statusMap[status] || status;
}

async function handleAddTask(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskName').value,
        course_id: document.getElementById('taskCourse').value,
        deadline: document.getElementById('taskDeadline').value,
        estimated_hours: parseFloat(document.getElementById('taskEstimatedHours').value),
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
            await loadData();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to add task'));
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('❌ Error adding task. Please try again.');
    }
}

async function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
        alert('Task not found');
        return;
    }

    // Fill form
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskName').value = task.title;
    document.getElementById('editTaskCourse').value = task.course_id;
    document.getElementById('editTaskDeadline').value = task.deadline;
    document.getElementById('editTaskEstimatedHours').value = task.estimated_hours;
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskProgress').value = task.progress || 0;
    document.getElementById('progressValue').textContent = (task.progress || 0) + '%';
    document.getElementById('editTaskDescription').value = task.description || '';

    openModal('editTaskModal');
}

async function handleEditTask(e) {
    e.preventDefault();

    const taskId = document.getElementById('editTaskId').value;

    const taskData = {
        title: document.getElementById('editTaskName').value,
        course_id: document.getElementById('editTaskCourse').value,
        deadline: document.getElementById('editTaskDeadline').value,
        estimated_hours: parseFloat(document.getElementById('editTaskEstimatedHours').value),
        status: document.getElementById('editTaskStatus').value,
        progress: parseFloat(document.getElementById('editTaskProgress').value),
        description: document.getElementById('editTaskDescription').value || ''
    };

    try {
        const response = await fetch(`${API_BASE}/tasks.php?id=${taskId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Task updated successfully!');
            closeModal('editTaskModal');
            await loadData();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to update task'));
        }
    } catch (error) {
        console.error('Error updating task:', error);
        alert('❌ Error updating task. Please try again.');
    }
}

async function markComplete(taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks.php?id=${taskId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                status: 'completed',
                progress: 100
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Task marked as completed!');
            await loadData();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to mark task as complete'));
        }
    } catch (error) {
        console.error('Error marking task complete:', error);
        alert('❌ Error marking task complete. Please try again.');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks.php?id=${taskId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Task deleted successfully!');
            await loadData();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to delete task'));
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Error deleting task. Please try again.');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showError(message) {
    const grid = document.getElementById('tasksGrid');
    grid.innerHTML = `<p class="empty-state">⚠️ ${message}</p>`;
}
