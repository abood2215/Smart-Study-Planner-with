-- ============================================
-- Smart Study Planner - Complete Test Data
-- Database: smart_study_planner2
-- ============================================

USE smart_study_planner2;

-- Clear existing data (in correct order to avoid FK constraints)
-- Disable foreign key checks to allow truncation
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- Delete data in reverse dependency order
DELETE FROM progress_logs;
DELETE FROM schedules;
DELETE FROM tasks;
DELETE FROM courses;
DELETE FROM user_preferences;
DELETE FROM users;

-- Reset auto-increment counters
ALTER TABLE progress_logs AUTO_INCREMENT = 1;
ALTER TABLE schedules AUTO_INCREMENT = 1;
ALTER TABLE tasks AUTO_INCREMENT = 1;
ALTER TABLE courses AUTO_INCREMENT = 1;
ALTER TABLE user_preferences AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

-- ============================================
-- TEST USER ACCOUNTS
-- ============================================
-- Password for all test users: "password123"
-- Hash generated using: password_hash('password123', PASSWORD_DEFAULT)

INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'John Smith', 'john@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-01 08:00:00'),
(2, 'Sarah Johnson', 'sarah@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-02 09:00:00'),
(3, 'Michael Chen', 'michael@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-03 10:00:00'),
(4, 'Emma Davis', 'emma@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-04 11:00:00'),
(5, 'Admin User', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-01 07:00:00');

-- ============================================
-- USER PREFERENCES
-- ============================================
INSERT INTO user_preferences (user_id, preferred_study_time, daily_study_hours, break_duration_minutes, session_duration_minutes, timezone) VALUES
(1, 'morning', 6.0, 15, 90, 'America/New_York'),
(2, 'afternoon', 5.0, 10, 60, 'America/Los_Angeles'),
(3, 'evening', 4.0, 20, 120, 'Europe/London'),
(4, 'night', 5.5, 15, 90, 'Asia/Tokyo'),
(5, 'morning', 8.0, 15, 90, 'UTC');

-- ============================================
-- COURSES - Multiple Subjects for User 1 (John)
-- ============================================
INSERT INTO courses (id, user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
-- Computer Science Courses
(1, 1, 'Data Structures & Algorithms', 'hard', 120.00, 45.00, 37.50, 85.00, '2024-01-05 09:00:00'),
(2, 1, 'Web Development', 'medium', 80.00, 60.00, 75.00, 90.00, '2024-01-05 09:30:00'),
(3, 1, 'Database Management Systems', 'hard', 100.00, 30.00, 30.00, 78.00, '2024-01-05 10:00:00'),
(4, 1, 'Machine Learning', 'hard', 150.00, 25.00, 16.67, 82.00, '2024-01-06 09:00:00'),
(5, 1, 'Operating Systems', 'hard', 90.00, 40.00, 44.44, 88.00, '2024-01-06 10:00:00'),

-- Mathematics Courses
(6, 1, 'Linear Algebra', 'hard', 80.00, 50.00, 62.50, 75.00, '2024-01-07 09:00:00'),
(7, 1, 'Calculus III', 'hard', 100.00, 35.00, 35.00, 80.00, '2024-01-07 10:00:00'),
(8, 1, 'Discrete Mathematics', 'medium', 70.00, 55.00, 78.57, 92.00, '2024-01-08 09:00:00'),

-- Science Courses
(9, 1, 'Physics II', 'hard', 90.00, 40.00, 44.44, 85.00, '2024-01-08 10:00:00'),
(10, 1, 'Chemistry', 'medium', 75.00, 45.00, 60.00, 88.00, '2024-01-09 09:00:00');

-- ============================================
-- COURSES - For User 2 (Sarah)
-- ============================================
INSERT INTO courses (user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
(2, 'Business Analytics', 'medium', 60.00, 40.00, 66.67, 88.00, '2024-01-10 09:00:00'),
(2, 'Marketing Strategy', 'easy', 50.00, 35.00, 70.00, 92.00, '2024-01-10 10:00:00'),
(2, 'Financial Accounting', 'medium', 80.00, 50.00, 62.50, 85.00, '2024-01-11 09:00:00'),
(2, 'Project Management', 'easy', 40.00, 30.00, 75.00, 90.00, '2024-01-11 10:00:00'),
(2, 'Economics', 'medium', 70.00, 45.00, 64.29, 87.00, '2024-01-12 09:00:00');

-- ============================================
-- COURSES - For User 3 (Michael)
-- ============================================
INSERT INTO courses (user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
(3, 'Human Anatomy', 'hard', 120.00, 60.00, 50.00, 83.00, '2024-01-13 09:00:00'),
(3, 'Biochemistry', 'hard', 100.00, 45.00, 45.00, 80.00, '2024-01-13 10:00:00'),
(3, 'Medical Microbiology', 'hard', 90.00, 40.00, 44.44, 78.00, '2024-01-14 09:00:00'),
(3, 'Pharmacology', 'hard', 110.00, 30.00, 27.27, 75.00, '2024-01-14 10:00:00'),
(3, 'Pathology', 'hard', 95.00, 35.00, 36.84, 82.00, '2024-01-15 09:00:00');

-- ============================================
-- TASKS - For John's Courses (User 1)
-- ============================================
INSERT INTO tasks (user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
-- Data Structures & Algorithms Tasks
(1, 1, 'Binary Tree Assignment', 'Implement AVL tree with insertion, deletion, and balancing', '2025-01-10', 'hard', 8.00, 6.00, 75.00, 85.00, 'in_progress', '2024-12-20 09:00:00'),
(1, 1, 'Graph Algorithms Project', 'Implement Dijkstra and A* pathfinding algorithms', '2025-01-15', 'hard', 12.00, 8.00, 66.67, 90.00, 'in_progress', '2024-12-22 10:00:00'),
(1, 1, 'Dynamic Programming Problems', 'Solve 20 DP problems on LeetCode', '2025-01-08', 'hard', 15.00, 12.00, 80.00, 95.00, 'in_progress', '2024-12-25 11:00:00'),
(1, 1, 'Sorting Algorithm Analysis', 'Compare time complexity of different sorting algorithms', '2025-01-20', 'medium', 6.00, 0.00, 0.00, 70.00, 'pending', '2024-12-28 09:00:00'),

-- Web Development Tasks
(1, 2, 'E-commerce Website Frontend', 'Build responsive frontend with React', '2025-01-12', 'medium', 20.00, 15.00, 75.00, 80.00, 'in_progress', '2024-12-18 10:00:00'),
(1, 2, 'REST API Development', 'Create RESTful API with Node.js and Express', '2025-01-18', 'medium', 15.00, 10.00, 66.67, 75.00, 'in_progress', '2024-12-20 11:00:00'),
(1, 2, 'Database Integration', 'Connect frontend to MongoDB database', '2025-01-25', 'medium', 10.00, 0.00, 0.00, 65.00, 'pending', '2024-12-23 09:00:00'),
(1, 2, 'Authentication System', 'Implement JWT-based authentication', '2025-02-01', 'hard', 12.00, 0.00, 0.00, 60.00, 'pending', '2024-12-25 10:00:00'),

-- Database Management Tasks
(1, 3, 'SQL Query Optimization', 'Optimize slow queries in the university database', '2025-01-14', 'hard', 8.00, 4.00, 50.00, 85.00, 'in_progress', '2024-12-19 09:00:00'),
(1, 3, 'Database Design Project', 'Design normalized database for library system', '2025-01-22', 'hard', 10.00, 2.00, 20.00, 80.00, 'in_progress', '2024-12-21 10:00:00'),
(1, 3, 'NoSQL vs SQL Comparison', 'Write research paper comparing MongoDB and PostgreSQL', '2025-01-30', 'medium', 12.00, 0.00, 0.00, 55.00, 'pending', '2024-12-24 11:00:00'),

-- Machine Learning Tasks
(1, 4, 'Linear Regression Model', 'Build and train linear regression model on housing data', '2025-01-16', 'medium', 10.00, 7.00, 70.00, 78.00, 'in_progress', '2024-12-20 12:00:00'),
(1, 4, 'Neural Network Assignment', 'Implement feedforward neural network from scratch', '2025-01-28', 'hard', 18.00, 5.00, 27.78, 88.00, 'in_progress', '2024-12-22 13:00:00'),
(1, 4, 'Image Classification Project', 'Build CNN for CIFAR-10 dataset classification', '2025-02-05', 'hard', 25.00, 0.00, 0.00, 70.00, 'pending', '2024-12-26 09:00:00'),

-- Operating Systems Tasks
(1, 5, 'Process Scheduling Simulation', 'Simulate FCFS, SJF, and Round Robin algorithms', '2025-01-11', 'hard', 10.00, 8.00, 80.00, 92.00, 'in_progress', '2024-12-19 14:00:00'),
(1, 5, 'Memory Management Assignment', 'Implement page replacement algorithms', '2025-01-19', 'hard', 12.00, 4.00, 33.33, 85.00, 'in_progress', '2024-12-21 15:00:00'),
(1, 5, 'File System Design', 'Design and implement simple file system', '2025-02-02', 'hard', 15.00, 0.00, 0.00, 65.00, 'pending', '2024-12-25 14:00:00'),

-- Linear Algebra Tasks
(1, 6, 'Matrix Operations Practice', 'Complete 50 matrix calculation problems', '2025-01-09', 'medium', 8.00, 6.00, 75.00, 88.00, 'in_progress', '2024-12-20 16:00:00'),
(1, 6, 'Eigenvalues Assignment', 'Find eigenvalues and eigenvectors for 20 matrices', '2025-01-17', 'hard', 10.00, 3.00, 30.00, 82.00, 'in_progress', '2024-12-23 09:00:00'),
(1, 6, 'Linear Transformations', 'Prove properties of linear transformations', '2025-01-26', 'hard', 12.00, 0.00, 0.00, 60.00, 'pending', '2024-12-26 10:00:00'),

-- Calculus Tasks
(1, 7, 'Multivariable Integration', 'Solve triple integrals and volume problems', '2025-01-13', 'hard', 9.00, 5.00, 55.56, 80.00, 'in_progress', '2024-12-21 11:00:00'),
(1, 7, 'Vector Calculus Assignment', 'Calculate gradient, divergence, and curl', '2025-01-21', 'hard', 11.00, 2.00, 18.18, 75.00, 'in_progress', '2024-12-24 12:00:00'),
(1, 7, 'Stokes Theorem Problems', 'Apply Stokes and Greens theorem to solve problems', '2025-01-29', 'hard', 10.00, 0.00, 0.00, 58.00, 'pending', '2024-12-27 09:00:00'),

-- Discrete Mathematics Tasks
(1, 8, 'Graph Theory Assignment', 'Prove theorems about planar graphs and colorings', '2025-01-07', 'medium', 7.00, 7.00, 100.00, 95.00, 'completed', '2024-12-15 10:00:00'),
(1, 8, 'Combinatorics Problems', 'Solve permutation and combination problems', '2025-01-15', 'medium', 6.00, 4.00, 66.67, 85.00, 'in_progress', '2024-12-22 11:00:00'),
(1, 8, 'Number Theory Quiz Prep', 'Study modular arithmetic and prime numbers', '2025-01-24', 'easy', 5.00, 0.00, 0.00, 65.00, 'pending', '2024-12-25 12:00:00'),

-- Physics Tasks
(1, 9, 'Electromagnetism Lab Report', 'Write lab report on Faradays law experiment', '2025-01-10', 'medium', 8.00, 5.00, 62.50, 80.00, 'in_progress', '2024-12-20 13:00:00'),
(1, 9, 'Quantum Mechanics Problems', 'Solve Schrodinger equation for various potentials', '2025-01-18', 'hard', 12.00, 3.00, 25.00, 85.00, 'in_progress', '2024-12-23 14:00:00'),
(1, 9, 'Optics Midterm Preparation', 'Study wave optics and interference patterns', '2025-01-27', 'medium', 10.00, 0.00, 0.00, 70.00, 'pending', '2024-12-26 11:00:00'),

-- Chemistry Tasks
(1, 10, 'Organic Chemistry Reactions', 'Memorize 50 organic reaction mechanisms', '2025-01-12', 'medium', 9.00, 6.00, 66.67, 82.00, 'in_progress', '2024-12-21 15:00:00'),
(1, 10, 'Titration Lab Experiment', 'Perform acid-base titration and analyze results', '2025-01-20', 'easy', 6.00, 4.00, 66.67, 90.00, 'in_progress', '2024-12-24 16:00:00'),
(1, 10, 'Chemical Bonding Quiz', 'Prepare for quiz on molecular orbital theory', '2025-01-31', 'medium', 7.00, 0.00, 0.00, 55.00, 'pending', '2024-12-27 10:00:00');

-- ============================================
-- TASKS - For Sarah's Courses (User 2)
-- ============================================
INSERT INTO tasks (user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
-- Business Analytics Tasks
(2, 11, 'Data Visualization Dashboard', 'Create interactive Tableau dashboard for sales data', '2025-01-11', 'medium', 10.00, 7.00, 70.00, 85.00, 'in_progress', '2024-12-20 09:00:00'),
(2, 11, 'Predictive Analytics Report', 'Build forecasting model for customer churn', '2025-01-19', 'hard', 15.00, 5.00, 33.33, 80.00, 'in_progress', '2024-12-22 10:00:00'),
(2, 11, 'SQL Data Analysis', 'Analyze 5-year sales trends using SQL', '2025-01-28', 'medium', 8.00, 0.00, 0.00, 65.00, 'pending', '2024-12-25 11:00:00'),

-- Marketing Strategy Tasks
(2, 12, 'Social Media Campaign Plan', 'Design comprehensive social media marketing strategy', '2025-01-13', 'easy', 8.00, 6.00, 75.00, 78.00, 'in_progress', '2024-12-21 12:00:00'),
(2, 12, 'Market Research Analysis', 'Conduct competitor analysis and SWOT', '2025-01-21', 'easy', 10.00, 5.00, 50.00, 75.00, 'in_progress', '2024-12-23 13:00:00'),
(2, 12, 'Brand Positioning Strategy', 'Develop brand positioning for new product launch', '2025-02-01', 'medium', 12.00, 0.00, 0.00, 60.00, 'pending', '2024-12-26 09:00:00'),

-- Financial Accounting Tasks
(2, 13, 'Balance Sheet Preparation', 'Prepare balance sheet for ABC Corporation', '2025-01-15', 'medium', 7.00, 5.00, 71.43, 88.00, 'in_progress', '2024-12-22 14:00:00'),
(2, 13, 'Cash Flow Statement', 'Create cash flow statement with adjustments', '2025-01-23', 'medium', 9.00, 3.00, 33.33, 82.00, 'in_progress', '2024-12-24 15:00:00'),
(2, 13, 'Financial Ratio Analysis', 'Calculate and interpret key financial ratios', '2025-02-03', 'easy', 6.00, 0.00, 0.00, 58.00, 'pending', '2024-12-27 11:00:00'),

-- Project Management Tasks
(2, 14, 'Project Charter Development', 'Create project charter for IT implementation', '2025-01-09', 'easy', 5.00, 5.00, 100.00, 92.00, 'completed', '2024-12-18 10:00:00'),
(2, 14, 'Gantt Chart Creation', 'Build detailed Gantt chart for 6-month project', '2025-01-17', 'easy', 6.00, 4.00, 66.67, 80.00, 'in_progress', '2024-12-23 11:00:00'),
(2, 14, 'Risk Management Plan', 'Identify and mitigate project risks', '2025-01-26', 'medium', 8.00, 0.00, 0.00, 70.00, 'pending', '2024-12-26 12:00:00'),

-- Economics Tasks
(2, 15, 'Macroeconomics Essay', 'Write essay on fiscal vs monetary policy', '2025-01-14', 'medium', 10.00, 6.00, 60.00, 83.00, 'in_progress', '2024-12-21 16:00:00'),
(2, 15, 'Supply and Demand Analysis', 'Analyze market equilibrium for various scenarios', '2025-01-22', 'easy', 7.00, 3.00, 42.86, 78.00, 'in_progress', '2024-12-24 09:00:00'),
(2, 15, 'Game Theory Problems', 'Solve Nash equilibrium and dominant strategy problems', '2025-02-02', 'hard', 9.00, 0.00, 0.00, 62.00, 'pending', '2024-12-27 12:00:00');

-- ============================================
-- TASKS - For Michael's Courses (User 3)
-- ============================================
INSERT INTO tasks (user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
-- Human Anatomy Tasks
(3, 16, 'Skeletal System Study', 'Memorize all 206 bones and their features', '2025-01-10', 'hard', 12.00, 9.00, 75.00, 90.00, 'in_progress', '2024-12-19 09:00:00'),
(3, 16, 'Muscular System Lab', 'Complete cadaver lab on major muscle groups', '2025-01-18', 'hard', 10.00, 6.00, 60.00, 85.00, 'in_progress', '2024-12-22 10:00:00'),
(3, 16, 'Nervous System Exam Prep', 'Study brain anatomy and cranial nerves', '2025-01-25', 'hard', 15.00, 0.00, 0.00, 78.00, 'pending', '2024-12-25 11:00:00'),

-- Biochemistry Tasks
(3, 17, 'Enzyme Kinetics Assignment', 'Calculate Km and Vmax for enzyme reactions', '2025-01-12', 'hard', 9.00, 6.00, 66.67, 88.00, 'in_progress', '2024-12-20 12:00:00'),
(3, 17, 'Metabolism Pathways', 'Map out glycolysis, TCA cycle, and ETC', '2025-01-20', 'hard', 12.00, 4.00, 33.33, 82.00, 'in_progress', '2024-12-23 13:00:00'),
(3, 17, 'Protein Structure Analysis', 'Analyze primary to quaternary protein structures', '2025-01-29', 'hard', 10.00, 0.00, 0.00, 65.00, 'pending', '2024-12-26 14:00:00'),

-- Medical Microbiology Tasks
(3, 18, 'Bacterial Identification Lab', 'Identify unknown bacteria using gram staining', '2025-01-14', 'medium', 8.00, 5.00, 62.50, 80.00, 'in_progress', '2024-12-21 15:00:00'),
(3, 18, 'Virology Case Studies', 'Analyze 10 viral infection case studies', '2025-01-22', 'hard', 11.00, 3.00, 27.27, 75.00, 'in_progress', '2024-12-24 16:00:00'),
(3, 18, 'Antibiotic Resistance Research', 'Research paper on MRSA and resistance mechanisms', '2025-02-01', 'hard', 14.00, 0.00, 0.00, 60.00, 'pending', '2024-12-27 09:00:00'),

-- Pharmacology Tasks
(3, 19, 'Drug Mechanism Study', 'Learn mechanisms of action for 100 common drugs', '2025-01-16', 'hard', 16.00, 8.00, 50.00, 85.00, 'in_progress', '2024-12-22 10:00:00'),
(3, 19, 'Pharmacokinetics Problems', 'Calculate drug dosing and half-life problems', '2025-01-24', 'hard', 10.00, 3.00, 30.00, 80.00, 'in_progress', '2024-12-25 11:00:00'),
(3, 19, 'Clinical Case Analysis', 'Analyze drug interactions in patient cases', '2025-02-04', 'hard', 12.00, 0.00, 0.00, 58.00, 'pending', '2024-12-28 12:00:00'),

-- Pathology Tasks
(3, 20, 'Disease Process Study', 'Study pathophysiology of major diseases', '2025-01-11', 'hard', 13.00, 9.00, 69.23, 88.00, 'in_progress', '2024-12-20 13:00:00'),
(3, 20, 'Histology Slide Review', 'Identify tissues in 50 microscope slides', '2025-01-19', 'hard', 11.00, 5.00, 45.45, 83.00, 'in_progress', '2024-12-23 14:00:00'),
(3, 20, 'Cancer Biology Assignment', 'Research oncogenes and tumor suppressor genes', '2025-01-28', 'hard', 14.00, 0.00, 0.00, 62.00, 'pending', '2024-12-26 15:00:00');

-- ============================================
-- SCHEDULES - Study sessions for upcoming week (uses dynamic dates)
-- ============================================
INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status, created_at) VALUES
-- John's Schedule (User 1) - TODAY and next few days
(1, 1, CURDATE(), '09:00:00', '11:00:00', 120, 'scheduled', NOW()),
(1, 2, CURDATE(), '14:00:00', '16:30:00', 150, 'scheduled', NOW()),
(1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:30:00', 150, 'scheduled', NOW()),
(1, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 120, 'scheduled', NOW()),
(1, 8, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '10:30:00', 90, 'scheduled', NOW()),
(1, 11, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00', '16:00:00', 120, 'scheduled', NOW()),
(1, 13, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', '11:00:00', 120, 'scheduled', NOW()),
(1, 15, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '14:00:00', '15:30:00', 90, 'scheduled', NOW()),
(1, 17, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '09:00:00', '11:00:00', 120, 'scheduled', NOW()),
(1, 20, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '14:00:00', '16:30:00', 150, 'scheduled', NOW()),

-- Sarah's Schedule (User 2) - TODAY and next few days
(2, 31, CURDATE(), '10:00:00', '12:00:00', 120, 'scheduled', NOW()),
(2, 34, CURDATE(), '15:00:00', '17:00:00', 120, 'scheduled', NOW()),
(2, 37, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:30:00', 90, 'scheduled', NOW()),
(2, 41, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', '17:00:00', 120, 'scheduled', NOW()),
(2, 32, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', '12:30:00', 150, 'scheduled', NOW()),
(2, 35, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00:00', '17:00:00', 120, 'scheduled', NOW()),

-- Michael's Schedule (User 3) - TODAY and next few days
(3, 44, CURDATE(), '11:00:00', '13:00:00', 120, 'scheduled', NOW()),
(3, 47, CURDATE(), '16:00:00', '18:00:00', 120, 'scheduled', NOW()),
(3, 50, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '13:30:00', 150, 'scheduled', NOW()),
(3, 53, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', '18:00:00', 120, 'scheduled', NOW()),
(3, 56, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', '13:00:00', 120, 'scheduled', NOW()),
(3, 45, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', '17:30:00', 90, 'scheduled', NOW());

-- ============================================
-- PROGRESS LOGS - Historical learning data
-- ============================================
INSERT INTO progress_logs (user_id, task_id, hours_logged, progress_percentage, notes, logged_at) VALUES
-- John's Progress Logs
(1, 1, 2.00, 25.00, 'Completed tree traversal algorithms', '2024-12-28 10:00:00'),
(1, 1, 2.50, 50.00, 'Implemented insertion and deletion', '2024-12-29 11:00:00'),
(1, 1, 1.50, 75.00, 'Working on balancing logic', '2024-12-30 09:00:00'),
(1, 2, 3.00, 25.00, 'Set up graph data structure', '2024-12-27 14:00:00'),
(1, 2, 3.00, 50.00, 'Implemented Dijkstra algorithm', '2024-12-29 15:00:00'),
(1, 2, 2.00, 66.67, 'Started A* implementation', '2024-12-31 10:00:00'),
(1, 3, 5.00, 33.33, 'Solved first 7 DP problems', '2024-12-26 16:00:00'),
(1, 3, 4.00, 60.00, 'Completed 12 problems total', '2024-12-28 17:00:00'),
(1, 3, 3.00, 80.00, 'Finished 16 problems', '2024-12-30 18:00:00'),

-- Sarah's Progress Logs
(2, 31, 2.50, 35.00, 'Created initial dashboard layout', '2024-12-27 11:00:00'),
(2, 31, 2.50, 55.00, 'Added interactive charts', '2024-12-29 12:00:00'),
(2, 31, 2.00, 70.00, 'Implemented filters and drill-down', '2024-12-31 13:00:00'),
(2, 34, 3.00, 37.50, 'Completed social media audit', '2024-12-28 14:00:00'),
(2, 34, 3.00, 75.00, 'Drafted campaign strategy', '2024-12-30 15:00:00'),

-- Michael's Progress Logs
(3, 44, 3.00, 25.00, 'Studied axial skeleton', '2024-12-27 12:00:00'),
(3, 44, 3.00, 50.00, 'Learned appendicular skeleton', '2024-12-29 13:00:00'),
(3, 44, 3.00, 75.00, 'Reviewed bone markings and features', '2024-12-31 14:00:00'),
(3, 47, 2.00, 22.22, 'Studied enzyme basics', '2024-12-28 15:00:00'),
(3, 47, 2.50, 44.44, 'Learned Michaelis-Menten kinetics', '2024-12-30 16:00:00'),
(3, 47, 1.50, 66.67, 'Practiced calculation problems', '2024-12-31 17:00:00');

-- ============================================
-- SUMMARY
-- ============================================
-- Total Users: 5
-- Total Courses: 20 (10 for John, 5 for Sarah, 5 for Michael)
-- Total Tasks: 60+ (35 for John, 15 for Sarah, 15 for Michael)
-- Total Schedules: 22 (upcoming week)
-- Total Progress Logs: 17 (historical data)
--
-- Test Credentials:
-- Email: john@test.com    | Password: password123 | Profile: Computer Science Student
-- Email: sarah@test.com   | Password: password123 | Profile: Business Student
-- Email: michael@test.com | Password: password123 | Profile: Medical Student
-- Email: emma@test.com    | Password: password123 | Profile: General User
-- Email: admin@test.com   | Password: password123 | Profile: Administrator
-- ============================================

SELECT 'Test data loaded successfully!' AS Status;
SELECT COUNT(*) AS 'Total Users' FROM users;
SELECT COUNT(*) AS 'Total Courses' FROM courses;
SELECT COUNT(*) AS 'Total Tasks' FROM tasks;
SELECT COUNT(*) AS 'Total Schedules' FROM schedules;
SELECT COUNT(*) AS 'Total Progress Logs' FROM progress_logs;
