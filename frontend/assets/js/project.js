/**
 * Single Project Page JavaScript
 * Handles project details, team management, and teammate matching
 */

// Global state
let currentProject = null;
let currentUserId = null;
let isOwner = false;

/**
 * Load project details
 */
async function loadProject(projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=get&id=${projectId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            currentProject = result.data;

            // Get current user - try multiple storage keys
            let user = null;
            const userStr = localStorage.getItem('user') ||
                           localStorage.getItem('currentUser') ||
                           localStorage.getItem('auth_user');

            if (userStr) {
                try {
                    user = JSON.parse(userStr);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }

            // If user not in localStorage, try to get from API
            if (!user || !user.id) {
                console.warn('User not found in localStorage, fetching from API...');
                // For now, use owner_id from project as fallback
                currentUserId = currentProject.owner_id;
                console.log('Using owner_id as fallback:', currentUserId);
            } else {
                currentUserId = user.id;
                console.log('Current user ID:', currentUserId);
            }

            isOwner = currentProject.owner_id == currentUserId;
            console.log('Is Owner?', isOwner, '(Project Owner:', currentProject.owner_id, ', Current User:', currentUserId, ')');

            displayProject(currentProject);
            loadTeamMembers(projectId);

            // Show find teammates section only for owner
            if (isOwner) {
                console.log('Showing Add Team Members section');
                document.getElementById('findTeammatesSection').style.display = 'block';
            } else {
                console.log('Hiding Add Team Members section - user is not owner');
            }

            setupActionButtons();
        } else {
            alert('Error: ' + result.message);
            window.location.href = 'projects.html';
        }
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project');
        window.location.href = 'projects.html';
    }
}

/**
 * Display project information
 */
function displayProject(project) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('projectContent').style.display = 'block';

    document.getElementById('projectName').textContent = project.name;
    document.getElementById('projectDescription').textContent = project.description;

    const statusBadge = document.getElementById('projectStatus');
    statusBadge.textContent = project.status;
    statusBadge.className = `status-badge status-${project.status}`;

    document.getElementById('projectCategory').textContent = project.category || 'General';
    document.getElementById('projectOwner').textContent = project.owner_name || 'Unknown';
    document.getElementById('requiredSkills').textContent = project.required_skills || 'No specific skills required';
    document.getElementById('maxTeamSize').textContent = project.max_team_size || 5;
}

/**
 * Load team members
 */
async function loadTeamMembers(projectId) {
    const container = document.getElementById('teamGrid');

    try {
        // Team members are included in the project data
        if (currentProject.team && currentProject.team.length > 0) {
            displayTeamMembers(currentProject.team);
            document.getElementById('teamCount').textContent = currentProject.team.length;
        } else {
            container.innerHTML = '<p style="color: #999;">No team members yet</p>';
            document.getElementById('teamCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to load team members</p>';
    }
}

/**
 * Display team members
 */
function displayTeamMembers(team) {
    const container = document.getElementById('teamGrid');

    container.innerHTML = team.map(member => {
        const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
        return `
            <div class="team-member-card">
                <div class="avatar">${initial}</div>
                <h3>${member.name || 'Unknown'}</h3>
                <div class="role">${member.role}</div>
                ${member.email ? `<p style="font-size: 0.85rem; color: #666; margin-top: 5px;">${member.email}</p>` : ''}
                ${isOwner && member.role !== 'owner' ? `
                    <button class="btn btn-danger btn-small" onclick="removeMember(${member.user_id})" style="margin-top: 10px;">
                        Remove
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Search for users manually
 */
async function searchUsers() {
    const searchInput = document.getElementById('searchUserInput');
    const searchTerm = searchInput.value.trim();
    const container = document.getElementById('searchResults');

    if (!searchTerm || searchTerm.length < 2) {
        container.innerHTML = '<p style="color: #dc3545; font-size: 0.9rem;">Please enter at least 2 characters</p>';
        return;
    }

    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching users...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/auth.php?action=search-users&q=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            }
        });

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            // Filter out current team members
            const currentTeamIds = currentProject.team ? currentProject.team.map(m => m.user_id) : [];
            const availableUsers = result.data.filter(user => !currentTeamIds.includes(user.id));

            if (availableUsers.length === 0) {
                container.innerHTML = '<p style="color: #999;">All matching users are already team members</p>';
                return;
            }

            container.innerHTML = `
                <div style="display: grid; gap: 10px; margin-top: 10px;">
                    ${availableUsers.map(user => {
                        const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                        return `
                            <div style="display: flex; align-items: center; gap: 15px; padding: 12px; background: white; border: 1px solid #ddd; border-radius: 8px;">
                                <div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #9b59b6, #a770ef); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold;">
                                    ${initial}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #333;">${user.name}</div>
                                    <div style="font-size: 0.85rem; color: #666;">${user.email}</div>
                                    ${user.skills ? `<div style="font-size: 0.8rem; color: #999; margin-top: 3px;">💼 ${user.skills}</div>` : ''}
                                </div>
                                <button class="btn btn-primary btn-small" onclick="inviteTeammate(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                                    ➕ Add
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: #999;">No users found matching your search</p>';
        }
    } catch (error) {
        console.error('Error searching users:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to search users</p>';
    }
}

/**
 * Find potential teammates
 */
async function findTeammates() {
    const btn = document.getElementById('findTeammatesBtn');
    const container = document.getElementById('potentialTeammates');

    btn.disabled = true;
    btn.textContent = '⏳ Finding teammates...';
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>AI is finding matching teammates...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/matchmaking.php?action=find-teammates&project_id=${currentProject.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            displayPotentialTeammates(result.data);
        } else {
            container.innerHTML = `<p style="color: #dc3545;">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error finding teammates:', error);
        container.innerHTML = '<p style="color: #dc3545;">Failed to find teammates</p>';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Find Matching Teammates';
    }
}

/**
 * Display potential teammates
 */
function displayPotentialTeammates(teammates) {
    const container = document.getElementById('potentialTeammates');

    if (!teammates || teammates.length === 0) {
        container.innerHTML = '<p style="color: #999;">No matching teammates found</p>';
        return;
    }

    container.innerHTML = teammates.map(mate => {
        const initial = mate.name ? mate.name.charAt(0).toUpperCase() : '?';
        const score = mate.match_score ? Math.round(mate.match_score * 10) : 0;

        return `
            <div class="teammate-card">
                <div class="avatar-small">${initial}</div>
                <div class="teammate-info">
                    <h4>${mate.name || 'Unknown'}</h4>
                    <div class="skills">${mate.skills || 'No skills listed'}</div>
                </div>
                <div class="match-score">${score}%</div>
                <button class="btn btn-primary btn-small" onclick="inviteTeammate(${mate.id}, '${mate.name}')">
                    Invite
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Invite teammate
 */
async function inviteTeammate(userId, userName) {
    if (!confirm(`Invite ${userName} to join this project?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=add-member&id=${currentProject.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            },
            body: JSON.stringify({
                member_id: userId,
                role: 'member'
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Team member added successfully!');
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error inviting teammate:', error);
        alert('Failed to invite teammate');
    }
}

/**
 * Remove team member
 */
async function removeMember(userId) {
    if (!confirm('Are you sure you want to remove this member?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=remove-member&id=${currentProject.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            },
            body: JSON.stringify({
                member_id: userId
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Team member removed successfully!');
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member');
    }
}

/**
 * Setup action buttons based on user role
 */
function setupActionButtons() {
    const container = document.getElementById('actionButtons');

    if (isOwner) {
        container.innerHTML = `
            <button class="btn btn-primary" onclick="editProject()">
                ✏️ Edit Project
            </button>
            <button class="btn btn-outline" onclick="changeStatus()">
                📊 Change Status
            </button>
            <button class="btn btn-danger" onclick="deleteProject()">
                🗑️ Delete Project
            </button>
        `;
    } else {
        container.innerHTML = `
            <button class="btn btn-danger" onclick="leaveProject()">
                🚪 Leave Project
            </button>
        `;
    }
}

/**
 * Edit project
 */
function editProject() {
    const newName = prompt('Enter new project name:', currentProject.name);
    if (!newName) return;

    const newDescription = prompt('Enter new description:', currentProject.description);
    if (!newDescription) return;

    updateProject({ name: newName, description: newDescription });
}

/**
 * Change project status
 */
function changeStatus() {
    const status = prompt('Enter new status (active/completed/archived):', currentProject.status);
    if (!status || !['active', 'completed', 'archived'].includes(status)) {
        alert('Invalid status');
        return;
    }

    updateProject({ status: status });
}

/**
 * Update project
 */
async function updateProject(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=update&id=${currentProject.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert('Project updated successfully!');
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project');
    }
}

/**
 * Delete project
 */
async function deleteProject() {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone!')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=delete&id=${currentProject.id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('Project deleted successfully!');
            window.location.href = 'projects.html';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

/**
 * Leave project
 */
async function leaveProject() {
    if (!confirm('Are you sure you want to leave this project?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/backend/api/projects.php?action=remove-member&id=${currentProject.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('currentUser')}`
            },
            body: JSON.stringify({
                member_id: currentUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('You have left the project');
            window.location.href = 'projects.html';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error leaving project:', error);
        alert('Failed to leave project');
    }
}
