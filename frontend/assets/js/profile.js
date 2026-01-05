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
            currentUser = result.data;
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
 * Analyze CV with AI
 */
async function analyzeCV() {
    const cvText = document.getElementById('cvText').value.trim();

    if (!cvText) {
        alert('Please paste your CV content first!');
        return;
    }

    const btn = document.getElementById('analyzeCVBtn');
    const resultContainer = document.getElementById('analysisResult');

    btn.disabled = true;
    btn.textContent = '⏳ Analyzing CV...';
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>AI is analyzing your CV...</p></div>';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/ai.php?action=analyze-cv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cv_text: cvText
            })
        });

        const result = await response.json();

        if (result.success) {
            displayAnalysisResults(result.data);

            // Update form fields with extracted data
            if (result.data.skills && result.data.skills.length > 0) {
                document.getElementById('userSkills').value = Array.isArray(result.data.skills)
                    ? result.data.skills.join(', ')
                    : result.data.skills;
            }

            if (result.data.interests && result.data.interests.length > 0) {
                document.getElementById('userInterests').value = Array.isArray(result.data.interests)
                    ? result.data.interests.join(', ')
                    : result.data.interests;
            }

            updateDisplayTags();

            if (result.data.profile_updated) {
                showSuccess('CV analyzed successfully! Your profile has been updated.');
            }
        } else {
            resultContainer.innerHTML = `<p style="color: #dc3545;">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error analyzing CV:', error);
        resultContainer.innerHTML = '<p style="color: #dc3545;">Failed to analyze CV. Please try again.</p>';
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Analyze CV with AI';
    }
}

/**
 * Display CV analysis results
 */
function displayAnalysisResults(data) {
    const container = document.getElementById('analysisResult');

    const skillsList = Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',') : []);
    const interestsList = Array.isArray(data.interests) ? data.interests : (data.interests ? data.interests.split(',') : []);

    container.innerHTML = `
        <h3>✅ Analysis Complete!</h3>

        ${skillsList.length > 0 ? `
            <div class="analysis-section">
                <h4>🛠️ Extracted Skills:</h4>
                <div class="skills-display">
                    ${skillsList.map(skill => `<div class="skill-tag">${skill.trim()}</div>`).join('')}
                </div>
            </div>
        ` : ''}

        ${interestsList.length > 0 ? `
            <div class="analysis-section">
                <h4>💡 Identified Interests:</h4>
                <div class="skills-display">
                    ${interestsList.map(interest => `<div class="interest-tag">${interest.trim()}</div>`).join('')}
                </div>
            </div>
        ` : ''}

        ${data.experience_level ? `
            <div class="analysis-section">
                <h4>📊 Experience Level:</h4>
                <p style="color: #333; font-size: 1.1rem; text-transform: capitalize;">${data.experience_level}</p>
            </div>
        ` : ''}

        ${data.summary ? `
            <div class="analysis-section">
                <h4>📝 Profile Summary:</h4>
                <p style="color: #555; line-height: 1.6;">${data.summary}</p>
            </div>
        ` : ''}

        <p style="margin-top: 20px; color: #666; font-style: italic;">
            The extracted data has been automatically filled in the form below. Review and save when ready!
        </p>
    `;
}

/**
 * Save profile
 */
async function saveProfile() {
    const interests = document.getElementById('userInterests').value.trim();
    const skills = document.getElementById('userSkills').value.trim();

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
                skills: skills
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Profile saved successfully!');

            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.interests = interests;
            user.skills = skills;
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
