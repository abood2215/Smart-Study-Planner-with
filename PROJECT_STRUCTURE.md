# 📁 Smart Study Planner - Project Structure

هذا المستند يشرح هيكل المشروع بالتفصيل وموقع كل ملف ووظيفته.

---

## 📂 المجلدات الرئيسية

### 1. `/api/` - REST API Endpoints
المجلد يحتوي على جميع نقاط النهاية الخاصة بـ API:

| الملف | الوظيفة | الأساليب |
|------|---------|---------|
| `auth.php` | التسجيل وتسجيل الدخول والملف الشخصي | POST, GET |
| `tasks.php` | إدارة المهام (CRUD) | GET, POST, PUT, DELETE |
| `courses.php` | إدارة الكورسات | GET, POST, PUT, DELETE |
| `schedule.php` | عرض وتحديث الجدول | GET, PUT, DELETE |
| `generate-schedule.php` | توليد جدول ذكي بالـ AI | POST |
| `progress.php` | تتبع التقدم | GET, POST |
| `ai.php` | ميزات الذكاء الاصطناعي | GET, POST |
| `ai-insights.php` | تحليلات وتوصيات AI | GET |

**ملحوظة**: جميع endpoints تتطلب JWT authentication ماعدا register & login.

---

### 2. `/controllers/` - Business Logic Layer
المنطق التجاري للتطبيق (MVC Pattern):

- **AuthController.php**: معالجة التسجيل، تسجيل الدخول، JWT tokens
- **TaskController.php**: منطق المهام، حساب Priority Score
- **CourseController.php**: منطق الكورسات، حساب التقدم
- **AIController.php**: التكامل مع Gemini AI

---

### 3. `/models/` - Data Models
نماذج البيانات (قيد التطوير):

- **User.php**: نموذج المستخدم
- **Task.php**: نموذج المهمة
- **Course.php**: نموذج الكورس

---

### 4. `/includes/` - Core System Files
الملفات الأساسية للنظام:

| الملف | الوظيفة |
|------|---------|
| `config.php` | إعدادات التطبيق، تعريف الثوابت |
| `db.php` | اتصال قاعدة البيانات (PDO) |
| `functions.php` | دوال مساعدة (auth, validation, etc.) |
| `GeminiService.php` | خدمة Gemini AI |
| `dotenv.php` | تحميل متغيرات البيئة من .env |

---

### 5. `/database/` - Database Files
- **schema.sql**: هيكل قاعدة البيانات الكامل
  - جداول: users, courses, tasks, schedules, progress, user_preferences
  - Indexes للأداء
  - Foreign keys للعلاقات

---

### 6. `/assets/` - Frontend Assets

#### `/assets/css/`
- **style.css**: جميع أنماط CSS للتطبيق

#### `/assets/js/`
ملفات JavaScript للصفحات:

| الملف | الصفحة | الوظيفة |
|------|--------|---------|
| `login-new.js` | login.html | تسجيل الدخول عبر API |
| `register-new.js` | register.html | التسجيل عبر API |
| `dashboard-api.js` | dashboard.html | لوحة التحكم، الإحصائيات |
| `tasks-api.js` | tasks.html | إدارة المهام |
| `courses-api.js` | courses.html | إدارة الكورسات |
| `schedule-api.js` | schedule.html | عرض وتوليد الجدول |
| `calendar-api.js` | calendar.html | عرض التقويم |
| `analytics-api.js` | analytics.html | التحليلات والرسوم البيانية |
| `settings-api.js` | settings.html | إعدادات المستخدم |
| `api-config.js` | جميع الصفحات | إعدادات API المشتركة |

---

### 7. `/docs/` - Documentation & Testing
📚 التوثيق وأدوات الاختبار:

- **README.md**: شرح محتويات المجلد
- **Smart-Study-Planner-API.postman_collection.json**:
  - Postman collection لاختبار جميع API endpoints
  - يحتوي على أمثلة لكل request
  - استخدمه لاختبار API بدون كتابة كود

**كيفية الاستخدام:**
1. افتح Postman
2. Import → اختر الملف
3. أنشئ environment بـ `base_url` و `auth_token`
4. ابدأ بـ Login request

---

### 8. `/scripts/` - Utility Scripts
🛠️ سكريبتات مساعدة (PHP فقط):

- **remove_comments.php**: إزالة التعليقات من جميع ملفات PHP
- **list_users.php**: عرض قائمة بجميع المستخدمين في قاعدة البيانات
- **reset_password.php**: إعادة تعيين كلمة مرور المستخدم
- **README.md**: شرح استخدام السكريبتات

---

### 9. `/legacy/` - Old Files (Archived)
📦 ملفات قديمة للمرجع فقط (لا تستخدم):

- **index.php**: الصفحة الرئيسية القديمة
- **login.php**: صفحة تسجيل الدخول القديمة
- **register.php**: صفحة التسجيل القديمة
- **dashboard.php**: لوحة التحكم القديمة
- **README.md**: شرح سبب وجود الملفات

**ملحوظة**: تم الانتقال من PHP التقليدي إلى API-based architecture.

---

### 10. `/logs/` - Application Logs
📝 سجلات التطبيق:

- **app.log**: سجل الأخطاء والأحداث
  - يتم الكتابة عبر دالة `logMessage()` في functions.php
  - مفيد للـ debugging

---

## 📄 الملفات في الجذر (Root)

### صفحات HTML
صفحات الواجهة الأمامية:

| الملف | الوصف | المسار |
|------|-------|--------|
| `index.html` | الصفحة الرئيسية (Landing) | `/` |
| `login.html` | تسجيل الدخول | `/login.html` |
| `register.html` | التسجيل | `/register.html` |
| `dashboard.html` | لوحة التحكم | `/dashboard.html` |
| `tasks.html` | إدارة المهام | `/tasks.html` |
| `courses.html` | إدارة الكورسات | `/courses.html` |
| `schedule.html` | الجدول الأسبوعي | `/schedule.html` |
| `calendar.html` | التقويم | `/calendar.html` |
| `analytics.html` | التحليلات والإحصائيات | `/analytics.html` |
| `settings.html` | الإعدادات | `/settings.html` |

### ملفات التكوين
| الملف | الوظيفة |
|------|---------|
| `.env` | متغيرات البيئة (API keys، إعدادات) - **سري!** |
| `.env.example` | مثال لملف .env (بدون بيانات حساسة) |
| `.htaccess` | إعدادات Apache (CORS، routing) |
| `.gitignore` | ملفات مستبعدة من Git |
| `README.md` | الدليل الرئيسي للمشروع |
| `PROJECT_STRUCTURE.md` | هذا الملف |

---

## 🔄 تدفق البيانات (Data Flow)

```
Frontend (HTML/JS)
       ↓
    API Call
       ↓
  api/*.php
       ↓
 functions.php (auth check)
       ↓
controllers/*.php
       ↓
   db.php (PDO)
       ↓
  MySQL Database
```

---

## 🗄️ قاعدة البيانات

### الجداول الرئيسية:

1. **users** - المستخدمين
   - id, name, email, password, created_at

2. **courses** - الكورسات
   - id, user_id, name, difficulty, total_hours, completed_hours, progress

3. **tasks** - المهام
   - id, user_id, course_id, title, description, deadline, difficulty, status, priority_score

4. **schedules** - الجدول الدراسي
   - id, user_id, task_id, scheduled_date, start_time, end_time, status

5. **progress** - التقدم
   - id, user_id, task_id, completed_hours, notes

6. **user_preferences** - تفضيلات المستخدم
   - user_id, preferred_study_time, daily_study_hours, session_duration_minutes

---

## 🚀 كيفية إضافة ميزة جديدة

### مثال: إضافة "Notes" للمهام

1. **Database**: أضف عمود في `tasks` table
   ```sql
   ALTER TABLE tasks ADD COLUMN notes TEXT;
   ```

2. **API**: حدّث `api/tasks.php`
   ```php
   // في POST/PUT handler
   $notes = $data['notes'] ?? '';
   ```

3. **Frontend**: حدّث `assets/js/tasks-api.js`
   ```javascript
   // أضف حقل notes في form
   notes: document.getElementById('taskNotes').value
   ```

4. **HTML**: حدّث `tasks.html`
   ```html
   <textarea id="taskNotes" placeholder="Notes"></textarea>
   ```

---

## 📊 الإحصائيات

- **إجمالي الملفات**: 50+
- **API Endpoints**: 8 ملفات رئيسية
- **صفحات HTML**: 10 صفحات
- **JavaScript Files**: 9 ملفات
- **Controllers**: 4 ملفات
- **Models**: 3 ملفات (قيد التطوير)

---

## 🔒 ملفات حساسة (لا تشاركها!)

⚠️ **لا ترفع هذه الملفات على Git:**
- `.env` - يحتوي على API keys
- `/logs/*.log` - سجلات قد تحتوي معلومات حساسة

✅ **مضاف في .gitignore**: .env, logs/, .htaccess

---

## 📞 للمطورين

### ترتيب القراءة المقترح:
1. README.md - نظرة عامة
2. PROJECT_STRUCTURE.md - هذا الملف
3. database/schema.sql - هيكل البيانات
4. includes/functions.php - الدوال المساعدة
5. api/ - فهم API endpoints
6. assets/js/ - فهم Frontend logic

### أدوات التطوير:
- **VS Code**: Editor مقترح
- **XAMPP**: Apache + MySQL + PHP
- **Postman**: اختبار API
- **Browser DevTools**: debugging

---

**آخر تحديث**: نوفمبر 2024
**الإصدار**: 2.0.0
