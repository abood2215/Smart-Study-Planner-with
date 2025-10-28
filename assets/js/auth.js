document.addEventListener('DOMContentLoaded', function() {
    if (typeof storage === 'undefined') {
        const script = document.createElement('script');
        script.src = 'assets/js/storage.js';
        document.head.appendChild(script);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleRegister(e) {
    e.preventDefault();

    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const studyHours = document.getElementById('studyHours').value;
    const preferredTime = document.getElementById('preferredTime').value;

    if (username.length < 3) {
        showError(errorMsg, 'Username must be at least 3 characters');
        return;
    }

    if (!isValidEmail(email)) {
        showError(errorMsg, 'Invalid email address');
        return;
    }

    if (password.length < 6) {
        showError(errorMsg, 'Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorMsg, 'Passwords do not match');
        return;
    }

    if (!studyHours) {
        showError(errorMsg, 'Please select your daily study hours');
        return;
    }

    if (!preferredTime) {
        showError(errorMsg, 'Please select your preferred study time');
        return;
    }

    const userData = {
        username,
        email,
        password,
        studyHours,
        preferredTime
    };

    const result = storage.registerUser(userData);

    if (result.success) {
        showSuccess(successMsg, result.message + ' - Redirecting...');

        setTimeout(() => {
            addSampleData(result.user.id);
            localStorage.setItem('currentUser', email);
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showError(errorMsg, result.message);
    }
}

function handleLogin(e) {
    e.preventDefault();

    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError(errorMsg, 'Please enter email and password');
        return;
    }

    const result = storage.loginUser(email, password);

    if (result.success) {
        window.location.href = 'dashboard.html';
    } else {
        showError(errorMsg, result.message);
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function addSampleData(userId) {
    const sampleCourses = [
        {
            userId: userId,
            id: Date.now(),
            courseName: 'Web Development',
            difficultyLevel: 3,
            estimatedHoursPerWeek: 6,
            currentGrade: 85,
            createdAt: new Date().toISOString()
        },
        {
            userId: userId,
            id: Date.now() + 1,
            courseName: 'Database Systems',
            difficultyLevel: 4,
            estimatedHoursPerWeek: 8,
            currentGrade: 78,
            createdAt: new Date().toISOString()
        },
        {
            userId: userId,
            id: Date.now() + 2,
            courseName: 'Artificial Intelligence',
            difficultyLevel: 5,
            estimatedHoursPerWeek: 10,
            currentGrade: 90,
            createdAt: new Date().toISOString()
        }
    ];

    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    courses.push(...sampleCourses);
    localStorage.setItem('courses', JSON.stringify(courses));

    const today = new Date();
    const sampleTasks = [
        {
            id: Date.now() + 100,
            courseId: sampleCourses[0].id,
            courseName: 'Web Development',
            taskName: 'HTML/CSS Project',
            description: 'Build a simple website using HTML and CSS',
            deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedHours: 4,
            priorityScore: 0,
            status: 'in_progress',
            completionPercentage: 50,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 101,
            courseId: sampleCourses[1].id,
            courseName: 'Database Systems',
            taskName: 'SQL Homework',
            description: 'Solve SQL exercises and complex queries',
            deadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedHours: 3,
            priorityScore: 0,
            status: 'pending',
            completionPercentage: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 102,
            courseId: sampleCourses[2].id,
            courseName: 'Artificial Intelligence',
            taskName: 'Research on Machine Learning',
            description: 'Write a comprehensive report on ML algorithms',
            deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedHours: 8,
            priorityScore: 0,
            status: 'pending',
            completionPercentage: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 103,
            courseId: sampleCourses[0].id,
            courseName: 'Web Development',
            taskName: 'Study JavaScript',
            description: 'Review JS fundamentals and practical exercises',
            deadline: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedHours: 2,
            priorityScore: 0,
            status: 'pending',
            completionPercentage: 0,
            createdAt: new Date().toISOString()
        }
    ];

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(...sampleTasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
