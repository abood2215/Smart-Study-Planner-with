// Courses Page with API Integration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api';

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

    initCoursesPage();
});

async function initCoursesPage() {
    // Load courses
    await loadCourses();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Setup add course form
    const addForm = document.getElementById('addCourseForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddCourse);
    }

    // Setup edit course form
    const editForm = document.getElementById('editCourseForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditCourse);
    }
}

async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE}/courses.php`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            displayCourses(data.data || []);
        } else {
            console.error('Failed to load courses:', data.message);
            document.getElementById('coursesContainer').innerHTML =
                '<p class="empty-state">⚠️ ' + (data.message || 'Failed to load courses') + '</p>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('coursesContainer').innerHTML =
            '<p class="empty-state">⚠️ Error loading courses. Please make sure XAMPP is running.</p>';
    }
}

function displayCourses(courses) {
    const container = document.getElementById('coursesContainer');

    if (courses.length === 0) {
        container.innerHTML = '<p class="empty-state">No courses yet. Add your first course!</p>';
        return;
    }

    container.innerHTML = courses.map(course => {
        const progress = parseFloat(course.progress || 0);
        const performance = parseFloat(course.performance || 0);
        const difficulty = getDifficultyBadge(course.difficulty);

        return `
            <div class="course-card">
                <div class="course-header">
                    <h3>${course.name}</h3>
                    <span class="badge badge-${course.difficulty}">${difficulty}</span>
                </div>
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-label">Progress</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="stat-value">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Performance</span>
                        <span class="stat-value">${performance.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Hours</span>
                        <span class="stat-value">${parseFloat(course.total_hours || 0).toFixed(1)}h</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Completed Hours</span>
                        <span class="stat-value">${parseFloat(course.completed_hours || 0).toFixed(1)}h</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn btn-sm btn-primary" onclick="editCourse(${course.id})">✏️ Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="updateProgress(${course.id})">📊 Update Progress</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function getDifficultyBadge(difficulty) {
    const difficultyMap = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard'
    };
    return difficultyMap[difficulty] || difficulty;
}

async function handleAddCourse(e) {
    e.preventDefault();

    const difficultyLevel = document.getElementById('difficultyLevel').value;
    const difficultyMap = {
        '1': 'easy',
        '2': 'easy',
        '3': 'medium',
        '4': 'hard',
        '5': 'hard'
    };

    const courseData = {
        name: document.getElementById('courseName').value,
        difficulty: difficultyMap[difficultyLevel] || 'medium',
        total_hours: parseFloat(document.getElementById('estimatedHoursPerWeek').value) * 15, // Estimate for semester
        performance: parseFloat(document.getElementById('currentGrade').value) || 0
    };

    try {
        const response = await fetch(`${API_BASE}/courses.php`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(courseData)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Course added successfully!');
            closeModal('addCourseModal');
            document.getElementById('addCourseForm').reset();
            await loadCourses();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to add course'));
        }
    } catch (error) {
        console.error('Error adding course:', error);
        alert('❌ Error adding course. Please try again.');
    }
}

async function editCourse(courseId) {
    try {
        const response = await fetch(`${API_BASE}/courses.php?id=${courseId}`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success && data.data) {
            const course = data.data;

            // Fill form
            document.getElementById('editCourseId').value = course.id;
            document.getElementById('editCourseName').value = course.name;

            // Map difficulty to level
            const difficultyToLevel = {
                'easy': '2',
                'medium': '3',
                'hard': '4'
            };
            document.getElementById('editDifficultyLevel').value = difficultyToLevel[course.difficulty] || '3';

            document.getElementById('editEstimatedHoursPerWeek').value = Math.round(parseFloat(course.total_hours || 0) / 15);
            document.getElementById('editCurrentGrade').value = course.performance || 0;

            openModal('editCourseModal');
        } else {
            alert('❌ Failed to load course details');
        }
    } catch (error) {
        console.error('Error loading course:', error);
        alert('❌ Error loading course details');
    }
}

async function handleEditCourse(e) {
    e.preventDefault();

    const courseId = document.getElementById('editCourseId').value;
    const difficultyLevel = document.getElementById('editDifficultyLevel').value;
    const difficultyMap = {
        '1': 'easy',
        '2': 'easy',
        '3': 'medium',
        '4': 'hard',
        '5': 'hard'
    };

    const courseData = {
        name: document.getElementById('editCourseName').value,
        difficulty: difficultyMap[difficultyLevel] || 'medium',
        total_hours: parseFloat(document.getElementById('editEstimatedHoursPerWeek').value) * 15,
        performance: parseFloat(document.getElementById('editCurrentGrade').value) || 0
    };

    try {
        const response = await fetch(`${API_BASE}/courses.php?id=${courseId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(courseData)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Course updated successfully!');
            closeModal('editCourseModal');
            await loadCourses();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to update course'));
        }
    } catch (error) {
        console.error('Error updating course:', error);
        alert('❌ Error updating course. Please try again.');
    }
}

async function updateProgress(courseId) {
    const newProgress = prompt('Enter new progress (0-100):');
    if (newProgress === null) return;

    const progress = parseFloat(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
        alert('❌ Please enter a valid number between 0 and 100');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/courses.php?id=${courseId}&action=progress`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ progress })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Progress updated successfully!');
            await loadCourses();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to update progress'));
        }
    } catch (error) {
        console.error('Error updating progress:', error);
        alert('❌ Error updating progress. Please try again.');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all related tasks.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/courses.php?id=${courseId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Course deleted successfully!');
            await loadCourses();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to delete course'));
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('❌ Error deleting course. Please try again.');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
