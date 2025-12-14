class StorageManager {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
        if (!localStorage.getItem('courses')) localStorage.setItem('courses', JSON.stringify([]));
        if (!localStorage.getItem('tasks')) localStorage.setItem('tasks', JSON.stringify([]));
        if (!localStorage.getItem('studySessions')) localStorage.setItem('studySessions', JSON.stringify([]));
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getCurrentUser() {
        const email = localStorage.getItem('currentUser');
        if (!email) return null;
        const users = this.getUsers();
        return users.find(u => u.email === email) || null;
    }

    registerUser(userData) {
        const users = this.getUsers();
        if (users.some(u => u.email === userData.email)) {
            return { success: false, message: 'Email already registered' };
        }
        const newUser = {
            id: Date.now(),
            username: userData.username,
            email: userData.email,
            password: userData.password,
            studyHoursPerDay: parseInt(userData.studyHours),
            preferredTime: userData.preferredTime,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return { success: true, message: 'Account created successfully', user: newUser };
    }

    loginUser(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', email);
            return { success: true, message: 'Login successful', user };
        }
        return { success: false, message: 'Invalid email or password' };
    }

    logoutUser() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return localStorage.getItem('currentUser') !== null;
    }

    // Seed demo data for the current user if none exists
    seedDemoDataIfEmpty() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Seed courses
        const existingCourses = this.getCourses();
        if (!existingCourses || existingCourses.length === 0) {
            const demoCourses = [
                { courseName: 'Mathematics I', difficultyLevel: 3, estimatedHoursPerWeek: 6, currentGrade: 85 },
                { courseName: 'Database Systems', difficultyLevel: 4, estimatedHoursPerWeek: 8, currentGrade: 78 },
                { courseName: 'Machine Learning', difficultyLevel: 5, estimatedHoursPerWeek: 10, currentGrade: 90 },
            ];
            demoCourses.forEach(c => this.addCourse(c));
        }

        // Seed tasks
        const tasks = this.getTasks();
        if (!tasks || tasks.length === 0) {
            const seededCourses = this.getCourses();
            if (seededCourses.length === 0) return;
            const now = Date.now();
            const c1 = seededCourses[0];
            const c2 = seededCourses[1] || seededCourses[0];
            const c3 = seededCourses[2] || seededCourses[0];

            const demoTasks = [
                { course: c1, taskName: 'HTML/CSS Assignment', daysFromNow: 3, hours: 4, status: 'in_progress', completion: 50 },
                { course: c2, taskName: 'SQL Practice', daysFromNow: 2, hours: 3, status: 'pending', completion: 0 },
                { course: c3, taskName: 'Read ML Chapter 3', daysFromNow: 7, hours: 2, status: 'pending', completion: 0 },
            ];

            demoTasks.forEach(t => {
                this.addTask({
                    taskName: t.taskName,
                    courseId: t.course.id,
                    deadline: new Date(now + t.daysFromNow * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    estimatedHours: t.hours,
                    description: ''
                });
            });

            // Update statuses and completion
            const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const courseIds = seededCourses.map(c => c.id);
            const userTasks = allTasks.filter(t => courseIds.includes(t.courseId));
            userTasks.forEach((t, idx) => {
                const def = demoTasks[idx] || demoTasks[0];
                t.status = def.status;
                t.completionPercentage = def.completion;
            });
            const others = allTasks.filter(t => !courseIds.includes(t.courseId));
            localStorage.setItem('tasks', JSON.stringify([...others, ...userTasks]));
        }

        // Seed study sessions for charts
        const sessionsRaw = JSON.parse(localStorage.getItem('studySessions') || '[]');
        const userSessions = sessionsRaw.filter(s => s.userId === user.id);
        if (userSessions.length === 0) {
            const seededTasks = this.getTasks();
            if (seededTasks.length > 0) {
                const pick = (i) => seededTasks[i % seededTasks.length];
                const sess = [
                    { task: pick(0), minutes: 60 },
                    { task: pick(1), minutes: 45 },
                    { task: pick(2), minutes: 90 },
                ];
                const all = [...sessionsRaw];
                sess.forEach(s => {
                    all.push({
                        id: Date.now() + Math.floor(Math.random() * 10000),
                        userId: user.id,
                        taskId: s.task.id,
                        startTime: new Date().toISOString(),
                        endTime: new Date(Date.now() + s.minutes * 60000).toISOString(),
                        actualDuration: s.minutes,
                        qualityRating: 4,
                        notes: 'Demo session'
                    });
                });
                localStorage.setItem('studySessions', JSON.stringify(all));
            }
        }
    }

    getCourses() {
        const user = this.getCurrentUser();
        if (!user) return [];
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        return courses.filter(c => c.userId === user.id);
    }

    addCourse(courseData) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Please log in first' };

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const newCourse = {
            id: Date.now(),
            userId: user.id,
            courseName: courseData.courseName,
            difficultyLevel: parseInt(courseData.difficultyLevel),
            estimatedHoursPerWeek: parseInt(courseData.estimatedHoursPerWeek),
            currentGrade: parseFloat(courseData.currentGrade) || 0,
            createdAt: new Date().toISOString()
        };
        courses.push(newCourse);
        localStorage.setItem('courses', JSON.stringify(courses));
        return { success: true, message: 'Course added successfully', course: newCourse };
    }

    updateCourse(courseId, updates) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const index = courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            courses[index] = { ...courses[index], ...updates };
            localStorage.setItem('courses', JSON.stringify(courses));
            return { success: true, message: 'Course updated successfully' };
        }
        return { success: false, message: 'Course not found' };
    }

    deleteCourse(courseId) {
        let courses = JSON.parse(localStorage.getItem('courses') || '[]');
        courses = courses.filter(c => c.id !== courseId);
        localStorage.setItem('courses', JSON.stringify(courses));

        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(t => t.courseId !== courseId);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        return { success: true, message: 'Course deleted successfully' };
    }

    getTasks(filter = 'all') {
        const user = this.getCurrentUser();
        if (!user) return [];
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const courses = this.getCourses();
        const courseIds = courses.map(c => c.id);
        let userTasks = tasks.filter(t => courseIds.includes(t.courseId));
        if (filter !== 'all') {
            userTasks = userTasks.filter(t => t.status === filter);
        }
        return userTasks;
    }

    addTask(taskData) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Please log in first' };

        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const courses = this.getCourses();
        const course = courses.find(c => c.id === parseInt(taskData.courseId));
        if (!course) {
            return { success: false, message: 'Course not found' };
        }
        const newTask = {
            id: Date.now(),
            courseId: parseInt(taskData.courseId),
            courseName: course.courseName,
            taskName: taskData.taskName,
            description: taskData.description || '',
            deadline: taskData.deadline,
            estimatedHours: parseFloat(taskData.estimatedHours),
            priorityScore: 0,
            status: 'pending',
            completionPercentage: 0,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        return { success: true, message: 'Task added successfully', task: newTask };
    }

    updateTask(taskId, updates) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            localStorage.setItem('tasks', JSON.stringify(tasks));
            return { success: true, message: 'Task updated successfully', task: tasks[index] };
        }
        return { success: false, message: 'Task not found' };
    }

    deleteTask(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        return { success: true, message: 'Task deleted successfully' };
    }

    addStudySession(sessionData) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Please log in first' };
        const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        const newSession = {
            id: Date.now(),
            userId: user.id,
            taskId: sessionData.taskId,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            actualDuration: sessionData.actualDuration,
            qualityRating: sessionData.qualityRating || 3,
            notes: sessionData.notes || ''
        };
        sessions.push(newSession);
        localStorage.setItem('studySessions', JSON.stringify(sessions));
        return { success: true, message: 'Study session added successfully', session: newSession };
    }

    getStudySessions() {
        const user = this.getCurrentUser();
        if (!user) return [];
        const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        return sessions.filter(s => s.userId === user.id);
    }

    getStats() {
        const tasks = this.getTasks();
        const courses = this.getCourses();
        const sessions = this.getStudySessions();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const totalStudyTime = sessions.reduce((sum, s) => sum + s.actualDuration, 0);
        return {
            totalCourses: courses.length,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
            totalStudyHours: (totalStudyTime / 60).toFixed(1)
        };
    }
}

const storage = new StorageManager();

