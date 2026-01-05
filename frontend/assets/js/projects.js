/**
 * Projects Page JavaScript
 * Handles project discovery, AI project generation, and project management
 */

// Global state
let userInterests = [];
let selectedProjectIdea = null;
let currentTab = 'my';

/**
 * Load user interests from server
 */
async function loadUserInterests() {
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

        if (result.success && result.data.interests) {
            userInterests = result.data.interests.split(',').map(i => i.trim()).filter(i => i);
            renderInterestTags();
        }
    } catch (error) {
        console.error('Error loading interests:', error);
    }
}

/**
 * Add interest tag
 */
function addInterest() {
    const input = document.getElementById('interestInput');
    const interest = input.value.trim();

    if (interest && !userInterests.includes(interest)) {
        userInterests.push(interest);
        renderInterestTags();
        input.value = '';
    }
}

/**
 * Remove interest tag
 */
function removeInterest(interest) {
    userInterests = userInterests.filter(i => i !== interest);
    renderInterestTags();
}

/**
 * Render interest tags
 */
function renderInterestTags() {
    const container = document.getElementById('interestTags');

    if (userInterests.length === 0) {
        container.innerHTML = '<p style="color: #999;">No interests added yet. Add some to get AI project suggestions!</p>';
        return;
    }

    container.innerHTML = userInterests.map(interest => `
        <div class="interest-tag">
            <span>${interest}</span>
            <button class="remove-btn" onclick="removeInterest('${interest}')">×</button>
        </div>
    `).join('');
}

/**
 * Generate AI project ideas
 */
async function generateProjectIdeas() {
    if (userInterests.length === 0) {
        alert('Please add at least one interest first!');
        return;
    }

    const btn = document.getElementById('generateBtn');
    const section = document.getElementById('projectIdeasSection');
    const container = document.getElementById('projectIdeasContainer');

    btn.disabled = true;
    btn.textContent = '⏳ Generating ideas...';
    section.style.display = 'block';
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>AI is generating project ideas...</p></div>';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/ai.php?action=generate-projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                interests: userInterests.join(', '),
                difficulty: 'medium',
                count: 5
            })
        });

        const result = await response.json();

        if (result.success) {
            displayProjectIdeas(result.data.projects, result.data.raw_response);
        } else {
            container.innerHTML = `<p style="color: #dc3545;">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error generating project ideas:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to generate project ideas. Please try again.</p>';
    } finally {
        btn.disabled = false;
        btn.textContent = '✨ Generate Project Ideas with AI';
    }
}

/**
 * Display AI generated project ideas
 */
function displayProjectIdeas(projects, rawResponse) {
    const container = document.getElementById('projectIdeasContainer');
    const createBtn = document.getElementById('createProjectBtn');

    if (!projects || projects.length === 0) {
        // Fallback: Try to split raw response manually
        const manualProjects = splitProjectsManually(rawResponse);

        if (manualProjects.length > 0) {
            // Successfully split manually
            displayProjectCards(manualProjects, container, createBtn);
        } else {
            // Could not split, display as single box with manual split option
            container.innerHTML = `
                <div class="alert" style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <strong>⚠️ Note:</strong> Could not automatically split projects. Displaying as single text. You can copy individual project ideas below.
                </div>
                <div class="project-idea-card" style="background: white; cursor: default; border: 2px solid #e0e0e0;">
                    <h3 style="color: #9b59b6; margin-bottom: 15px;">🤖 AI Generated Project Ideas</h3>
                    <pre style="white-space: pre-wrap; color: #333; line-height: 1.8; font-size: 0.95rem;">${rawResponse}</pre>
                </div>
            `;
            createBtn.style.display = 'block';
            createBtn.textContent = 'Create Project Manually';
        }
        return;
    }

    displayProjectCards(projects, container, createBtn);
}

/**
 * Try to split projects manually from raw text
 */
function splitProjectsManually(text) {
    const projects = [];

    // Try splitting by ### or numbered patterns
    const patterns = [
        /###\s*\d+[.\):].*?(?=###\s*\d+[.\):]|$)/gs,  // Match ### 1. ... ### 2. ...
        /\d+[.\)].*?(?=\d+[.\)]|$)/gs,  // Match 1. ... 2. ...
        /---+/g  // Match by ---
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length >= 2) {
            matches.forEach(match => {
                const trimmed = match.trim();
                if (trimmed.length > 50) {
                    projects.push({ raw: trimmed });
                }
            });
            break;
        }
    }

    return projects;
}

/**
 * Display project cards in grid
 */
function displayProjectCards(projects, container, createBtn) {
    container.innerHTML = `
        <div class="alert" style="background: #d4edda; border: 1px solid #28a745; padding: 12px; border-radius: 8px; margin-bottom: 15px; color: #155724;">
            <strong>✨ Success!</strong> Generated ${projects.length} project ideas. Click on any card to select it.
        </div>
        <div class="project-ideas-grid">
            ${projects.map((project, index) => `
                <div class="project-idea-card" onclick="selectProjectIdea(${index})" data-index="${index}">
                    <div style="position: absolute; top: 10px; right: 10px; background: #9b59b6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
                        ${index + 1}
                    </div>
                    <pre style="white-space: pre-wrap; color: #333; margin: 0; line-height: 1.6; padding-top: 10px;">${project.raw || project}</pre>
                </div>
            `).join('')}
        </div>
    `;

    // Hide button initially until a project is selected
    createBtn.style.display = 'none';
    selectedProjectIdea = null;
}

/**
 * Select a project idea
 */
function selectProjectIdea(index) {
    const cards = document.querySelectorAll('.project-idea-card');
    const createBtn = document.getElementById('createProjectBtn');

    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('selected');
            selectedProjectIdea = index;
        } else {
            card.classList.remove('selected');
        }
    });

    // Show the create button when a project is selected
    if (createBtn) {
        createBtn.style.display = 'block';
    }
}

/**
 * Create selected project
 */
async function createSelectedProject() {
    if (selectedProjectIdea === null) {
        alert('Please select a project idea first!');
        return;
    }

    const projectName = prompt('Enter a name for your project:');
    if (!projectName) return;

    const projectDescription = prompt('Enter a brief description:');
    if (!projectDescription) return;

    const btn = document.getElementById('createProjectBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Creating project...';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: projectName,
                description: projectDescription,
                category: userInterests[0] || 'general',
                required_skills: userInterests.join(', '),
                status: 'active',
                is_public: 1,
                max_team_size: 5
            })
        });

        const result = await response.json();

        console.log('Create project response:', result);

        if (result.success) {
            alert('✅ Project created successfully!');
            console.log('Redirecting to project page:', result.data.project_id);
            // Add a small delay to ensure database is updated
            setTimeout(() => {
                window.location.href = `project.html?id=${result.data.project_id}`;
            }, 500);
        } else {
            console.error('Project creation failed:', result);
            alert('❌ Error creating project: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating project:', error);
        alert('❌ Failed to create project. Please check console for details.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Selected Project';
    }
}

/**
 * Switch between tabs
 */
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Load projects for selected tab
    loadProjects(tab);
}

/**
 * Load projects
 */
async function loadProjects(scope = 'my') {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading projects...</p></div>';

    try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('currentUser');

        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=list&scope=${scope}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            displayProjects(result.data);
        } else {
            container.innerHTML = `<p style="color: #dc3545;">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to load projects.</p>';
    }
}

/**
 * Display projects
 */
function displayProjects(projects) {
    const container = document.getElementById('projectsContainer');

    console.log('displayProjects called with:', projects);

    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <h3>No projects found</h3>
                <p>Create your first project using AI-generated ideas above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="projects-list">
            ${projects.map(project => {
                console.log('Rendering project:', project);
                return `
                    <div class="project-card" onclick="window.location.href='project.html?id=${project.id}'">
                        <h3>${project.name || 'Untitled Project'}</h3>
                        <div class="project-meta">
                            <span>📊 ${project.status || 'active'}</span>
                            <span>👥 ${project.team_count || 0} members</span>
                            <span>🏷️ ${project.category || 'general'}</span>
                        </div>
                        ${project.description ? `
                            <div class="project-description">
                                ${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}
                            </div>
                        ` : '<div class="project-description" style="color: #999; font-style: italic;">No description</div>'}
                        ${project.owner_name ? `<div class="team-info">👤 Owner: ${project.owner_name}</div>` : ''}
                        ${project.required_skills ? `<div class="team-info">🛠️ Skills: ${project.required_skills}</div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
