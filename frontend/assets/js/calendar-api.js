// Calendar Page with API Integration
const API_BASE = 'http://localhost/Smart-Study-Planner-with/backend/api';

let currentDate = new Date();
let allTasks = [];
let allCourses = [];
let allSchedules = [];

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

    initCalendarPage();
});

async function initCalendarPage() {
    await loadData();
    renderCalendar();
    displayTodayTasks();

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

async function loadData() {
    try {
        const [coursesResponse, tasksResponse, schedulesResponse] = await Promise.all([
            fetch(`${API_BASE}/courses.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/tasks.php`, { headers: getHeaders() }),
            fetch(`${API_BASE}/schedule.php`, { headers: getHeaders() })
        ]);

        const coursesData = await coursesResponse.json();
        const tasksData = await tasksResponse.json();
        const schedulesData = await schedulesResponse.json();

        if (coursesData.success) allCourses = coursesData.data || [];
        if (tasksData.success) allTasks = tasksData.data || [];
        if (schedulesData.success) allSchedules = schedulesData.data || [];
    } catch (error) {
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Adjust for Saturday start (Saturday = 6, we want it to be 0)
    const adjustedStartDay = startingDayOfWeek === 6 ? 0 : startingDayOfWeek + 1;

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarDays.appendChild(emptyCell);
    }

    // Add days of month
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        // Check if today
        if (isCurrentMonth && day === today.getDate()) {
            dayCell.classList.add('today');
        }

        // Get tasks for this day
        const dayDate = new Date(year, month, day);
        const dateStr = dayDate.toISOString().split('T')[0];
        const dayTasks = allTasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toISOString().split('T')[0] === dateStr;
        });

        const daySchedules = allSchedules.filter(schedule => {
            return schedule.scheduled_date === dateStr;
        });

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Add tasks indicator
        if (dayTasks.length > 0 || daySchedules.length > 0) {
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'day-tasks';

            // Show tasks
            dayTasks.slice(0, 2).forEach(task => {
                const taskDot = document.createElement('div');
                taskDot.className = `task-dot ${task.difficulty || 'medium'}`;
                taskDot.title = task.title;
                tasksContainer.appendChild(taskDot);
            });

            if (dayTasks.length > 2) {
                const more = document.createElement('div');
                more.className = 'task-more';
                more.textContent = `+${dayTasks.length - 2}`;
                tasksContainer.appendChild(more);
            }

            dayCell.appendChild(tasksContainer);
        }

        // Add click event
        dayCell.addEventListener('click', () => {
            displayDayTasks(year, month, day);
        });

        calendarDays.appendChild(dayCell);
    }
}

function displayDayTasks(year, month, day) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    // Update title
    const title = document.getElementById('selectedDayTitle');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    title.textContent = `Tasks for ${dayName}, ${dateString}`;

    // Get tasks and schedules for this day
    const dayTasks = allTasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate.toISOString().split('T')[0] === dateStr;
    });

    const daySchedules = allSchedules.filter(schedule => {
        return schedule.scheduled_date === dateStr;
    });

    const container = document.getElementById('selectedDayTasks');

    if (dayTasks.length === 0 && daySchedules.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks or schedules for this day</p>';
        return;
    }

    let html = '';

    // Show tasks
    if (dayTasks.length > 0) {
        html += '<h3 style="margin-top: 0; margin-bottom: 16px;">📝 Tasks Due</h3>';
        html += dayTasks.map(task => {
            const course = allCourses.find(c => c.id === task.course_id);
            const courseName = course ? course.name : 'No Course';

            return `
                <div class="task-item ${task.difficulty}">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">
                                <span>📚 ${courseName}</span>
                                <span>⏱️ ${task.estimated_hours}h</span>
                                <span class="badge badge-${task.status}">${task.status}</span>
                            </div>
                        </div>
                        <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
                    </div>
                    ${task.description ? `<p style="margin-top: 8px; color: #666;">${task.description}</p>` : ''}
                </div>
            `;
        }).join('');
    }

    // Show schedules
    if (daySchedules.length > 0) {
        html += '<h3 style="margin-top: 24px; margin-bottom: 16px;">📅 Scheduled Sessions</h3>';
        html += daySchedules.map(schedule => {
            return `
                <div class="task-item">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${schedule.task_title || 'Study Session'}</div>
                            <div class="task-meta">
                                <span>⏰ ${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}</span>
                                <span>📊 ${schedule.duration_minutes} minutes</span>
                                <span class="badge badge-${schedule.status}">${schedule.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    container.innerHTML = html;
}

function displayTodayTasks() {
    const today = new Date();
    displayDayTasks(today.getFullYear(), today.getMonth(), today.getDate());
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}
