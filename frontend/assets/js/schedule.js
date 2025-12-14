// if (!storage.isLoggedIn()) {
//     window.location.href = 'login.html';
// }

document.addEventListener('DOMContentLoaded', function() {
    const user = storage.getCurrentUser();
    const tasks = storage.getTasks();
    const courses = storage.getCourses();

    const timeMap = {
        'morning': 'Morning (6 AM - 12 PM)',
        'afternoon': 'Afternoon (12 PM - 6 PM)',
        'evening': 'Evening (6 PM - 12 AM)'
    };

    document.getElementById('dailyHours').textContent = user.studyHoursPerDay;
    document.getElementById('preferredTime').textContent = timeMap[user.preferredTime] || user.preferredTime;
    document.getElementById('activeTasks').textContent = tasks.filter(t => t.status !== 'completed').length;

    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.logoutUser();
    });

    function generateWeeklySchedule() {
        const activeTasks = tasks.filter(t => t.status !== 'completed');

        if (activeTasks.length === 0) {
            document.getElementById('scheduleBody').innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                            <p>No active tasks to create a schedule</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        activeTasks.forEach(task => {
            const course = courses.find(c => c.id === task.courseId);
            if (course) {
                task.priority = aiEngine.calculatePriority(task, course);
            }
        });

        const schedule = aiEngine.allocateStudyTime(
            activeTasks,
            courses,
            user.studyHoursPerDay
        );

        const weeklySchedule = createWeeklySchedule(schedule);
        displayWeeklySchedule(weeklySchedule);
        displayDailyBreakdown(schedule);
    }

    function createWeeklySchedule(schedule) {
        const daysOfWeek = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const weekSchedule = {};

        const timeSlots = aiEngine.getTimeSlots(user.preferredTime, user.studyHoursPerDay);

        daysOfWeek.forEach((day, index) => {
            weekSchedule[day] = [];

            const tasksForDay = schedule.slice(
                index * Math.floor(schedule.length / 7),
                (index + 1) * Math.floor(schedule.length / 7)
            );

            tasksForDay.forEach((task, i) => {
                if (timeSlots[i]) {
                    weekSchedule[day].push({
                        time: timeSlots[i].start + ' - ' + timeSlots[i].end,
                        task: task.taskName,
                        course: task.courseName,
                        hours: task.allocatedHours
                    });
                }
            });
        });

        return weekSchedule;
    }

    function displayWeeklySchedule(weekSchedule) {
        const tbody = document.getElementById('scheduleBody');
        const timeSlots = aiEngine.getTimeSlots(user.preferredTime, user.studyHoursPerDay);

        if (timeSlots.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Cannot create schedule</td></tr>';
            return;
        }

        const rows = [];
        timeSlots.forEach((slot, index) => {
            const row = `<tr>
                <td style="font-weight: 600; background: #f9fafb;">${slot.start} - ${slot.end}</td>
                ${createDayCells(weekSchedule, index)}
            </tr>`;
            rows.push(row);
        });

        tbody.innerHTML = rows.join('');
    }

    function createDayCells(weekSchedule, timeIndex) {
        const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        return days.map(day => {
            const daySchedule = weekSchedule[day] || [];
            const task = daySchedule[timeIndex];

            if (task) {
                return `
                    <td style="background: linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%); padding: 12px;">
                        <strong style="color: #1e40af; display: block; margin-bottom: 4px;">${task.task}</strong>
                        <small style="color: #64748b; display: block;">📖 ${task.course}</small>
                        <small style="color: #64748b;">⏱️ ${task.hours} hours</small>
                    </td>
                `;
            } else {
                return '<td style="background: #fafafa; color: #999;">-</td>';
            }
        }).join('');
    }

    function displayDailyBreakdown(schedule) {
        const container = document.getElementById('dailyBreakdown');

        if (schedule.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks to display</p>';
            return;
        }

        const detailedSchedule = aiEngine.createDailySchedule(
            schedule,
            user.preferredTime,
            user.studyHoursPerDay
        );

        const html = detailedSchedule.map((item, index) => `
            <div style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong style="color: #2563eb; font-size: 1.1rem;">${index + 1}. ${item.taskName}</strong>
                    <span class="badge" style="background: #dbeafe; color: #1e40af;">
                        ${item.priority}
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>📖 Course:</strong> ${item.courseName}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>⏰ Time:</strong> ${item.timeSlot.start} - ${item.timeSlot.end}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>⏱️ Duration:</strong> ${item.sessionHours} hours
                </div>
                <div style="padding: 8px; background: #f0f9ff; border-radius: 6px; margin-top: 12px; font-size: 0.9rem;">
                    💡 <strong>Break:</strong> ${item.breakAfter} minutes after session
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    window.generateWeeklySchedule = generateWeeklySchedule;

    generateWeeklySchedule();
});
