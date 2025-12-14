-- Smart Study Planner - Sample Data
-- Contains test users with complete course, task, and schedule data
-- Import this AFTER running schema.sql

USE smart_study_planner2;

-- ============================================
-- USERS TABLE - 2 Test Users
-- ============================================
-- Password: password123 (hashed with bcrypt)

INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'أحمد محمد', 'ahmad@test.com', '$2y$10$0L3C9.7zYzM8V8qX0T1qWuzXFl5m2v9k8l7m6n5o4p3q2r1s0t9u8', '2025-12-01 10:00:00'),
(2, 'فاطمة علي', 'fatima@test.com', '$2y$10$0L3C9.7zYzM8V8qX0T1qWuzXFl5m2v9k8l7m6n5o4p3q2r1s0t9u8', '2025-12-02 11:00:00');

-- ============================================
-- USER PREFERENCES
-- ============================================

INSERT INTO user_preferences (user_id, preferred_study_time, daily_study_hours, break_duration_minutes, session_duration_minutes, timezone) VALUES
(1, 'morning', 5.0, 15, 90, 'UTC+3'),
(2, 'evening', 4.5, 10, 120, 'UTC+3');

-- ============================================
-- COURSES - User 1: أحمد (4 courses)
-- ============================================

INSERT INTO courses (id, user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
-- دورة البرمجة بلغة PHP
(1, 1, 'برمجة PHP المتقدمة', 'hard', 40, 32, 80, 85, '2025-11-01 09:00:00'),
-- دورة قاعدة البيانات
(2, 1, 'قواعد البيانات SQL', 'medium', 30, 24, 80, 80, '2025-11-05 10:00:00'),
-- دورة الويب
(3, 1, 'تطوير الويب الحديث', 'hard', 50, 35, 70, 75, '2025-11-10 14:00:00'),
-- دورة الـ API
(4, 1, 'بناء REST APIs', 'medium', 25, 15, 60, 70, '2025-11-15 11:00:00');

-- ============================================
-- COURSES - User 2: فاطمة (3 courses)
-- ============================================

INSERT INTO courses (id, user_id, name, difficulty, total_hours, completed_hours, progress, performance, created_at) VALUES
-- دورة JavaScript
(5, 2, 'JavaScript من الصفر', 'easy', 35, 28, 80, 82, '2025-11-03 08:00:00'),
-- دورة React
(6, 2, 'React.js الأساسيات', 'medium', 40, 25, 62.5, 78, '2025-11-08 15:00:00'),
-- دورة CSS
(7, 2, 'تصميم CSS متقدم', 'medium', 30, 18, 60, 75, '2025-11-12 09:00:00');

-- ============================================
-- TASKS - User 1: أحمد
-- ============================================

INSERT INTO tasks (id, user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
-- مهام الـ PHP
(1, 1, 1, 'دراسة PHP OOP', 'فهم Inheritance و Polymorphism', '2025-12-20', 'hard', 6, 5.5, 92, 45.2, 'in_progress', '2025-11-20 10:00:00'),
(2, 1, 1, 'عمل مشروع CRUD بـ PHP', 'بناء تطبيق CRUD كامل', '2025-12-22', 'hard', 8, 4, 50, 48.5, 'in_progress', '2025-11-22 11:00:00'),
(3, 1, 1, 'اختبار PHP (PHPUnit)', 'كتابة unit tests', '2025-12-25', 'medium', 4, 0, 0, 52.1, 'pending', '2025-11-25 09:00:00'),

-- مهام SQL
(4, 1, 2, 'تصميم Schema قاعدة البيانات', 'رسم ERD وعمل الجداول', '2025-12-18', 'medium', 5, 5, 100, 35.8, 'completed', '2025-11-18 14:00:00'),
(5, 1, 2, 'كتابة Queries معقدة', 'Joins, Subqueries, Aggregates', '2025-12-21', 'hard', 6, 5, 83, 42.3, 'in_progress', '2025-11-21 10:00:00'),

-- مهام الويب
(6, 1, 3, 'بناء واجهة مستخدم بـ HTML/CSS', 'تصميم صفحات responsive', '2025-12-19', 'medium', 7, 5, 71, 40.1, 'in_progress', '2025-11-19 09:00:00'),
(7, 1, 3, 'إضافة JavaScript التفاعلي', 'DOM Manipulation و Event Listeners', '2025-12-24', 'medium', 5, 0, 0, 50.5, 'pending', '2025-11-24 15:00:00'),

-- مهام API
(8, 1, 4, 'تصميم API Endpoints', 'تحديد routes و parameters', '2025-12-17', 'medium', 4, 3, 75, 38.2, 'in_progress', '2025-11-17 11:00:00'),
(9, 1, 4, 'عمل Authentication', 'JWT implementation', '2025-12-23', 'hard', 5, 2, 40, 48.9, 'in_progress', '2025-11-23 10:00:00');

-- ============================================
-- TASKS - User 2: فاطمة
-- ============================================

INSERT INTO tasks (id, user_id, course_id, title, description, deadline, difficulty, estimated_hours, completed_hours, progress, priority_score, status, created_at) VALUES
-- مهام JavaScript
(10, 2, 5, 'تعلم البيانات الأساسية في JS', 'Variables, Types, Operators', '2025-12-16', 'easy', 3, 3, 100, 20.5, 'completed', '2025-11-16 08:00:00'),
(11, 2, 5, 'DOM Manipulation', 'querySelector, addEventListener', '2025-12-20', 'easy', 4, 3, 75, 30.2, 'in_progress', '2025-11-20 09:00:00'),

-- مهام React
(12, 2, 6, 'دراسة Components و Props', 'Functional Components', '2025-12-21', 'medium', 5, 2, 40, 45.1, 'in_progress', '2025-11-21 15:00:00'),
(13, 2, 6, 'شرح Hooks (useState, useEffect)', 'State Management', '2025-12-25', 'medium', 6, 0, 0, 50.3, 'pending', '2025-11-25 10:00:00'),

-- مهام CSS
(14, 2, 7, 'Flexbox و Grid', 'Layout Systems', '2025-12-19', 'medium', 4, 3.5, 87.5, 35.6, 'in_progress', '2025-12-19 14:00:00'),
(15, 2, 7, 'Animations و Transitions', 'CSS Effects', '2025-12-26', 'medium', 4, 0, 0, 51.2, 'pending', '2025-12-26 09:00:00');

-- ============================================
-- SCHEDULES - User 1: أحمد (Weekly Schedule)
-- ============================================

INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status, created_at) VALUES
-- الاثنين
(1, 1, '2025-12-15', '08:00:00', '09:30:00', 90, 'completed', '2025-12-15 08:00:00'),
(1, 4, '2025-12-15', '10:00:00', '11:30:00', 90, 'completed', '2025-12-15 10:00:00'),

-- الثلاثاء
(1, 2, '2025-12-16', '09:00:00', '10:45:00', 105, 'completed', '2025-12-16 09:00:00'),
(1, 5, '2025-12-16', '14:00:00', '15:30:00', 90, 'completed', '2025-12-16 14:00:00'),

-- الأربعاء
(1, 6, '2025-12-17', '08:30:00', '10:15:00', 105, 'completed', '2025-12-17 08:30:00'),
(1, 8, '2025-12-17', '16:00:00', '17:15:00', 75, 'completed', '2025-12-17 16:00:00'),

-- الخميس
(1, 1, '2025-12-18', '09:00:00', '10:30:00', 90, 'completed', '2025-12-18 09:00:00'),
(1, 9, '2025-12-18', '14:30:00', '15:45:00', 75, 'completed', '2025-12-18 14:30:00'),

-- الجمعة
(1, 2, '2025-12-19', '10:00:00', '11:45:00', 105, 'scheduled', '2025-12-19 10:00:00'),
(1, 5, '2025-12-19', '15:00:00', '16:30:00', 90, 'scheduled', '2025-12-19 15:00:00');

-- ============================================
-- SCHEDULES - User 2: فاطمة (Weekly Schedule)
-- ============================================

INSERT INTO schedules (user_id, task_id, scheduled_date, start_time, end_time, duration_minutes, status, created_at) VALUES
-- السبت
(2, 10, '2025-12-13', '09:00:00', '10:00:00', 60, 'completed', '2025-12-13 09:00:00'),
(2, 11, '2025-12-13', '14:00:00', '15:30:00', 90, 'completed', '2025-12-13 14:00:00'),

-- الأحد
(2, 12, '2025-12-14', '10:30:00', '12:00:00', 90, 'completed', '2025-12-14 10:30:00'),
(2, 14, '2025-12-14', '15:00:00', '16:30:00', 90, 'completed', '2025-12-14 15:00:00'),

-- الاثنين
(2, 11, '2025-12-15', '08:00:00', '09:30:00', 90, 'scheduled', '2025-12-15 08:00:00'),
(2, 13, '2025-12-15', '16:00:00', '17:30:00', 90, 'scheduled', '2025-12-15 16:00:00'),

-- الثلاثاء
(2, 12, '2025-12-16', '11:00:00', '12:45:00', 105, 'scheduled', '2025-12-16 11:00:00'),
(2, 14, '2025-12-16', '17:00:00', '18:15:00', 75, 'scheduled', '2025-12-16 17:00:00'),

-- الأربعاء
(2, 13, '2025-12-17', '09:30:00', '11:00:00', 90, 'scheduled', '2025-12-17 09:30:00'),
(2, 15, '2025-12-17', '15:30:00', '16:45:00', 75, 'scheduled', '2025-12-17 15:30:00');

-- ============================================
-- PROGRESS LOGS
-- ============================================

INSERT INTO progress_logs (user_id, task_id, hours_logged, progress_percentage, notes, logged_at) VALUES
-- أحمد - PHP OOP
(1, 1, 2.5, 25, 'انتهيت من Inheritance', '2025-12-10 10:00:00'),
(1, 1, 2.0, 50, 'انتهيت من Polymorphism', '2025-12-12 14:00:00'),
(1, 1, 1.5, 92, 'انتهيت من معظم المواضيع', '2025-12-14 09:00:00'),

-- أحمد - مشروع CRUD
(1, 2, 2.0, 25, 'بدأت بـ Database Design', '2025-12-11 10:00:00'),
(1, 2, 2.0, 50, 'انتهيت من CRUD الأساسي', '2025-12-13 15:00:00'),

-- أحمد - SQL
(1, 4, 5.0, 100, 'انتهيت من تصميم Schema كامل', '2025-12-09 11:00:00'),
(1, 5, 3.0, 50, 'تعلمت JOINs', '2025-12-12 10:00:00'),
(1, 5, 2.0, 83, 'أنهيت الـ Subqueries', '2025-12-14 14:00:00'),

-- فاطمة - JavaScript الأساسيات
(2, 10, 3.0, 100, 'انتهيت من كل المواضيع الأساسية', '2025-12-08 09:00:00'),

-- فاطمة - DOM
(2, 11, 1.5, 35, 'تعلمت querySelector', '2025-12-10 09:00:00'),
(2, 11, 1.5, 75, 'تعلمت addEventListener', '2025-12-12 14:00:00'),

-- فاطمة - React
(2, 12, 1.5, 30, 'بدأت بـ Components', '2025-12-11 15:00:00'),
(2, 12, 0.5, 40, 'تعلمت Props', '2025-12-13 10:00:00'),

-- فاطمة - CSS
(2, 14, 2.0, 50, 'تعلمت Flexbox', '2025-12-12 14:00:00'),
(2, 14, 1.5, 87.5, 'تعلمت Grid', '2025-12-14 15:00:00');

-- ============================================
-- END OF SAMPLE DATA
-- ============================================
-- Password for both users: password123
-- User 1: ahmad@test.com
-- User 2: fatima@test.com
