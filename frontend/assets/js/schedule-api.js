// Schedule Page with API Integration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api';

let userPreferences = null;

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    initSchedulePage();
});

async function initSchedulePage() {
    // Load user preferences first
    await loadPreferences();

    // Load schedule
    await loadSchedule();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

async function loadPreferences() {
    try {
        const response = await fetch(`${API_BASE}/auth.php?action=profile`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success && data.data.preferences) {
            userPreferences = data.data.preferences;

            // Display preferences
            const dailyHours = userPreferences.daily_study_hours || 6;
            const preferredTime = userPreferences.preferred_study_time || 'evening';

            document.getElementById('dailyHours').textContent = dailyHours;
            document.getElementById('preferredTime').textContent =
                preferredTime.charAt(0).toUpperCase() + preferredTime.slice(1);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

async function loadSchedule() {
    try {
        const response = await fetch(`${API_BASE}/schedule.php`, {
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const schedules = data.data || [];
            displaySchedule(schedules);
            updateActiveTasks(schedules);
        } else {
            console.error('Failed to load schedule:', data.message);
            showEmptySchedule();
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showError('Error loading schedule. Please make sure XAMPP is running.');
    }
}

function updateActiveTasks(schedules) {
    const activeCount = schedules.filter(s => s.status === 'scheduled').length;
    const activeTasksEl = document.getElementById('activeTasks');
    if (activeTasksEl) {
        activeTasksEl.textContent = activeCount;
    }
}

function displaySchedule(schedules) {
    const dailyBreakdown = document.getElementById('dailyBreakdown');
    const scheduleBody = document.getElementById('scheduleBody');

    if (!dailyBreakdown) {
        console.error('Schedule container not found');
        return;
    }

    if (schedules.length === 0) {
        showEmptySchedule();
        if (scheduleBody) scheduleBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No schedule available. Click "Update Schedule" to generate one.</td></tr>';
        return;
    }

    // Group schedules by date and time
    const schedulesByDate = {};
    const timeSlots = new Set();

    schedules.forEach(schedule => {
        const date = schedule.scheduled_date;
        const time = schedule.start_time.substring(0, 5);

        if (!schedulesByDate[date]) {
            schedulesByDate[date] = {};
        }
        schedulesByDate[date][time] = schedule;
        timeSlots.add(time);
    });

    // Sort time slots
    const sortedTimes = Array.from(timeSlots).sort();

    // Get next 7 days for weekly view
    const today = new Date();
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
    }

    // Build weekly table
    if (scheduleBody) {
        scheduleBody.innerHTML = sortedTimes.map(time => {
            let row = `<tr><td style="font-weight: bold; background: #f9fafb;">${time}</td>`;

            weekDates.forEach(date => {
                const schedule = schedulesByDate[date] ? schedulesByDate[date][time] : null;

                if (schedule) {
                    const bgColor = schedule.status === 'completed' ? '#d1fae5' :
                                   schedule.status === 'missed' ? '#fee2e2' : '#dbeafe';

                    row += `
                        <td style="background: ${bgColor}; padding: 8px; vertical-align: top;">
                            <div style="font-size: 0.85em; font-weight: 600; margin-bottom: 4px;">
                                ${schedule.task_title || 'Study'}
                            </div>
                            <div style="font-size: 0.75em; color: #666;">
                                ${schedule.duration_minutes}min
                            </div>
                        </td>
                    `;
                } else {
                    row += '<td style="background: #f9fafb;"></td>';
                }
            });

            row += '</tr>';
            return row;
        }).join('');
    }

    // Display daily breakdown
    dailyBreakdown.innerHTML = Object.keys(schedulesByDate)
        .sort()
        .slice(0, 7)
        .map(date => {
            const daySchedules = Object.values(schedulesByDate[date]);
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isToday = date === today.toISOString().split('T')[0];

            return `
                <div class="day-schedule" style="${isToday ? 'border: 2px solid #3b82f6;' : ''}">
                    <div class="day-header" style="${isToday ? 'background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);' : ''}">
                        <h3>${dayName} ${isToday ? '(Today)' : ''}</h3>
                        <span>${dateStr}</span>
                    </div>
                    <div class="schedule-items">
                        ${daySchedules.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(schedule => `
                            <div class="schedule-item ${schedule.status}" style="margin-bottom: 12px; padding: 12px; border-left: 4px solid ${getDifficultyColor(schedule.difficulty)};">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; margin-bottom: 4px;">
                                            ${schedule.task_title || 'Study Session'}
                                        </div>
                                        <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">
                                            📚 ${schedule.course_name || 'General'}
                                        </div>
                                        <div style="font-size: 0.85em; color: #666;">
                                            ⏰ ${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)} (${schedule.duration_minutes}min)
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                                        <span class="badge badge-${schedule.difficulty}">${schedule.difficulty || 'medium'}</span>
                                        <button class="btn btn-sm ${schedule.status === 'completed' ? 'btn-secondary' : 'btn-success'}"
                                                onclick="markScheduleComplete(${schedule.id})"
                                                ${schedule.status === 'completed' ? 'disabled' : ''}
                                                style="padding: 4px 8px; font-size: 0.75em;">
                                            ${schedule.status === 'completed' ? '✓ Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

function getDifficultyColor(difficulty) {
    const colors = {
        'easy': '#10b981',
        'medium': '#f59e0b',
        'hard': '#ef4444'
    };
    return colors[difficulty] || colors.medium;
}

function showEmptySchedule() {
    const dailyBreakdown = document.getElementById('dailyBreakdown');
    if (dailyBreakdown) {
        dailyBreakdown.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📅</div>
                <h2 style="color: #666; margin-bottom: 10px;">No schedule yet</h2>
                <p style="color: #999;">Click "Update Schedule" to generate your study schedule</p>
            </div>
        `;
    }
}

function showError(message) {
    const dailyBreakdown = document.getElementById('dailyBreakdown');
    if (dailyBreakdown) {
        dailyBreakdown.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>⚠️ ${message}</p>
            </div>
        `;
    }
}

async function generateWeeklySchedule() {
    if (!confirm('🤖 Generate a new AI-powered study schedule?\n\nThis will create an optimized schedule based on your tasks, preferences, and deadlines.')) {
        return;
    }

    const dailyBreakdown = document.getElementById('dailyBreakdown');
    dailyBreakdown.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🤖</div>
            <h3 style="color: #2563eb; margin-bottom: 12px;">Generating Your Smart Schedule...</h3>
            <p style="color: #666;">Analyzing your courses, tasks, and preferences with AI...</p>
            <div style="margin-top: 20px;">
                <div style="display: inline-block; width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); animation: progress 2s ease-in-out infinite;"></div>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/generate-schedule.php`, {
            method: 'POST',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            const scheduleData = data.data.schedule || [];
            const stats = data.data.stats || {};

            if (scheduleData.length > 0) {
                alert(`✅ Schedule Generated Successfully!\n\n` +
                      `📚 Courses: ${stats.total_courses || 0}\n` +
                      `📝 Tasks: ${stats.total_tasks || 0}\n` +
                      `📅 Study Sessions: ${stats.sessions_created || 0}\n\n` +
                      `Your schedule is optimized based on:\n` +
                      `- Task deadlines\n` +
                      `- Course difficulty\n` +
                      `- Your study preferences`);

                // Reload the schedule
                await loadSchedule();
            } else {
                alert('⚠️ No schedule generated.\n\nPlease add some tasks first!');
                showEmptySchedule();
            }
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to generate schedule'));
            await loadSchedule();
        }
    } catch (error) {
        console.error('Error generating schedule:', error);
        alert('❌ Error generating schedule. Please try again.');
        await loadSchedule();
    }
}

// Add CSS animation for progress bar
if (!document.getElementById('schedule-animations')) {
    const style = document.createElement('style');
    style.id = 'schedule-animations';
    style.textContent = `
        @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}

async function markScheduleComplete(scheduleId) {
    try {
        const response = await fetch(`${API_BASE}/schedule.php?id=${scheduleId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'completed' })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Session marked as completed!');
            await loadSchedule();
        } else {
            alert('❌ Error: ' + (data.message || 'Failed to mark session as complete'));
        }
    } catch (error) {
        console.error('Error marking session complete:', error);
        alert('❌ Error marking session complete. Please try again.');
    }
}
