# Smart Study Planner - System Architecture

## 📋 User Flow (New Design)

```
Login/Register
      ↓
  index.html (Gateway)
      ↓
   ┌──────┴───────┐
   ↓              ↓
Study Planner  Project Hub
(dashboard.html) (projects.html)
```

---

## 🗂️ Page Structure & Functions

### 1️⃣ **index.html** — System Gateway (البوابة)

**المحتوى:**
- زر Study Planner → يذهب إلى `dashboard.html`
- زر Project Hub → يذهب إلى `projects.html`

**الوظيفة:**
- تحديد مسار استخدام النظام
- لا منطق أعمال (UI فقط)
- يظهر فقط للمستخدمين المسجلين دخولهم

**الكود:**
```javascript
// في index.html
if (token) {
    // عرض البوابة (Gateway Section)
    showGateway();
} else {
    // عرض Landing Page العادي
    showLandingPage();
}
```

---

### 2️⃣ **dashboard.html** — Study Planner

**المحتوى:**
- الإحصائيات (Statistics)
- المهام (Tasks)
- التقدم (Progress)
- الكورسات (Courses)

**الوظيفة:**
- تنظيم الدراسة
- تتبع التقدم الأكاديمي
- إنشاء جداول ذكية
- **لا علاقة له بالمشاريع**

**الصفحات المرتبطة:**
- tasks.html
- courses.html
- schedule.html
- calendar.html
- analytics.html

---

### 3️⃣ **projects.html** — Project Hub (مركز المشاريع)

**المحتوى:**
- إدخال الاهتمامات (Interests Input)
- Generate Project Ideas (AI)
- قائمة المشاريع (My Projects / All Projects)
- Create New Project

**الوظيفة:**
- توليد أفكار مشاريع باستخدام AI
- إنشاء مشروع جديد
- استعراض المشاريع المتاحة
- البحث عن مشاريع حسب الفئة

**API Endpoints:**
- `POST /api/ai.php?action=generate-projects` - توليد أفكار
- `POST /api/projects.php?action=create` - إنشاء مشروع
- `GET /api/projects.php?action=list&scope=my` - مشاريعي
- `GET /api/projects.php?action=list&scope=all` - كل المشاريع

---

### 4️⃣ **project.html** — Project Details (تفاصيل المشروع)

**المحتوى:**
- معلومات المشروع (Name, Description, Status, Category)
- Team Members (أعضاء الفريق)
- Find Teammates (بحث ذكي عن أعضاء)
- Invite Student (دعوة طالب)
- Project Actions (Edit, Delete, Leave)

**الوظيفة:**
- إدارة مشروع واحد بالتفصيل
- تكوين فريق ذكي باستخدام AI
- إضافة/إزالة أعضاء الفريق
- تحديث حالة المشروع

**API Endpoints:**
- `GET /api/projects.php?action=get&id=X` - جلب المشروع
- `GET /api/matchmaking.php?action=find-teammates&project_id=X` - بحث عن teammates
- `POST /api/projects.php?action=add-member&id=X` - دعوة عضو
- `POST /api/projects.php?action=remove-member&id=X` - إزالة عضو
- `POST /api/projects.php?action=update&id=X` - تحديث المشروع
- `POST /api/projects.php?action=delete&id=X` - حذف المشروع

---

### 5️⃣ **profile.html** — CV & Skills Analysis

**المحتوى:**
- Profile Information (Name, Email)
- Interests (comma separated)
- Skills (comma separated)
- CV Text Input
- Analyze CV Button (AI)
- Project Statistics

**الوظيفة:**
- تحليل مهارات الطالب باستخدام AI
- استخراج Skills & Interests من السيرة الذاتية
- تغذية نظام التوفيق (Matchmaking) بالبيانات
- عرض إحصائيات المشاريع

**API Endpoints:**
- `POST /api/ai.php?action=analyze-cv` - تحليل CV
- `POST /api/auth.php?action=update-profile` - حفظ البيانات
- `GET /api/projects.php?action=statistics` - إحصائيات

---

### 6️⃣ **Study Planner Pages** (الصفحات الحالية)

**الصفحات:**
- tasks.html
- courses.html
- schedule.html
- calendar.html
- analytics.html
- settings.html

**الوظيفة:**
- أدوات تنظيم الدراسة فقط
- **لا تغيير عليها**
- تعمل بشكل مستقل عن Project Hub

---

## 🔐 Authentication Flow (تدفق المصادقة)

### Login & Register Behavior:

```javascript
// ✅ السلوك الصحيح الحالي

// بعد Login الناجح:
window.location.href = 'index.html'; // ← البوابة

// بعد Register الناجح:
window.location.href = 'index.html'; // ← البوابة
```

### Files Modified:
1. ✅ `frontend/assets/js/login.js` (Line 64)
2. ✅ `frontend/assets/js/login-new.js` (Line 60)
3. ✅ `frontend/assets/js/register-new.js` (Line 81)
4. ✅ `frontend/assets/js/auth.js` (Lines 81, 105)

---

## 🗄️ Database Schema

### New Tables:

#### **projects**
```sql
- id (Primary Key)
- owner_id (Foreign Key → users.id)
- name
- description
- category
- status (active, completed, archived)
- required_skills
- is_public
- max_team_size
- created_at
- updated_at
```

#### **project_team**
```sql
- id (Primary Key)
- project_id (Foreign Key → projects.id)
- user_id (Foreign Key → users.id)
- role (owner, member)
- joined_at
```

#### **users** (Extended)
```sql
- ... (existing columns)
- interests (TEXT)
- skills (TEXT)
```

---

## 🤖 AI Features

### 1. Generate Project Ideas
**Endpoint:** `POST /api/ai.php?action=generate-projects`

**Input:**
```json
{
  "interests": "Web Development, AI, Mobile Apps",
  "difficulty": "medium",
  "count": 5
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "raw_response": "..."
  }
}
```

### 2. Analyze CV
**Endpoint:** `POST /api/ai.php?action=analyze-cv`

**Input:**
```json
{
  "cv_text": "Full CV content..."
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "skills": ["JavaScript", "Python", "React"],
    "interests": ["Web Dev", "AI"],
    "experience_level": "intermediate",
    "summary": "...",
    "profile_updated": true
  }
}
```

### 3. Find Teammates
**Endpoint:** `GET /api/matchmaking.php?action=find-teammates&project_id=X`

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Student Name",
      "skills": "JavaScript, React",
      "match_score": 0.85
    }
  ]
}
```

---

## ✅ Implementation Checklist

- [x] Gateway section in index.html
- [x] Login redirect to index.html
- [x] Register redirect to index.html
- [x] Backend ProjectController
- [x] Backend Project Model
- [x] Backend API endpoints (projects, matchmaking)
- [x] AI extensions (generateProjects, analyzeCV)
- [x] Database tables (projects, project_team)
- [x] Frontend projects.html
- [x] Frontend project.html
- [x] Frontend profile.html
- [x] JavaScript files (projects.js, project.js, profile.js)

---

## 📝 Summary

المنطق الجديد:

1. **Login/Register** → `index.html` (البوابة)
2. المستخدم يختار:
   - **Study Planner** → `dashboard.html`
   - **Project Hub** → `projects.html`
3. **لا تغيير** على صفحات Study Planner الحالية
4. **Project Hub** نظام مستقل بالكامل مع AI

---

**Last Updated:** 2026-01-03
**Version:** 2.0
