# Smart Study Planner

Smart Study Planner is a lightweight web app that helps students plan studies, prioritize tasks intelligently, and track progress — all in the browser using localStorage.

## Features
- Smart prioritization using deadlines, difficulty, progress, performance
- Daily schedule based on preferred time (morning/afternoon/evening)
- Urgent/overdue insights and recommendations
- Progress tracking and simple charts
- Manage courses and tasks with priority scores

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Chart.js for charts
- localStorage for persistence

## Getting Started
1. Place the folder at `C:\xampp\htdocs\smart-study-planner` (or your web root).
2. Open `http://localhost/smart-study-planner/index.html` in a browser.

## Structure
```
smart-study-planner/
  index.html          # Landing
  login.html          # Login
  register.html       # Register
  dashboard.html      # Dashboard
  courses.html        # Courses
  tasks.html          # Tasks
  assets/
    css/style.css     # Styles
    js/
      auth.js         # Auth + seeding
      storage.js      # Data layer (localStorage)
      ai-algorithms.js# AI priority + scheduling
      dashboard.js    # Dashboard logic
      courses.js      # Courses page
      tasks.js        # Tasks page
```

## AI Overview
- Priority Score = weighted sum (deadline, difficulty, progress, performance)
- Time Allocation distributes available hours by priority
- Daily Schedule builds 1.5h sessions with 15m breaks
- Recommendations highlight overdue/urgent tasks and difficult courses

## Notes
- Keep estimates realistic; update progress regularly
- Chart.js must be available to render charts

## License
Open source for educational use. Customize freely.

Author: [Your Name] • Version: 1.0.0

