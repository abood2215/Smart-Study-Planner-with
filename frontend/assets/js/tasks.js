// ==================== Tasks Page Management ====================

document.addEventListener('DOMContentLoaded', function() {
    // Redirect to login if not authenticated
    if (!storage.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (typeof storage.seedDemoDataIfEmpty === 'function') {
        storage.seedDemoDataIfEmpty();
    }

    initTasksPage();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    // Add/Edit handlers
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
});

// ==================== Page Initialization ====================
function initTasksPage() {
    populateCoursesDropdowns();
    displayTasks();
}

// ==================== Populate Courses ====================
function populateCoursesDropdowns() {
    const courses = storage.getCourses();

    const addSelect = document.getElementById('taskCourse');
    const editSelect = document.getElementById('editTaskCourse');
    const filterSelect = document.getElementById('filterCourse');

    const coursesHTML = courses.map(course =>
        `<option value="${course.id}">${course.courseName}</option>`
    ).join('');

    addSelect.innerHTML = '<option value="">Select a course</option>' + coursesHTML;
    editSelect.innerHTML = '<option value="">Select a course</option>' + coursesHTML;
    filterSelect.innerHTML = '<option value="all">All courses</option>' + coursesHTML;
}

// ==================== Display Tasks ====================
function displayTasks() {
    const tasks = storage.getTasks();
    const courses = storage.getCourses();
    const grid = document.getElementById('tasksGrid');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Compute priorities if missing
    tasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course && !task.priorityScore) {
            task.priorityScore = aiEngine.calculatePriority(task, course);
            storage.updateTask(task.id, { priorityScore: task.priorityScore });
        }
    });

    // Sort by priority desc
    tasks.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    const tasksHTML = tasks.map(task => createTaskCard(task)).join('');
    grid.innerHTML = tasksHTML;
}

// ==================== Create Task Card ====================
function createTaskCard(task) {
    const deadline = new Date(task.deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    let deadlineText = '';
    let deadlineColor = '';

    if (daysLeft < 0) {
        deadlineText = `Overdue by ${Math.abs(daysLeft)} day(s)`;
        deadlineColor = '#ef4444';
    } else if (daysLeft === 0) {
        deadlineText = 'Due today';
        deadlineColor = '#ef4444';
    } else if (daysLeft === 1) {
        deadlineText = 'Due tomorrow';
        deadlineColor = '#f59e0b';
    } else if (daysLeft <= 3) {
        deadlineText = `Due in ${daysLeft} day(s)`;
        deadlineColor = '#f59e0b';
    } else if (daysLeft <= 7) {
        deadlineText = `Due in ${daysLeft} day(s)`;
        deadlineColor = '#06b6d4';
    } else {
        deadlineText = `Due in ${daysLeft} day(s)`;
        deadlineColor = '#10b981';
    }

    const statusMap = {
        'pending': { text: 'Pending', color: '#f59e0b', icon: '⏳' },
        'in_progress': { text: 'In Progress', color: '#06b6d4', icon: '🚧' },
        'completed': { text: 'Completed', color: '#10b981', icon: '✅' }
    };

    const status = statusMap[task.status] || statusMap['pending'];
    const priorityLevel = getPriorityLevel(task.priorityScore || 0);
    const priorityColors = {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#06b6d4'
    };

    return `
        <div class="feature-card" style="text-align: right;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                <div>
                    <span class="badge" style="background: ${status.color}20; color: ${status.color};">
                        ${status.icon} ${status.text}
                    </span>
                </div>
                <div>
                    <span class="badge" style="background: ${priorityColors[priorityLevel]}20; color: ${priorityColors[priorityLevel]};">
                        Priority: ${task.priorityScore || 'N/A'}
                    </span>
                </div>
            </div>

            <h3 style="margin-bottom: 12px; font-size: 1.25rem;">${task.taskName}</h3>

            <div style="margin-bottom: 16px;">
                <div style="margin-bottom: 8px;">
                    <strong>Course:</strong> ${task.courseName}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Deadline:</strong>
                    <span style="color: ${deadlineColor}; font-weight: bold;">
                        ${deadlineText}
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Estimated hours:</strong> ${task.estimatedHours}
                </div>
            </div>

            ${task.description ? `
                <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 0.9rem; color: #666;">
                    ${task.description}
                </div>
            ` : ''}

            <!-- Progress Bar -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.875rem;">
                    <span>Progress</span>
                    <span><strong>${task.completionPercentage || 0}%</strong></span>
                </div>
                <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden;">
                    <div style="width: ${task.completionPercentage || 0}%; height: 100%; background: linear-gradient(90deg, #2563eb, #6366f1); transition: width 0.3s;"></div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="editTask(${task.id})" class="btn btn-sm btn-primary">
                    Edit
                </button>
                <button onclick="deleteTask(${task.id})" class="btn btn-sm btn-danger">
                    Delete
                </button>
                ${task.status !== 'completed' ? `
                    <button onclick="markAsCompleted(${task.id})" class="btn btn-sm" style="background: #10b981; color: white;">
                        Mark as Completed
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ==================== Add Task ====================
function handleAddTask(e) {
    e.preventDefault();

    const taskData = {
        taskName: document.getElementById('taskName').value,
        courseId: document.getElementById('taskCourse').value,
        deadline: document.getElementById('taskDeadline').value,
        estimatedHours: document.getElementById('taskEstimatedHours').value,
        description: document.getElementById('taskDescription').value
    };

    const result = storage.addTask(taskData);

    if (result.success) {
        closeModal('addTaskModal');
        document.getElementById('addTaskForm').reset();
        displayTasks();
        showNotification('Task added successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== Edit Task ====================
function editTask(taskId) {
    const tasks = storage.getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }

    // Populate form
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskName').value = task.taskName;
    document.getElementById('editTaskCourse').value = task.courseId;
    document.getElementById('editTaskDeadline').value = task.deadline;
    document.getElementById('editTaskEstimatedHours').value = task.estimatedHours;
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskProgress').value = task.completionPercentage || 0;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('progressValue').textContent = (task.completionPercentage || 0) + '%';

    openModal('editTaskModal');
}

function handleEditTask(e) {
    e.preventDefault();

    const taskId = parseInt(document.getElementById('editTaskId').value);
    const courses = storage.getCourses();
    const courseId = parseInt(document.getElementById('editTaskCourse').value);
    const course = courses.find(c => c.id === courseId);

    const updates = {
        taskName: document.getElementById('editTaskName').value,
        courseId: courseId,
        courseName: course ? course.courseName : undefined,
        deadline: document.getElementById('editTaskDeadline').value,
        estimatedHours: parseFloat(document.getElementById('editTaskEstimatedHours').value) || 0,
        status: document.getElementById('editTaskStatus').value,
        completionPercentage: parseInt(document.getElementById('editTaskProgress').value) || 0,
        description: document.getElementById('editTaskDescription').value
    };

    const result = storage.updateTask(taskId, updates);

    if (result.success) {
        closeModal('editTaskModal');
        displayTasks();
        showNotification('Task updated successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== Delete Task ====================
function deleteTask(taskId) {
    if (!confirm('Delete this task? This action cannot be undone.')) {
        return;
    }
    const result = storage.deleteTask(taskId);
    if (result.success) {
        displayTasks();
        showNotification('Task deleted successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== Mark as Completed ====================
function markAsCompleted(taskId) {
    const result = storage.updateTask(taskId, {
        status: 'completed',
        completionPercentage: 100
    });

    if (result.success) {
        displayTasks();
        showNotification('Task marked as completed! ✅', 'success');
    }
}

// ==================== Filter Tasks ====================
function filterTasksDisplay() {
    const searchTerm = document.getElementById('searchTask').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const courseFilter = document.getElementById('filterCourse').value;

    let tasks = storage.getTasks();
    const courses = storage.getCourses();

    // Apply filters
    if (statusFilter !== 'all') {
        tasks = tasks.filter(t => t.status === statusFilter);
    }
    if (courseFilter !== 'all') {
        tasks = tasks.filter(t => t.courseId === parseInt(courseFilter));
    }
    if (searchTerm) {
        tasks = tasks.filter(t =>
            t.taskName.toLowerCase().includes(searchTerm) ||
            (t.description && t.description.toLowerCase().includes(searchTerm))
        );
    }

    const grid = document.getElementById('tasksGrid');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('h2').textContent = 'No matching tasks';
        emptyState.querySelector('p').textContent = 'Try adjusting filters or search terms.';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Recompute priority (lightweight)
    tasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course && !task.priorityScore) {
            task.priorityScore = aiEngine.calculatePriority(task, course);
        }
    });
    tasks.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    const tasksHTML = tasks.map(task => createTaskCard(task)).join('');
    grid.innerHTML = tasksHTML;
}

// ==================== Helper Functions ====================
function getPriorityLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

// ==================== Modal Management ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
};

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

