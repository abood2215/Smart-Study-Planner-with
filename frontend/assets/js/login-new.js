// Login page - Connected to PHP Backend API

function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleBtn = passwordInput.parentElement.querySelector('.toggle-password');

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
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const errorMsg = document.getElementById('errorMsg');
        const successMsg = document.getElementById('successMsg');

        // Hide previous messages (safe check for null elements)
        if (errorMsg) errorMsg.classList.remove('show');
        if (successMsg) successMsg.classList.remove('show');

        try {
            // Call the new PHP Backend API
            const response = await fetch('http://localhost/Smart-Study-Planner-with/backend/api/auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Save token and user info
                localStorage.setItem('auth_token', data.data.token);
                localStorage.setItem('current_user', JSON.stringify(data.data.user));

                if (successMsg) {
                    successMsg.textContent = '✅ Login successful! Redirecting...';
                    successMsg.classList.add('show');
                }

                setTimeout(() => {
                    window.location.href = 'gateway.html';
                }, 1000);
            } else {
                if (errorMsg) {
                    errorMsg.textContent = '❌ ' + (data.message || 'Invalid email or password.');
                    errorMsg.classList.add('show');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (errorMsg) {
                errorMsg.textContent = '❌ An error occurred. Please make sure XAMPP is running.';
                errorMsg.classList.add('show');
            }
        }
    });
});
