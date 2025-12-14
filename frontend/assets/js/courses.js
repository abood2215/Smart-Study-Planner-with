// ==================== Courses Management ====================

document.addEventListener('DOMContentLoaded', function() {
    // Redirect to login if not authenticated
    if (!storage.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initCoursesPage();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    // Add / Edit handlers
    document.getElementById('addCourseForm').addEventListener('submit', handleAddCourse);
    document.getElementById('editCourseForm').addEventListener('submit', handleEditCourse);
});

// ==================== Page Initialization ====================
function initCoursesPage() {
    if (typeof storage.seedDemoDataIfEmpty === 'function') {
        storage.seedDemoDataIfEmpty();
    }
    displayCourses();
}

// ==================== Display Courses ====================
function displayCourses() {
    const courses = storage.getCourses();
    const container = document.getElementById('coursesContainer');

    if (courses.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📚</div>
                <h2 style="color: #666; margin-bottom: 10px;">No courses yet</h2>
                <p style="color: #999;">Add your first course to get started.</p>
            </div>
        `;
        return;
    }

    const coursesHTML = courses.map(course => {
        const difficultyStars = '★'.repeat(course.difficultyLevel);
        const gradeColor = course.currentGrade >= 90 ? '#28a745' :
                          course.currentGrade >= 80 ? '#17a2b8' :
                          course.currentGrade >= 70 ? '#ffc107' : '#dc3545';

        return `
            <div class="feature-card course-card">
                <div class="feature-icon">📘</div>
                <h3 style="margin-bottom: 15px;">${course.courseName}</h3>

                <div style="text-align: right; margin-bottom: 15px;">
                    <div style="margin-bottom: 8px;">
                        <strong>Difficulty:</strong> ${difficultyStars}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Estimated hours/week:</strong> ${course.estimatedHoursPerWeek}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Current grade:</strong>
                        <span style="color: ${gradeColor}; font-weight: bold;">
                            ${course.currentGrade || 'N/A'}
                        </span>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="editCourse(${course.id})"
                            class="btn btn-sm btn-primary">
                        Edit
                    </button>
                    <button onclick="deleteCourse(${course.id})"
                            class="btn btn-sm btn-danger">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = coursesHTML;
}

// ==================== Add Course ====================
function handleAddCourse(e) {
    e.preventDefault();

    const courseData = {
        courseName: document.getElementById('courseName').value,
        difficultyLevel: document.getElementById('difficultyLevel').value,
        estimatedHoursPerWeek: document.getElementById('estimatedHoursPerWeek').value,
        currentGrade: document.getElementById('currentGrade').value || 0
    };

    const result = storage.addCourse(courseData);

    if (result.success) {
        closeModal('addCourseModal');
        document.getElementById('addCourseForm').reset();
        displayCourses();
        showNotification('Course added successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== Edit Course ====================
function editCourse(courseId) {
    const courses = storage.getCourses();
    const course = courses.find(c => c.id === courseId);

    if (!course) {
        showNotification('Course not found', 'error');
        return;
    }

    // Populate form
    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseName').value = course.courseName;
    document.getElementById('editDifficultyLevel').value = course.difficultyLevel;
    document.getElementById('editEstimatedHoursPerWeek').value = course.estimatedHoursPerWeek;
    document.getElementById('editCurrentGrade').value = course.currentGrade || 0;

    openModal('editCourseModal');
}

function handleEditCourse(e) {
    e.preventDefault();

    const courseId = parseInt(document.getElementById('editCourseId').value);
    const updates = {
        courseName: document.getElementById('editCourseName').value,
        difficultyLevel: parseInt(document.getElementById('editDifficultyLevel').value),
        estimatedHoursPerWeek: parseInt(document.getElementById('editEstimatedHoursPerWeek').value),
        currentGrade: parseFloat(document.getElementById('editCurrentGrade').value) || 0
    };

    const result = storage.updateCourse(courseId, updates);

    if (result.success) {
        closeModal('editCourseModal');
        displayCourses();
        showNotification('Course updated successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

// ==================== Delete Course ====================
function deleteCourse(courseId) {
    if (!confirm('Delete this course? This will also remove its tasks. This action cannot be undone.')) {
        return;
    }

    const result = storage.deleteCourse(courseId);

    if (result.success) {
        displayCourses();
        showNotification('Course deleted successfully', 'success');
    } else {
        showNotification(result.message, 'error');
    }
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

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
};

// Simple notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

