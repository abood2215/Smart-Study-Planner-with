/**
 * Profile Page JavaScript
 * Handles user profile management and AI-powered CV analysis
 */

// Global state
let currentUser = null;

/**
 * Load user profile
 */
async function loadProfile() {
    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/auth.php?action=profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            // Extract user from the nested data structure
            currentUser = result.data.user || result.data;
            displayProfile(currentUser);
        } else {
            showError('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

/**
 * Display profile information
 */
function displayProfile(user) {
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userInterests').value = user.interests || '';
    document.getElementById('userSkills').value = user.skills || '';

    // Display CV if it exists
    const cvTextArea = document.getElementById('cvText');
    const cvResult = document.getElementById('cvResult');

    if (user.cv && user.cv.trim() !== '') {
        cvTextArea.value = user.cv;
        cvResult.style.display = 'block';
    } else {
        cvTextArea.value = '';
        cvResult.style.display = 'none';
    }

    updateDisplayTags();
}

/**
 * Update display tags for skills and interests
 */
function updateDisplayTags() {
    const interests = document.getElementById('userInterests').value;
    const skills = document.getElementById('userSkills').value;

    // Display interests
    const interestsContainer = document.getElementById('interestsDisplay');
    if (interests) {
        const interestsList = interests.split(',').map(i => i.trim()).filter(i => i);
        interestsContainer.innerHTML = interestsList.map(interest =>
            `<div class="interest-tag">${interest}</div>`
        ).join('');
    } else {
        interestsContainer.innerHTML = '<p style="color: #999;">No interests added yet</p>';
    }

    // Display skills
    const skillsContainer = document.getElementById('skillsDisplay');
    if (skills) {
        const skillsList = skills.split(',').map(s => s.trim()).filter(s => s);
        skillsContainer.innerHTML = skillsList.map(skill =>
            `<div class="skill-tag">${skill}</div>`
        ).join('');
    } else {
        skillsContainer.innerHTML = '<p style="color: #999;">No skills added yet</p>';
    }
}

// Update tags when user types
document.addEventListener('DOMContentLoaded', function() {
    const interestsInput = document.getElementById('userInterests');
    const skillsInput = document.getElementById('userSkills');

    if (interestsInput) {
        interestsInput.addEventListener('input', updateDisplayTags);
    }
    if (skillsInput) {
        skillsInput.addEventListener('input', updateDisplayTags);
    }
});

/**
 * Generate CV with AI based on skills and interests
 */
async function generateCV() {
    const skills = document.getElementById('userSkills').value.trim();
    const interests = document.getElementById('userInterests').value.trim();

    if (!skills && !interests) {
        showError('Please enter your skills and/or interests first!');
        return;
    }

    const btn = document.getElementById('generateCVBtn');
    const resultContainer = document.getElementById('cvResult');
    const cvTextArea = document.getElementById('cvText');

    btn.disabled = true;
    btn.textContent = '⏳ Generating CV...';
    resultContainer.style.display = 'block';
    cvTextArea.value = '';
    cvTextArea.placeholder = 'AI is generating your CV...';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/ai.php?action=generate-cv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                skills: skills,
                interests: interests
            })
        });

        const result = await response.json();

        if (result.success) {
            cvTextArea.value = result.data.cv_text;
            cvTextArea.placeholder = 'Your AI-generated CV will appear here...';
            showSuccess('CV generated successfully! You can copy it or edit it as needed.');
        } else {
            cvTextArea.value = '';
            cvTextArea.placeholder = 'Failed to generate CV. Please try again.';
            showError('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating CV:', error);
        cvTextArea.value = '';
        cvTextArea.placeholder = 'Failed to generate CV. Please try again.';
        showError('Failed to generate CV. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Generate CV with AI';
    }
}

/**
 * Save profile
 */
async function saveProfile() {
    const interests = document.getElementById('userInterests').value.trim();
    const skills = document.getElementById('userSkills').value.trim();
    const cv = document.getElementById('cvText').value.trim();

    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/auth.php?action=update-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                interests: interests,
                skills: skills,
                cv: cv
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Profile saved successfully!');

            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.interests = interests;
            user.skills = skills;
            user.cv = cv;
            localStorage.setItem('user', JSON.stringify(user));

            loadStatistics(); // Reload stats
        } else {
            showError('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showError('Failed to save profile');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Save Profile';
    }
}

/**
 * Load project statistics
 */
async function loadStatistics() {
    const container = document.getElementById('statsGrid');

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=statistics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            displayStatistics(result.data);
        } else {
            container.innerHTML = '<p style="color: #dc3545;">Failed to load statistics</p>';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to load statistics</p>';
    }
}

/**
 * Display statistics
 */
function displayStatistics(stats) {
    const container = document.getElementById('statsGrid');

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.owned_projects || 0}</div>
            <div class="stat-label">Owned Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.member_projects || 0}</div>
            <div class="stat-label">Member Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.active_projects || 0}</div>
            <div class="stat-label">Active Projects</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.completed_projects || 0}</div>
            <div class="stat-label">Completed Projects</div>
        </div>
    `;
}

/**
 * Show success message
 */
function showSuccess(message) {
    const container = document.getElementById('successMessage');
    container.textContent = message;
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('errorMessage');
    container.textContent = message;
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}
