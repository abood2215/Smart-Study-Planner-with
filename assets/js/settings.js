// if (!storage.isLoggedIn()) {
//     window.location.href = 'login.html';
// }

document.addEventListener('DOMContentLoaded', function() {
    const user = storage.getCurrentUser();
    const stats = storage.getStats();

    document.getElementById('userName').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userCreatedAt').textContent = new Date(user.createdAt).toLocaleDateString('en-US');

    document.getElementById('studyHoursPerDay').value = user.studyHoursPerDay;
    document.getElementById('preferredTime').value = user.preferredTime;

    document.getElementById('statCourses').textContent = stats.totalCourses;
    document.getElementById('statTasks').textContent = stats.totalTasks;

    const dataSize = new Blob([
        localStorage.getItem('users') || '',
        localStorage.getItem('courses') || '',
        localStorage.getItem('tasks') || '',
        localStorage.getItem('studySessions') || ''
    ]).size / 1024;
    document.getElementById('dataSize').textContent = dataSize.toFixed(2);

    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    window.savePreferences = function() {
        const users = storage.getUsers();
        const userIndex = users.findIndex(u => u.email === user.email);

        if (userIndex !== -1) {
            users[userIndex].studyHoursPerDay = parseInt(document.getElementById('studyHoursPerDay').value);
            users[userIndex].preferredTime = document.getElementById('preferredTime').value;

            localStorage.setItem('users', JSON.stringify(users));

            const successMsg = document.getElementById('successMsg');
            successMsg.textContent = 'Changes saved successfully!';
            successMsg.style.display = 'block';

            setTimeout(() => {
                successMsg.style.display = 'none';
                location.reload();
            }, 2000);
        }
    };

    window.exportData = function() {
        const data = {
            courses: storage.getCourses(),
            tasks: storage.getTasks(),
            sessions: storage.getStudySessions(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        alert('Data exported successfully!');
    };

    window.importData = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                if (confirm('Are you sure you want to import data? Current data will be replaced.')) {
                    if (data.courses) {
                        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
                        data.courses.forEach(course => {
                            course.userId = user.id;
                            courses.push(course);
                        });
                        localStorage.setItem('courses', JSON.stringify(courses));
                    }

                    if (data.tasks) {
                        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                        data.tasks.forEach(task => {
                            tasks.push(task);
                        });
                        localStorage.setItem('tasks', JSON.stringify(tasks));
                    }

                    alert('Data imported successfully!');
                    location.reload();
                }
            } catch (error) {
                alert('Error reading file! Make sure it is a valid file.');
            }
        };
        reader.readAsText(file);
    };

    window.clearAllData = function() {
        if (!confirm('Are you sure you want to delete all data? This action cannot be undone!')) {
            return;
        }

        if (!confirm('Final warning! All courses and tasks will be deleted. Are you sure?')) {
            return;
        }

        const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');

        const filteredCourses = allCourses.filter(c => c.userId !== user.id);
        const courseIds = allCourses.filter(c => c.userId === user.id).map(c => c.id);
        const filteredTasks = allTasks.filter(t => !courseIds.includes(t.courseId));

        localStorage.setItem('courses', JSON.stringify(filteredCourses));
        localStorage.setItem('tasks', JSON.stringify(filteredTasks));

        alert('All data deleted!');
        location.reload();
    };

    window.deleteAccount = function() {
        if (!confirm('Are you sure you want to delete your account? All your data will be permanently deleted!')) {
            return;
        }

        const password = prompt('Enter your password to confirm:');
        if (password !== user.password) {
            alert('Incorrect password!');
            return;
        }

        const users = storage.getUsers();
        const filteredUsers = users.filter(u => u.email !== user.email);
        localStorage.setItem('users', JSON.stringify(filteredUsers));

        const allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const filteredCourses = allCourses.filter(c => c.userId !== user.id);
        const courseIds = allCourses.filter(c => c.userId === user.id).map(c => c.id);
        const filteredTasks = allTasks.filter(t => !courseIds.includes(t.courseId));

        localStorage.setItem('courses', JSON.stringify(filteredCourses));
        localStorage.setItem('tasks', JSON.stringify(filteredTasks));

        alert('Your account has been deleted successfully. Goodbye!');
        storage.logoutUser();
    };
});
