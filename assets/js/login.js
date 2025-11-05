// Ensure we run over HTTP and compute a BASE that respects the current port
(function() {
    var base = (location.protocol === 'file:')
        ? 'http://localhost/smart-study-planner'
        : (location.origin + '/smart-study-planner');
    window.APP_BASE = base;
    if (location.protocol === 'file:') {
        location.replace(base + '/login.html');
    }
})();

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');

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
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        try {
            const response = await fetch(window.APP_BASE + '/includes/api_auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                try {
                    localStorage.setItem('currentUser', email);
                    // Ensure users store has this user so dashboard can resolve it
                    const usersRaw = localStorage.getItem('users') || '[]';
                    const users = JSON.parse(usersRaw);
                    if (!users.some(u => u.email === email)) {
                        users.push({
                            id: Date.now(),
                            username: email.split('@')[0] || 'User',
                            email: email,
                            password: '',
                            studyHoursPerDay: 2,
                            preferredTime: 'evening',
                            createdAt: new Date().toISOString()
                        });
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                } catch (e) {}
                window.location.href = window.APP_BASE + '/dashboard.html';
            } else {
                errorMsg.textContent = '❌ ' + (data.message || 'Login failed. Please try again.');
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
