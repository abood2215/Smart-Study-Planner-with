# Smart Study Planner - Reorganized Project Structure

## 📁 الهيكل الجديد

المشروع مقسّم إلى جزأين منفصلين:

```
Smart-Study-Planner-with/
│
├── 📂 backend/                    # Backend API (PHP only)
│   ├── api/                       # API Endpoints
│   │   ├── auth.php
│   │   ├── tasks.php
│   │   ├── courses.php
│   │   ├── schedule.php
│   │   ├── progress.php
│   │   ├── ai.php
│   │   ├── ai-insights.php
│   │   └── generate-schedule.php
│   │
│   ├── controllers/               # Business Logic
│   │   ├── AuthController.php
│   │   ├── TaskController.php
│   │   ├── CourseController.php
│   │   └── AIController.php
│   │
│   ├── models/                    # Database Models
│   │   ├── User.php
│   │   ├── Task.php
│   │   └── Course.php
│   │
│   ├── includes/                  # Core System Files
│   │   ├── config.php
│   │   ├── db.php
│   │   ├── functions.php
│   │   ├── GeminiService.php
│   │   ├── dotenv.php
│   │   └── api_auth.php
│   │
│   ├── database/                  # Database Files
│   │   ├── schema.sql
│   │   ├── sample_data.sql
│   │   └── smart_study_planner2_complete.sql
│   │
│   ├── scripts/                   # Utility Scripts (PHP)
│   │   ├── export_database.php
│   │   ├── list_users.php
│   │   ├── reset_password.php
│   │   └── remove_comments.php
│   │
│   ├── config/                    # Configuration Files
│   │
│   └── logs/                      # Application Logs
│       └── app.log
│
├── 📂 frontend/                   # Frontend (HTML/CSS/JS)
│   ├── index.html                 # Landing page
│   ├── login.html                 # Login
│   ├── register.html              # Registration
│   ├── dashboard.html             # Main dashboard
│   ├── tasks.html                 # Tasks page
│   ├── courses.html               # Courses page
│   ├── schedule.html              # Schedule page
│   ├── calendar.html              # Calendar view
│   ├── analytics.html             # Analytics
│   ├── settings.html              # Settings
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   ├── auth.css
│   │   │   └── calendar.css
│   │   │
│   │   └── js/
│   │       ├── api-config.js      # API configuration
│   │       ├── main.js            # Main script
│   │       ├── storage.js         # Local storage
│   │       ├── login-new.js
│   │       ├── register-new.js
│   │       ├── dashboard-api.js
│   │       ├── tasks-api.js
│   │       ├── courses-api.js
│   │       ├── schedule-api.js
│   │       ├── calendar-api.js
│   │       ├── analytics-api.js
│   │       ├── settings-api.js
│   │       └── ai-algorithms.js
│   │
│   └── pages/                     # Additional pages (if any)
│
├── 📂 docs/                       # Documentation & Testing
│   ├── README.md
│   └── Smart-Study-Planner-API.postman_collection.json
│
├── api.php                        # API Router (entry point)
├── index.html                     # Root redirect to frontend
│
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .htaccess                      # Apache configuration
├── .gitignore                     # Git ignore rules
├── README.md                      # Main README
└── PROJECT_STRUCTURE.md           # This file
```

---

## 🚀 الاستخدام

### تشغيل المشروع

```bash
# URL الرئيسي (يعيد توجيه إلى Frontend)
http://localhost/Smart-Study-Planner-with/

# Frontend مباشر
http://localhost/Smart-Study-Planner-with/frontend/

# API Endpoint
http://localhost/Smart-Study-Planner-with/api/auth.php
```

---

## 🔄 كيفية تفاعل Frontend و Backend

```
Frontend (HTML/CSS/JS)
        ↓
    api-config.js (API URL config)
        ↓
    JavaScript API calls (fetch)
        ↓
    /api/*.php (API Router)
        ↓
    backend/api/*.php (API Endpoints)
        ↓
    controllers/ (Business Logic)
        ↓
    models/ (Database Operations)
        ↓
    Database
```

---

## 📝 API Configuration

يجب تحديث `frontend/assets/js/api-config.js`:

```javascript
// API Base URL
const API_BASE = '/Smart-Study-Planner-with/api/';

// أو للتطوير المحلي:
const API_BASE = 'http://localhost/Smart-Study-Planner-with/api/';
```

---

## 🗂️ وصف المجلدات

### Backend
- **api/**: جميع نقاط نهاية API
- **controllers/**: المنطق التجاري
- **models/**: نماذج البيانات والعمليات على قاعدة البيانات
- **includes/**: الملفات الأساسية (اتصال قاعدة البيانات، دوال مساعدة، إلخ)
- **database/**: ملفات SQL وسكريبتات قاعدة البيانات
- **scripts/**: أدوات مساعدة (backup, password reset, إلخ)
- **config/**: ملفات الإعدادات
- **logs/**: سجلات التطبيق

### Frontend
- **index.html و\*.html**: صفحات HTML
- **assets/css/**: أنماط CSS
- **assets/js/**: ملفات JavaScript
  - **api-config.js**: إعدادات API
  - **\*-api.js**: تفاعل مع API محدد
  - **main.js**: الدوال العامة

---

## 🔐 الملفات الحساسة

يتم حماية الملفات التالية عبر `.htaccess`:
- `backend/` (المجلد الكامل)
- `.env` (متغيرات البيئة)

لا يمكن الوصول إليها مباشرة من المتصفح.

---

## 🔄 الترحيل من الهيكل القديم

إذا كنت تستخدم الهيكل القديم:

**قديم:**
```
/api/ → /backend/api/
/controllers/ → /backend/controllers/
/models/ → /backend/models/
/includes/ → /backend/includes/
/*.html → /frontend/
/assets/ → /frontend/assets/
```

**تحديث المسارات:**
- في API: استخدم المسارات النسبية الجديدة
- في JavaScript: تحديث API_BASE في api-config.js

---

## 📚 ملاحظات مهمة

1. **كل ملفات PHP يجب أن تكون في `backend/`**
2. **كل ملفات Frontend (HTML/CSS/JS) يجب أن تكون في `frontend/`**
3. **API Router (`api.php` في الجذر) يوجّه الطلبات تلقائياً**
4. **يمكن الوصول إلى `frontend/` مباشرة من المتصفح**
5. **لا يمكن الوصول إلى `backend/` مباشرة (محمي بـ .htaccess)**

---

## 🛠️ الملفات المحذوفة

- ✂️ `legacy/` - ملفات قديمة (حذفت)
- ✂️ `pages/` - نقلت إلى `frontend/pages/`

---

## 📖 تحديث التوثيق

للمزيد من المعلومات:
- [README.md](../README.md) - المعلومات العامة
- [docs/](../docs/) - توثيق API والأدوات
- [backend/scripts/README.md](../backend/scripts/README.md) - أدوات المساعدة

---

**تاريخ التحديث:** 2025-12-14
