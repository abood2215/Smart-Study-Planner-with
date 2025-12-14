-- ============================================
-- Smart Study Planner - Complete Database Setup
-- ============================================
-- This file contains everything needed to create a complete database
-- Just import this file in phpMyAdmin or run: mysql -u root < smart_study_planner2_complete.sql
-- Password for test users: password123

-- Create database
CREATE DATABASE IF NOT EXISTS smart_study_planner2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_study_planner2;

-- Drop existing tables if you want a fresh import (uncomment if needed)
-- DROP TABLE IF EXISTS progress_logs;
-- DROP TABLE IF EXISTS schedules;
-- DROP TABLE IF EXISTS tasks;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS user_preferences;
-- DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    total_hours DECIMAL(5,2) DEFAULT 0,
    completed_hours DECIMAL(5,2) DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0 COMMENT 'Progress percentage 0-100',
    performance DECIMAL(5,2) DEFAULT 0 COMMENT 'Performance score 0-100',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline DATE NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    estimated_hours DECIMAL(5,2) DEFAULT 1,
    completed_hours DECIMAL(5,2) DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0 COMMENT 'Progress percentage 0-100',
    priority_score DECIMAL(5,2) DEFAULT 0 COMMENT 'AI calculated priority',
    status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_deadline (deadline),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('scheduled', 'completed', 'missed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, scheduled_date),
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    preferred_study_time ENUM('morning', 'afternoon', 'evening', 'night') DEFAULT 'morning',
    daily_study_hours DECIMAL(4,2) DEFAULT 4.0,
    break_duration_minutes INT DEFAULT 15,
    session_duration_minutes INT DEFAULT 90,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROGRESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS progress_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    hours_logged DECIMAL(5,2) NOT NULL,
    progress_percentage DECIMAL(5,2) NOT NULL,
    notes TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_user_task (user_id, task_id),
    INDEX idx_logged_at (logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT TEST USERS
-- ============================================
-- Password for both: password123 (hashed with bcrypt)

INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'أحمد محمد', 'ahmad@test.com', '$2y$10$8LhO6mRMejtVKF0DMAMOUuTOWSTaA5JQB7IK0wLAegbBse1LT6HUi', '2025-12-01 10:00:00'),
(2, 'فاطمة علي', 'fatima@test.com', '$2y$10$8LhO6mRMejtVKF0DMAMOUuTOWSTaA5JQB7IK0wLAegbBse1LT6HUi', '2025-12-02 11:00:00'),
(3, 'John Smith', 'john@test.com', '$2y$10$8LhO6mRMejtVKF0DMAMOUuTOWSTaA5JQB7IK0wLAegbBse1LT6HUi', '2025-12-03 12:00:00');

-- ============================================
-- INSERT USER PREFERENCES
-- ============================================

INSERT INTO user_preferences (user_id, preferred_study_time, daily_study_hours, break_duration_minutes, session_duration_minutes, timezone) VALUES
(1, 'morning', 5.0, 15, 90, 'UTC+3'),
(2, 'evening', 4.5, 10, 120, 'UTC+3'),
(3, 'afternoon', 4.0, 20, 90, 'UTC');

-- ============================================
-- INSERT COURSES - User 1: أحمد (4 courses)
-- ============================================

INSERT INTO courses (id, user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
(1, 1, 'برمجة PHP المتقدمة', 'hard', 40, 32, 80, 85, '2025-11-01 09:00:00'),
(2, 1, 'قواعد البيانات SQL', 'medium', 30, 24, 80, 80, '2025-11-05 10:00:00'),
(3, 1, 'تطوير الويب الحديث', 'hard', 50, 35, 70, 75, '2025-11-10 14:00:00'),
(4, 1, 'بناء REST APIs', 'medium', 25, 15, 60, 70, '2025-11-15 11:00:00');

-- ============================================
-- INSERT COURSES - User 2: فاطمة (3 courses)
-- ============================================

INSERT INTO courses (id, user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
(5, 2, 'JavaScript من الصفر', 'easy', 35, 28, 80, 82, '2025-11-03 08:00:00'),
(6, 2, 'React.js الأساسيات', 'medium', 40, 25, 62.5, 78, '2025-11-08 15:00:00'),
(7, 2, 'تصميم CSS متقدم', 'medium', 30, 18, 60, 75, '2025-11-12 09:00:00'),
(8, 3, 'Python Programming Basics', 'easy', 40, 32, 80, 85, '2025-11-04 09:00:00'),
(9, 3, 'Machine Learning Fundamentals', 'hard', 50, 30, 60, 70, '2025-11-09 14:00:00'),
(10, 3, 'Data Analysis with Pandas', 'medium', 35, 24, 68.57, 72, '2025-11-14 10:00:00'),
(11, 3, 'Web Development with Django', 'medium', 45, 28, 62.22, 68, '2025-11-18 11:00:00');

-- ============================================
-- INSERT TASKS - User 1: أحمد
-- ============================================

INSERT INTO tasks (id, user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
(1, 1, 1, 'دراسة PHP OOP', 'فهم Inheritance و Polymorphism', '2025-12-20', 'hard', 6, 5.5, 92, 45.2, 'in_progress', '2025-11-20 10:00:00'),
(2, 1, 1, 'عمل مشروع CRUD بـ PHP', 'بناء تطبيق CRUD كامل', '2025-12-22', 'hard', 8, 4, 50, 48.5, 'in_progress', '2025-11-22 11:00:00'),
(3, 1, 1, 'اختبار PHP (PHPUnit)', 'كتابة unit tests', '2025-12-25', 'medium', 4, 0, 0, 52.1, 'pending', '2025-11-25 09:00:00'),
(4, 1, 2, 'تصميم Schema قاعدة البيانات', 'رسم ERD وعمل الجداول', '2025-12-18', 'medium', 5, 5, 100, 35.8, 'completed', '2025-11-18 14:00:00'),
(5, 1, 2, 'كتابة Queries معقدة', 'Joins, Subqueries, Aggregates', '2025-12-21', 'hard', 6, 5, 83, 42.3, 'in_progress', '2025-11-21 10:00:00'),
(6, 1, 3, 'بناء واجهة مستخدم بـ HTML/CSS', 'تصميم صفحات responsive', '2025-12-19', 'medium', 7, 5, 71, 40.1, 'in_progress', '2025-11-19 09:00:00'),
(7, 1, 3, 'إضافة JavaScript التفاعلي', 'DOM Manipulation و Event Listeners', '2025-12-24', 'medium', 5, 0, 0, 50.5, 'pending', '2025-11-24 15:00:00'),
(8, 1, 4, 'تصميم API Endpoints', 'تحديد routes و parameters', '2025-12-17', 'medium', 4, 3, 75, 38.2, 'in_progress', '2025-11-17 11:00:00'),
(9, 1, 4, 'عمل Authentication', 'JWT implementation', '2025-12-23', 'hard', 5, 2, 40, 48.9, 'in_progress', '2025-11-23 10:00:00');

-- ============================================
-- INSERT TASKS - User 2: فاطمة
-- ============================================

INSERT INTO tasks (id, user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
(10, 2, 5, 'تعلم البيانات الأساسية في JS', 'Variables, Types, Operators', '2025-12-16', 'easy', 3, 3, 100, 20.5, 'completed', '2025-11-16 08:00:00'),
(11, 2, 5, 'DOM Manipulation', 'querySelector, addEventListener', '2025-12-20', 'easy', 4, 3, 75, 30.2, 'in_progress', '2025-11-20 09:00:00'),
(12, 2, 6, 'دراسة Components و Props', 'Functional Components', '2025-12-21', 'medium', 5, 2, 40, 45.1, 'in_progress', '2025-11-21 15:00:00'),
(13, 2, 6, 'شرح Hooks (useState, useEffect)', 'State Management', '2025-12-25', 'medium', 6, 0, 0, 50.3, 'pending', '2025-11-25 10:00:00'),
(14, 2, 7, 'Flexbox و Grid', 'Layout Systems', '2025-12-19', 'medium', 4, 3.5, 87.5, 35.6, 'in_progress', '2025-12-19 14:00:00'),
(15, 2, 7, 'Animations و Transitions', 'CSS Effects', '2025-12-26', 'medium', 4, 0, 0, 51.2, 'pending', '2025-12-26 09:00:00'),
(16, 3, 8, 'Python Syntax and Data Types', 'Variables, Lists, Dictionaries', '2025-12-17', 'easy', 4, 4, 100, 25.3, 'completed', '2025-11-17 09:00:00'),
(17, 3, 8, 'Functions and Modules', 'Creating reusable code', '2025-12-21', 'easy', 5, 4, 80, 35.1, 'in_progress', '2025-11-21 10:00:00'),
(18, 3, 9, 'Neural Networks Basics', 'Understanding neural networks architecture', '2025-12-23', 'hard', 8, 4, 50, 48.7, 'in_progress', '2025-11-23 14:00:00'),
(19, 3, 9, 'Training and Optimization', 'Backpropagation and gradient descent', '2025-12-28', 'hard', 7, 2, 28.57, 55.2, 'pending', '2025-12-28 10:00:00'),
(20, 3, 10, 'Data Cleaning Techniques', 'Handling missing values and outliers', '2025-12-19', 'medium', 4, 3, 75, 40.5, 'in_progress', '2025-11-19 11:00:00'),
(21, 3, 10, 'Exploratory Data Analysis', 'Visualization and statistics', '2025-12-24', 'medium', 5, 2, 40, 45.8, 'in_progress', '2025-11-24 15:00:00'),
(22, 3, 11, 'Django Project Setup', 'Creating Django application structure', '2025-12-18', 'medium', 4, 3, 75, 38.2, 'in_progress', '2025-11-18 09:00:00'),
(23, 3, 11, 'Models and Database', 'ORM and database design', '2025-12-22', 'medium', 6, 2, 33.33, 42.1, 'in_progress', '2025-11-22 14:00:00');

-- ============================================
-- INSERT SCHEDULES - User 1: أحمد
-- ============================================

INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status, created_at) VALUES
(1, 1, '2025-12-15', '08:00:00', '09:30:00', 90, 'completed', '2025-12-15 08:00:00'),
(1, 4, '2025-12-15', '10:00:00', '11:30:00', 90, 'completed', '2025-12-15 10:00:00'),
(1, 2, '2025-12-16', '09:00:00', '10:45:00', 105, 'completed', '2025-12-16 09:00:00'),
(1, 5, '2025-12-16', '14:00:00', '15:30:00', 90, 'completed', '2025-12-16 14:00:00'),
(1, 6, '2025-12-17', '08:30:00', '10:15:00', 105, 'completed', '2025-12-17 08:30:00'),
(1, 8, '2025-12-17', '16:00:00', '17:15:00', 75, 'completed', '2025-12-17 16:00:00'),
(1, 1, '2025-12-18', '09:00:00', '10:30:00', 90, 'completed', '2025-12-18 09:00:00'),
(1, 9, '2025-12-18', '14:30:00', '15:45:00', 75, 'completed', '2025-12-18 14:30:00'),
(1, 2, '2025-12-19', '10:00:00', '11:45:00', 105, 'scheduled', '2025-12-19 10:00:00'),
(1, 5, '2025-12-19', '15:00:00', '16:30:00', 90, 'scheduled', '2025-12-19 15:00:00');

-- ============================================
-- INSERT SCHEDULES - User 2: فاطمة
-- ============================================

INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status, created_at) VALUES
(2, 10, '2025-12-13', '09:00:00', '10:00:00', 60, 'completed', '2025-12-13 09:00:00'),
(2, 11, '2025-12-13', '14:00:00', '15:30:00', 90, 'completed', '2025-12-13 14:00:00'),
(2, 12, '2025-12-14', '10:30:00', '12:00:00', 90, 'completed', '2025-12-14 10:30:00'),
(2, 14, '2025-12-14', '15:00:00', '16:30:00', 90, 'completed', '2025-12-14 15:00:00'),
(2, 11, '2025-12-15', '08:00:00', '09:30:00', 90, 'scheduled', '2025-12-15 08:00:00'),
(2, 13, '2025-12-15', '16:00:00', '17:30:00', 90, 'scheduled', '2025-12-15 16:00:00'),
(2, 12, '2025-12-16', '11:00:00', '12:45:00', 105, 'scheduled', '2025-12-16 11:00:00'),
(2, 14, '2025-12-16', '17:00:00', '18:15:00', 75, 'scheduled', '2025-12-16 17:00:00'),
(2, 13, '2025-12-17', '09:30:00', '11:00:00', 90, 'scheduled', '2025-12-17 09:30:00'),
(2, 15, '2025-12-17', '15:30:00', '16:45:00', 75, 'scheduled', '2025-12-17 15:30:00'),
(3, 16, '2025-12-12', '14:00:00', '15:30:00', 90, 'completed', '2025-12-12 14:00:00'),
(3, 16, '2025-12-13', '14:00:00', '15:30:00', 90, 'completed', '2025-12-13 14:00:00'),
(3, 17, '2025-12-14', '10:00:00', '11:45:00', 105, 'completed', '2025-12-14 10:00:00'),
(3, 17, '2025-12-15', '10:00:00', '11:30:00', 90, 'completed', '2025-12-15 10:00:00'),
(3, 18, '2025-12-15', '16:00:00', '17:45:00', 105, 'in_progress', '2025-12-15 16:00:00'),
(3, 20, '2025-12-16', '09:00:00', '10:30:00', 90, 'scheduled', '2025-12-16 09:00:00'),
(3, 22, '2025-12-16', '14:00:00', '15:45:00', 105, 'scheduled', '2025-12-16 14:00:00'),
(3, 18, '2025-12-17', '15:30:00', '17:15:00', 105, 'scheduled', '2025-12-17 15:30:00'),
(3, 21, '2025-12-18', '10:00:00', '11:30:00', 90, 'scheduled', '2025-12-18 10:00:00'),
(3, 19, '2025-12-19', '16:00:00', '17:45:00', 105, 'scheduled', '2025-12-19 16:00:00');

-- ============================================
-- INSERT PROGRESS LOGS
-- ============================================

INSERT INTO progress_logs (user_id, task_id, hours_logged, progress_percentage, notes, logged_at) VALUES
(1, 1, 2.5, 25, 'انتهيت من Inheritance', '2025-12-10 10:00:00'),
(1, 1, 2.0, 50, 'انتهيت من Polymorphism', '2025-12-12 14:00:00'),
(1, 1, 1.5, 92, 'انتهيت من معظم المواضيع', '2025-12-14 09:00:00'),
(1, 2, 2.0, 25, 'بدأت بـ Database Design', '2025-12-11 10:00:00'),
(1, 2, 2.0, 50, 'انتهيت من CRUD الأساسي', '2025-12-13 15:00:00'),
(1, 4, 5.0, 100, 'انتهيت من تصميم Schema كامل', '2025-12-09 11:00:00'),
(1, 5, 3.0, 50, 'تعلمت JOINs', '2025-12-12 10:00:00'),
(1, 5, 2.0, 83, 'أنهيت الـ Subqueries', '2025-12-14 14:00:00'),
(2, 10, 3.0, 100, 'انتهيت من كل المواضيع الأساسية', '2025-12-08 09:00:00'),
(2, 11, 1.5, 35, 'تعلمت querySelector', '2025-12-10 09:00:00'),
(2, 11, 1.5, 75, 'تعلمت addEventListener', '2025-12-12 14:00:00'),
(2, 12, 1.5, 30, 'بدأت بـ Components', '2025-12-11 15:00:00'),
(2, 12, 0.5, 40, 'تعلمت Props', '2025-12-13 10:00:00'),
(2, 14, 2.0, 50, 'تعلمت Flexbox', '2025-12-12 14:00:00'),
(2, 14, 1.5, 87.5, 'تعلمت Grid', '2025-12-14 15:00:00'),
(3, 16, 4.0, 100, 'Completed Python syntax fundamentals', '2025-12-12 16:00:00'),
(3, 17, 2.5, 50, 'Learned function definition and scope', '2025-12-14 11:30:00'),
(3, 17, 1.5, 80, 'Completed module import and usage', '2025-12-15 11:00:00'),
(3, 18, 3.0, 40, 'Studied neural network architecture', '2025-12-15 17:30:00'),
(3, 18, 1.0, 50, 'Understood forward propagation basics', '2025-12-16 17:00:00'),
(3, 20, 2.0, 50, 'Learned data cleaning techniques', '2025-12-13 10:00:00'),
(3, 20, 1.0, 75, 'Applied cleaning to real dataset', '2025-12-14 10:30:00'),
(3, 22, 2.0, 60, 'Set up Django project structure', '2025-12-11 15:00:00'),
(3, 22, 1.0, 75, 'Configured settings and URLs', '2025-12-13 15:30:00'),
(3, 23, 1.5, 25, 'Defined models for blog application', '2025-12-14 16:00:00');

-- ============================================
-- DATABASE SETUP COMPLETE
-- ============================================
-- Test Users:
-- Email: ahmad@test.com  | Password: password123 | Name: أحمد محمد (Arabic)
-- Email: fatima@test.com | Password: password123 | Name: فاطمة علي (Arabic)
-- Email: john@test.com   | Password: password123 | Name: John Smith (English)
--
-- Database contains:
-- - 3 Users with preferences
-- - 11 Courses (4 Arabic courses + 7 English courses)
-- - 23 Tasks with various statuses
-- - 30 Schedule entries
-- - 25 Progress log entries
-- ============================================
