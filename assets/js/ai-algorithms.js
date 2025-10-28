// ==================== AI Algorithms ====================
// AI algorithms for calculating priorities and allocating study time

class AIEngine {
    constructor() {
        this.weights = {
            deadline: 0.35,
            difficulty: 0.30,
            progress: 0.20,
            performance: 0.15
        };
    }

    // ==================== Priority Calculation ====================
    /**
     * Compute priority score for a task.
     * Priority Score = (Deadline Weight * 0.35) + (Difficulty Weight * 0.30) +
     *                  (Progress Weight * 0.20) + (Performance Weight * 0.15)
     */
    calculatePriority(task, course, userHistory = {}) {
        const deadlineWeight = this.calculateDeadlineWeight(task.deadline);
        const difficultyWeight = (course?.difficultyLevel || 0) / 5;
        const progressWeight = 1 - ((task?.completionPercentage || 0) / 100);
        const performanceWeight = this.calculatePerformanceWeight(course, userHistory);

        const priorityScore = (
            deadlineWeight * this.weights.deadline +
            difficultyWeight * this.weights.difficulty +
            progressWeight * this.weights.progress +
            performanceWeight * this.weights.performance
        );

        return Math.round(priorityScore * 100);
    }

    /**
     * Calculate deadline weight: closer deadlines get higher weight.
     */
    calculateDeadlineWeight(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return 1.0; // overdue
        if (daysRemaining === 0) return 1.0; // today
        if (daysRemaining === 1) return 0.95; // tomorrow
        if (daysRemaining <= 2) return 0.90;
        if (daysRemaining <= 3) return 0.80;
        if (daysRemaining <= 5) return 0.70;
        if (daysRemaining <= 7) return 0.60;
        if (daysRemaining <= 14) return 0.40;
        if (daysRemaining <= 30) return 0.20;

        return 0.10;
    }

    /**
     * Calculate performance weight from course grades: lower grade => higher priority.
     */
    calculatePerformanceWeight(course, userHistory) {
        const grade = course?.currentGrade ?? 0;
        if (grade < 60) return 1.0;
        if (grade < 70) return 0.8;
        if (grade < 80) return 0.6;
        if (grade < 90) return 0.4;
        return 0.2;
    }

    // ==================== Time Allocation ====================
    /**
     * Distribute available study hours across tasks based on priority.
     */
    allocateStudyTime(tasks, courses, availableHours) {
        const tasksWithPriority = tasks
            .map(task => {
                const course = courses.find(c => c.id === task.courseId);
                if (!course) return null;
                const priority = this.calculatePriority(task, course);
                return { ...task, priority, course };
            })
            .filter(t => t !== null && t.status !== 'completed');

        tasksWithPriority.sort((a, b) => b.priority - a.priority);

        let remainingHours = availableHours;
        const schedule = [];

        for (const task of tasksWithPriority) {
            if (remainingHours <= 0) break;
            const completion = task.completionPercentage || 0;
            const hoursNeeded = task.estimatedHours * (1 - completion / 100);
            const allocatedHours = Math.min(hoursNeeded, remainingHours);

            if (allocatedHours > 0) {
                schedule.push({
                    taskId: task.id,
                    taskName: task.taskName,
                    courseName: task.courseName,
                    allocatedHours: Math.round(allocatedHours * 10) / 10,
                    priority: task.priority,
                    deadline: task.deadline
                });
                remainingHours -= allocatedHours;
            }
        }

        return schedule;
    }

    /**
     * Build a detailed daily schedule based on preferred time blocks.
     */
    createDailySchedule(schedule, preferredTime, totalHours) {
        const timeSlots = this.getTimeSlots(preferredTime, totalHours);
        const detailedSchedule = [];

        let slotIndex = 0;
        for (const item of schedule) {
            const sessions = Math.ceil(item.allocatedHours / 1.5); // one 1.5h session per block
            for (let i = 0; i < sessions && slotIndex < timeSlots.length; i++) {
                const sessionHours = Math.min(item.allocatedHours, 1.5);
                detailedSchedule.push({
                    ...item,
                    timeSlot: timeSlots[slotIndex],
                    sessionHours: Math.round(sessionHours * 10) / 10,
                    breakAfter: 15 // break 15 minutes
                });
                item.allocatedHours -= sessionHours;
                slotIndex++;
            }
        }

        return detailedSchedule;
    }

    /**
     * Get time slots according to preferred time of day.
     */
    getTimeSlots(preferredTime, totalHours) {
        const slots = [];
        let startHour, endHour;

        switch (preferredTime) {
            case 'morning':
                startHour = 8;
                endHour = 12;
                break;
            case 'afternoon':
                startHour = 13;
                endHour = 17;
                break;
            case 'evening':
                startHour = 18;
                endHour = 22;
                break;
            default:
                startHour = 9;
                endHour = 17;
        }

        let currentHour = startHour;
        let hoursAllocated = 0;

        while (hoursAllocated < totalHours && currentHour < endHour) {
            const slotEnd = Math.min(currentHour + 1.5, endHour);
            const endMinutes = (slotEnd % 1) * 60;
            slots.push({
                start: `${Math.floor(currentHour)}:${(currentHour % 1) ? '30' : '00'}`,
                end: `${Math.floor(slotEnd)}:${endMinutes === 0 ? '00' : '30'}`
            });
            hoursAllocated += 1.5;
            currentHour = slotEnd + 0.25; // add 15-min break between slots
        }

        return slots;
    }

    // ==================== Smart Recommendations ====================
    /**
     * Generate smart recommendations based on deadlines, progress and difficulty.
     */
    generateRecommendations(tasks, courses, studySessions) {
        const recommendations = [];

        // Overdue tasks
        const overdueTasks = tasks.filter(t => {
            const deadline = new Date(t.deadline);
            return deadline < new Date() && t.status !== 'completed';
        });
        if (overdueTasks.length > 0) {
            recommendations.push({
                type: 'warning',
                title: 'Overdue Tasks',
                message: `You have ${overdueTasks.length} overdue tasks. Give them top priority.`,
                action: 'urgent'
            });
        }

        // Urgent tasks (within 48 hours)
        const urgentTasks = tasks.filter(t => {
            const deadline = new Date(t.deadline);
            const hoursUntilDeadline = (deadline - new Date()) / (1000 * 60 * 60);
            return hoursUntilDeadline > 0 && hoursUntilDeadline <= 48 && t.status !== 'completed';
        });
        if (urgentTasks.length > 0) {
            recommendations.push({
                type: 'warning',
                title: 'Urgent Tasks',
                message: `You have ${urgentTasks.length} tasks due within 48 hours.`,
                action: 'focus'
            });
        }

        // Difficult courses
        const difficultCourses = courses.filter(c => (c.difficultyLevel || 0) >= 4);
        if (difficultCourses.length > 0) {
            const difficultTasks = tasks.filter(t =>
                difficultCourses.some(c => c.id === t.courseId) &&
                t.status !== 'completed'
            );
            if (difficultTasks.length > 0) {
                recommendations.push({
                    type: 'info',
                    title: 'Courses Needing Focus',
                    message: `You have ${difficultTasks.length} tasks in difficult courses. Consider allocating more time.`,
                    action: 'allocate_more_time'
                });
            }
        }

        // Completion rate
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        if (completionRate < 50 && tasks.length > 5) {
            recommendations.push({
                type: 'info',
                title: 'Low Completion Rate',
                message: `Your completion rate is ${Math.round(completionRate)}%. Try breaking tasks into smaller chunks.`,
                action: 'break_down_tasks'
            });
        } else if (completionRate >= 80) {
            recommendations.push({
                type: 'success',
                title: 'Great Progress!',
                message: `Your completion rate is ${Math.round(completionRate)}%. Keep up the good work!`,
                action: 'keep_going'
            });
        }

        // Average study time per session
        const totalStudyTime = (studySessions || []).reduce((sum, s) => sum + (s.actualDuration || 0), 0);
        const avgStudyPerDay = (studySessions || []).length > 0 ? totalStudyTime / 60 / (studySessions.length) : 0;
        if (avgStudyPerDay < 2 && tasks.filter(t => t.status !== 'completed').length > 3) {
            recommendations.push({
                type: 'warning',
                title: 'Increase Study Time',
                message: `Your average study time per session is ${avgStudyPerDay.toFixed(1)} hours. Consider studying a bit more.`,
                action: 'increase_study_time'
            });
        }

        return recommendations;
    }

    // ==================== Adaptive Learning ====================
    /**
     * Adjust estimates based on accuracy of previous estimates.
     */
    adjustEstimates(task, actualTime, estimatedTime) {
        const accuracy = estimatedTime / actualTime;
        if (accuracy >= 0.9 && accuracy <= 1.1) return estimatedTime;
        if (accuracy < 0.9) return estimatedTime * 1.2; // +20%
        return estimatedTime * 0.9; // -10%
    }

    /**
     * Analyze when the user is most productive based on session quality.
     */
    analyzeProductivityPatterns(studySessions) {
        const timeSlots = { morning: [], afternoon: [], evening: [] };
        studySessions.forEach(session => {
            const hour = new Date(session.startTime).getHours();
            let slot;
            if (hour >= 6 && hour < 12) slot = 'morning';
            else if (hour >= 12 && hour < 18) slot = 'afternoon';
            else slot = 'evening';
            timeSlots[slot].push(session.qualityRating || 3);
        });
        const averages = {};
        for (const [slot, ratings] of Object.entries(timeSlots)) {
            if (ratings.length > 0) {
                averages[slot] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            }
        }
        let bestTime = 'morning';
        let bestRating = 0;
        for (const [slot, rating] of Object.entries(averages)) {
            if (rating > bestRating) {
                bestRating = rating;
                bestTime = slot;
            }
        }
        return { bestTime, bestRating, averages };
    }

    // ==================== Progress Tracking ====================
    /**
     * Calculate overall progress percentage across tasks.
     */
    calculateOverallProgress(tasks) {
        if (tasks.length === 0) return 0;
        const totalProgress = tasks.reduce((sum, task) => sum + (task.completionPercentage || 0), 0);
        return Math.round(totalProgress / tasks.length);
    }

    /**
     * Predict completion date from remaining hours and average hours per day.
     */
    predictCompletionDate(task, avgHoursPerDay) {
        const remainingHours = task.estimatedHours * (1 - (task.completionPercentage || 0) / 100);
        const daysNeeded = Math.ceil(remainingHours / (avgHoursPerDay || 1));
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + daysNeeded);
        return completionDate;
    }
}

// Singleton instance
const aiEngine = new AIEngine();

