// Settings Page with API Integration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/backend/api';

let currentUser = null;
let currentPreferences = null;

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    initSettingsPage();
});

async function initSettingsPage() {
    await loadUserData();
    await loadStatistics();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });
}

async function loadUserData() {
    try {
        // Load user profile
        const profileResponse = await fetch(`${API_BASE}/auth.php?action=profile`, {
            headers: getHeaders()
        });

        const profileData = await profileResponse.json();

        if (profileData.success) {
            currentUser = profileData.data.user;
            currentPreferences = profileData.data.preferences;

            // Display user info
            document.getElementById('userName').textContent = currentUser.name || '-';
            document.getElementById('userEmail').textContent = currentUser.email || '-';

            const createdDate = new Date(currentUser.created_at);
            document.getElementById('userCreatedAt').textContent = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Load preferences
            loadPreferences();
        } else {
            alert('Error loading user data: ' + profileData.message);
        }
    } catch (error) {
        alert('Error loading user data. Please refresh the page.');
    }
}

function loadPreferences() {
    if (currentPreferences) {
        // Set daily study hours
        const dailyHours = currentPreferences.daily_study_hours || 6;
        document.getElementById('studyHoursPerDay').value = Math.round(dailyHours);

        // Set preferred time
        const preferredTime = currentPreferences.preferred_study_time || 'evening';
        document.getElementById('preferredTime').value = preferredTime;
    }
}

async function loadStatistics() {
    try {
        // Load courses and tasks counts
        const [coursesResponse, tasksResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();

        if (coursesData.success && tasksData.success) {
            const coursesCount = coursesData.data ? coursesData.data.length : 0;
            const tasksCount = tasksData.data ? tasksData.data.length : 0;

            document.getElementById('statCourses').textContent = coursesCount;
            document.getElementById('statTasks').textContent = tasksCount;

            // Calculate approximate data size
            const dataSize = Math.round((JSON.stringify(coursesData.data).length +
                                       JSON.stringify(tasksData.data).length) / 1024);
            document.getElementById('dataSize').textContent = dataSize;
        }
    } catch (error) {
    }
}

async function savePreferences() {
    const dailyHours = parseFloat(document.getElementById('studyHoursPerDay').value);
    const preferredTime = document.getElementById('preferredTime').value;

    const successMsg = document.getElementById('successMsg');

    try {
        const response = await fetch(`${API_BASE}/auth.php?action=preferences`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                daily_study_hours: dailyHours,
                preferred_study_time: preferredTime
            })
        });

        const data = await response.json();

        if (data.success) {
            successMsg.textContent = '✅ Preferences saved successfully!';
            successMsg.style.display = 'block';

            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 3000);

            // Reload preferences
            await loadUserData();
        } else {
            alert('❌ Error saving preferences: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('❌ Error saving preferences. Please try again.');
    }
}

async function exportData() {
    try {
        // Fetch all user data
        const [coursesResponse, tasksResponse, schedulesResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/schedule.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();
        const schedulesData = await schedulesResponse.json();

        const exportData = {
            version: '1.0.0',
            exported_at: new Date().toISOString(),
            user: {
                name: currentUser.name,
                email: currentUser.email
            },
            courses: coursesData.data || [],
            tasks: tasksData.data || [],
            schedules: schedulesData.data || [],
            preferences: currentPreferences
        };

        // Create download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ Data exported successfully!');
    } catch (error) {
        alert('❌ Error exporting data. Please try again.');
    }
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();

        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.version || !importedData.courses) {
                    alert('❌ Invalid backup file format');
                    return;
                }

                if (!confirm('⚠️ This will import data. Do you want to continue?')) {
                    return;
                }

                // Import courses
                let importedCourses = 0;
                for (const course of importedData.courses) {
                    try {
                        const response = await fetch(`${API_BASE}/courses.php`, {
                            method: 'POST',
                            headers: getHeaders(),
                            body: JSON.stringify({
                                name: course.name,
                                difficulty: course.difficulty,
                                total_hours: course.total_hours,
                                performance: course.performance
                            })
                        });
                        if ((await response.json()).success) importedCourses++;
                    } catch (err) {
                    }
                }

                alert(`✅ Import completed!\n- Courses: ${importedCourses}/${importedData.courses.length}`);

                // Reload page
                window.location.reload();
            } catch (err) {
                alert('❌ Error reading import file. Please check the file format.');
            }
        };

        reader.readAsText(file);
    } catch (error) {
        alert('❌ Error importing data. Please try again.');
    }
}

async function clearAllData() {
    const confirmation = prompt('⚠️ WARNING: This will delete ALL your courses and tasks!\n\nType "DELETE" to confirm:');

    if (confirmation !== 'DELETE') {
        alert('Deletion cancelled.');
        return;
    }

    try {
        // Get all courses and tasks
        const [coursesResponse, tasksResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();

        let deletedCourses = 0;
        let deletedTasks = 0;

        // Delete all tasks
        if (tasksData.success && tasksData.data) {
            for (const task of tasksData.data) {
                try {
                    const response = await fetch(`${API_BASE}/tasks.php?id=${task.id}`, {
                        method: 'DELETE',
                        headers: getHeaders()
                    });
                    if ((await response.json()).success) deletedTasks++;
                } catch (err) {
                }
            }
        }

        // Delete all courses
        if (coursesData.success && coursesData.data) {
            for (const course of coursesData.data) {
                try {
                    const response = await fetch(`${API_BASE}/courses.php?id=${course.id}`, {
                        method: 'DELETE',
                        headers: getHeaders()
                    });
                    if ((await response.json()).success) deletedCourses++;
                } catch (err) {
                }
            }
        }

        alert(`✅ Data cleared!\n- Courses deleted: ${deletedCourses}\n- Tasks deleted: ${deletedTasks}`);

        // Reload statistics
        await loadStatistics();
    } catch (error) {
        alert('❌ Error clearing data. Please try again.');
    }
}

async function deleteAccount() {
    const confirmation = prompt('⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️\n\nThis will PERMANENTLY delete your account and ALL data!\nThis action CANNOT be undone!\n\nType "DELETE MY ACCOUNT" to confirm:');

    if (confirmation !== 'DELETE MY ACCOUNT') {
        alert('Account deletion cancelled.');
        return;
    }

    alert('❌ Account deletion is not yet implemented for safety reasons.\n\nPlease contact support to delete your account.');

    // TODO: Implement account deletion endpoint
    // This should be done carefully with proper confirmation
}
