// if (!storage.isLoggedIn()) {
//     window.location.href = 'login.html';
// }

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    let currentDate = new Date();
    const tasks = storage.getTasks();
    const courses = storage.getCourses();

    tasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        if (course) {
            task.priority = aiEngine.calculatePriority(task, course);
        }
    });

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startDay = firstDay.getDay();
        if (startDay === 6) startDay = 0;
        else startDay = startDay + 1;

        const daysInMonth = lastDay.getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        for (let i = startDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const dayDiv = createDayDiv(dayNum, true);
            calendarDays.appendChild(dayDiv);
        }

        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() &&
                          month === today.getMonth() &&
                          year === today.getFullYear();

            const dayDiv = createDayDiv(day, false, isToday, year, month);
            calendarDays.appendChild(dayDiv);
        }

        const totalCells = calendarDays.children.length;
        const remainingCells = 42 - totalCells;

        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = createDayDiv(day, true);
            calendarDays.appendChild(dayDiv);
        }
    }

    function createDayDiv(dayNum, isOtherMonth, isToday = false, year, month) {
        const div = document.createElement('div');
        div.className = 'calendar-day';

        if (isOtherMonth) {
            div.classList.add('other-month');
        }

        if (isToday) {
            div.classList.add('today');
        }

        div.innerHTML = `<div class="day-number">${dayNum}</div>`;

        if (!isOtherMonth && year && month !== undefined) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const tasksForDay = tasks.filter(t => t.deadline === dateStr);

            if (tasksForDay.length > 0) {
                const firstTask = tasksForDay[0];
                const priorityClass = getPriorityClass(firstTask.priority || 0);

                const taskDiv = document.createElement('div');
                taskDiv.className = 'task-in-day';

                const deadline = new Date(dateStr);
                const today = new Date();
                const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 1 && daysLeft >= 0) {
                    taskDiv.classList.add('urgent');
                }

                taskDiv.textContent = firstTask.taskName;
                div.appendChild(taskDiv);

                if (tasksForDay.length > 1) {
                    const dotsDiv = document.createElement('div');
                    dotsDiv.style.marginTop = '4px';

                    tasksForDay.slice(0, 3).forEach(task => {
                        const dot = document.createElement('span');
                        dot.className = `task-dot ${getPriorityClass(task.priority || 0)}`;
                        dotsDiv.appendChild(dot);
                    });

                    div.appendChild(dotsDiv);
                }
            }

            div.onclick = () => showTasksForDay(year, month, dayNum);
        }

        return div;
    }

    function getPriorityClass(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    function showTasksForDay(year, month, day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const tasksForDay = tasks.filter(t => t.deadline === dateStr);

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        document.getElementById('selectedDayTitle').textContent = `Tasks for ${monthNames[month]} ${day}, ${year}`;

        const container = document.getElementById('selectedDayTasks');

        if (tasksForDay.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks on this day</p>';
            return;
        }

        const html = tasksForDay.map(task => {
            const priorityClass = getPriorityClass(task.priority || 0);
            const priorityColors = {
                'high': '#ef4444',
                'medium': '#f59e0b',
                'low': '#06b6d4'
            };

            const statusMap = {
                'pending': { text: 'Pending', color: '#f59e0b', icon: '⏳' },
                'in_progress': { text: 'In Progress', color: '#06b6d4', icon: '🔄' },
                'completed': { text: 'Completed', color: '#10b981', icon: '✅' }
            };

            const status = statusMap[task.status] || statusMap['pending'];

            return `
                <div class="task-item priority-${priorityClass}">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${task.taskName}</div>
                            <div class="task-meta">
                                <span>📖 ${task.courseName}</span>
                                <span>⏱️ ${task.estimatedHours} hours</span>
                                <span style="color: ${status.color};">${status.icon} ${status.text}</span>
                            </div>
                        </div>
                        <span class="badge badge-${priorityClass}">
                            ${task.priority || 'N/A'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    window.previousMonth = function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    window.nextMonth = function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };

    const today = new Date();
    showTasksForDay(today.getFullYear(), today.getMonth(), today.getDate());

    renderCalendar();
});
