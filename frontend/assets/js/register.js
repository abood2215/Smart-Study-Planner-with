// Ensure we run over HTTP and compute a BASE that respects the current port
(function() {
    var base = (location.protocol === 'file:')
        ? 'http://localhost/smart-study-planner'
        : (location.origin + '/smart-study-planner');
    window.APP_BASE = base;
    if (location.protocol === 'file:') {
        location.replace(base + '/register.html');
    }
})();

function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleBtn = passwordInput.nextElementSibling;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const studyHours = document.getElementById('studyHours').value;
        const preferredTime = document.getElementById('preferredTime').value;

        const errorMsg = document.getElementById('errorMsg');
        const successMsg = document.getElementById('successMsg');

        // Hide previous messages
        errorMsg.classList.remove('show');
        successMsg.classList.remove('show');

        // Validate passwords match
        if (password !== confirmPassword) {
            errorMsg.textContent = '❌ Passwords do not match.';
            errorMsg.classList.add('show');
            return;
        }

        try {
            const response = await fetch(window.APP_BASE + '/includes/api_auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    studyHours,
                    preferredTime
                })
            });

            const data = await response.json();
            // Ensure the user also exists in localStorage for dashboard storage.js
            try {
                if (data && data.success) {
                    const usersRaw = localStorage.getItem('users') || '[]';
                    const users = JSON.parse(usersRaw);
                    if (!users.some(u => u.email === email)) {
                        users.push({
                            id: Date.now(),
                            username: username,
                            email: email,
                            password: password,
                            studyHoursPerDay: parseInt(studyHours) || 2,
                            preferredTime: preferredTime || 'evening',
                            createdAt: new Date().toISOString()
                        });
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }
            } catch (e) {}

            if (data.success) {
                successMsg.textContent = '✅ ' + (data.message || 'Account created successfully! Redirecting to login...');
                successMsg.classList.add('show');
                setTimeout(() => {
                    window.location.href = window.APP_BASE + '/login.html';
                }, 2000);
            } else {
                errorMsg.textContent = '❌ ' + (data.message || 'Registration failed. Please try again.');
                errorMsg.classList.add('show');
            }
        } catch (error) {
            errorMsg.textContent = '❌ An error occurred. Please try again.';
            errorMsg.classList.add('show');
        }
    });

    // Add interactive emoji effects
    document.querySelectorAll('.emoji-item').forEach(emoji => {
        emoji.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = '';
            }, 10);
        });
    });
});
