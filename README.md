# 🎓 Smart Study Planner

> نظام ذكي لإدارة الدراسة مدعوم بالذكاء الاصطناعي

![PHP](https://img.shields.io/badge/PHP-7.4+-blue)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-orange)
![AI](https://img.shields.io/badge/AI-Gemini-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 نظرة سريعة

Smart Study Planner هو تطبيق ويب متكامل يساعد الطلاب على:
- 📝 إدارة المهام والواجبات
- 📚 تتبع الكورسات والتقدم
- 🤖 الحصول على توصيات ذكية بالـ AI
- 📊 مراقبة الأداء والإحصائيات
- 📅 إنشاء جداول دراسية مخصصة
- 🎯 حساب أولويات المهام تلقائياً

---

## ✨ الميزات الرئيسية

### 🔐 نظام المستخدمين
- تسجيل وتسجيل دخول آمن
- JWT Authentication
- ملف شخصي وإعدادات مخصصة

### ✅ إدارة المهام
- إنشاء وتعديل وحذف المهام
- حساب Priority Score تلقائي
- تتبع التقدم والحالة
- تقسيم المهام المعقدة

### 📚 إدارة الكورسات
- متابعة جميع الكورسات
- قياس الأداء والتقدم
- نصائح ذكية لكل كورس

### 🤖 الذكاء الاصطناعي (Gemini AI)
- تقدير مدة المهام
- توصيات دراسية مخصصة
- تحليل التقدم والأداء
- إنشاء جداول دراسية ذكية
- رسائل تحفيزية
- اقتراح تقنيات الدراسة

### 📊 التحليلات والتقارير
- إحصائيات شاملة
- رسوم بيانية تفاعلية
- تتبع الأداء بمرور الوقت

---

## 🚀 البدء السريع

### المتطلبات
- XAMPP (Apache + MySQL + PHP 7.4+)
- متصفح ويب حديث
- اتصال إنترنت (للـ AI فقط)

### التثبيت في 3 خطوات

#### 1️⃣ تشغيل XAMPP
```bash
1. افتح XAMPP Control Panel
2. Start Apache
3. Start MySQL
```

#### 2️⃣ إنشاء قاعدة البيانات
```bash
1. افتح: http://localhost/phpmyadmin
2. Import → اختر: database/schema.sql
3. Go
```

#### 3️⃣ اختبار النظام
```bash
php test-system.php
```

### 🎉 جاهز!
افتح: `http://localhost/Smart-Study-Planner-with/`

---

## 📁 البنية

```
Smart-Study-Planner-with/
│
├── 📂 api/                  # REST API Endpoints
│   ├── auth.php            # Authentication API
│   ├── tasks.php           # Tasks CRUD API
│   ├── courses.php         # Courses API
│   ├── schedule.php        # Schedule API
│   ├── generate-schedule.php  # AI Schedule Generator
│   ├── progress.php        # Progress Tracking
│   └── ai.php              # AI Features
│
├── 📂 controllers/          # Business Logic (MVC Pattern)
│   ├── AuthController.php
│   ├── TaskController.php
│   ├── CourseController.php
│   └── AIController.php
│
├── 📂 models/               # Database Models
│   ├── User.php
│   ├── Task.php
│   └── Course.php
│
├── 📂 includes/             # Core Files
│   ├── config.php          # App configuration
│   ├── db.php              # Database connection
│   ├── functions.php       # Helper functions
│   ├── GeminiService.php   # AI integration
│   └── dotenv.php          # Environment loader
│
├── 📂 database/             # Database Files
│   └── schema.sql          # Database structure
│
├── 📂 assets/               # Frontend Assets
│   ├── css/style.css       # Styles
│   └── js/                 # JavaScript files
│       ├── login-new.js
│       ├── register-new.js
│       ├── dashboard-api.js
│       ├── tasks-api.js
│       ├── courses-api.js
│       ├── schedule-api.js
│       ├── analytics-api.js
│       └── settings-api.js
│
├── 📂 docs/                 # Documentation & Testing
│   ├── README.md
│   └── Smart-Study-Planner-API.postman_collection.json
│
├── 📂 scripts/              # Utility Scripts
│   ├── README.md
│   ├── remove_comments.py
│   └── remove_comments.sh
│
├── 📂 legacy/               # Old Files (Not Used)
│   ├── README.md
│   ├── index.php
│   ├── login.php
│   ├── register.php
│   └── dashboard.php
│
├── 📂 logs/                 # Application Logs
│   └── app.log
│
├── 📄 HTML Pages (Root)     # Frontend Pages
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration
│   ├── dashboard.html      # Main dashboard
│   ├── tasks.html          # Tasks management
│   ├── courses.html        # Courses page
│   ├── schedule.html       # Weekly schedule
│   ├── calendar.html       # Calendar view
│   ├── analytics.html      # Analytics & charts
│   └── settings.html       # User settings
│
├── .env                     # Environment variables (SECRET)
├── .env.example            # Environment template
├── .htaccess               # Apache config
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🔌 API Examples

### Authentication
```bash
# Register
POST /api/auth.php?action=register
{
  "name": "أحمد محمد",
  "email": "ahmad@example.com",
  "password": "123456"
}

# Login
POST /api/auth.php?action=login
{
  "email": "ahmad@example.com",
  "password": "123456"
}
```

### Tasks
```bash
# Get All Tasks
GET /api/tasks.php
Authorization: Bearer YOUR_TOKEN

# Create Task
POST /api/tasks.php
Authorization: Bearer YOUR_TOKEN
{
  "title": "Complete Chapter 5",
  "deadline": "2024-12-31",
  "difficulty": "medium"
}
```

### AI Features
```bash
# Estimate Duration
POST /api/ai.php?action=estimate-duration
Authorization: Bearer YOUR_TOKEN
{
  "title": "Study for Math Exam",
  "difficulty": "hard"
}

# Get Recommendations
GET /api/ai.php?action=recommendations
Authorization: Bearer YOUR_TOKEN

# Generate Schedule
GET /api/ai.php?action=generate-schedule
Authorization: Bearer YOUR_TOKEN
```

---

## 🧪 الاختبار

### اختبار شامل
```bash
php test-system.php
```

### اختبار API (متصفح)
```
http://localhost/Smart-Study-Planner-with/test-api.html
```

### اختبار AI (متصفح)
```
http://localhost/Smart-Study-Planner-with/test-ai.html
```

---

## 📖 التوثيق الإضافي

للمزيد من التفاصيل:
- **📂 docs/**: Postman API collection للاختبار
- **📂 scripts/**: أدوات مساعدة
- **📂 legacy/**: ملفات قديمة للمرجع فقط

---

## 🔢 Priority Score Algorithm

يتم حساب أولوية المهمة تلقائياً:

```
Priority Score = Urgency + Difficulty + Progress + Performance

Urgency (0-40):
- Overdue: 40
- 1 day: 35
- 2-3 days: 30
- 4-7 days: 20
- 8-14 days: 10

Difficulty:
- Easy: 10
- Medium: 17
- Hard: 25

Progress: (100 - progress%) / 5
Performance: (100 - performance%) / 6.67
```

**مثال:** مهمة متأخرة + صعبة = Priority Score 87 ⚠️

---

## 🤖 ميزات AI

### 1. تقدير مدة المهام
```javascript
Input: "دراسة الفصل الخامس - قراءة وحل تمارين"
Output: 5.5 ساعة
```

### 2. توصيات ذكية
- أهم 3 مهام للتركيز
- نصائح لتحسين الأداء
- إدارة الوقت

### 3. تحليل التقدم
- تقييم الأداء
- نقاط القوة والضعف
- نصائح محددة

### 4. جدول دراسي مخصص
بناءً على:
- أولويات المهام
- الوقت المتاح
- التفضيلات الشخصية

---

## 🛠️ التقنيات المستخدمة

### Backend
- **PHP 7.4+** - Server-side logic
- **MySQL** - Database
- **PDO** - Database access
- **JWT** - Authentication

### Frontend
- **HTML5 & CSS3** - Structure & Style
- **JavaScript (ES6+)** - Interactivity
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### AI
- **Google Gemini API** - AI features
- **REST API** - Integration

---

## 🔐 الأمان

✅ **Password Hashing** - bcrypt
✅ **JWT Authentication** - Secure tokens
✅ **SQL Injection Prevention** - Prepared statements
✅ **Input Validation** - Sanitization
✅ **CORS** - Cross-origin protection

---

## 📱 الصفحات

| الصفحة | الوصف | الرابط |
|--------|-------|--------|
| 🏠 Landing | الصفحة الرئيسية | `/index.html` |
| 🔐 Login | تسجيل الدخول | `/login.html` |
| ✍️ Register | التسجيل | `/register.html` |
| 📊 Dashboard | لوحة التحكم | `/dashboard.html` |
| ✅ Tasks | المهام | `/tasks.html` |
| 📚 Courses | الكورسات | `/courses.html` |
| 📅 Schedule | الجدول | `/schedule.html` |
| 📈 Analytics | التحليلات | `/analytics.html` |
| 🧪 Test API | اختبار API | `/test-api.html` |
| 🤖 Test AI | اختبار AI | `/test-ai.html` |

---

## 🐛 حل المشاكل الشائعة

### مشكلة: Database connection failed
```bash
✓ تأكد من تشغيل MySQL
✓ استورد schema.sql
✓ راجع config.php
```

### مشكلة: Login لا يعمل
```bash
✓ استخدم login-new.js
✓ افتح Console (F12)
✓ تأكد من Apache شغال
```

### مشكلة: AI لا يستجيب
```bash
✓ تحقق من GEMINI_API_KEY
✓ تحتاج إنترنت
✓ انتظر 5-10 ثواني
```

للمزيد: راجع [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)

---

## 📊 الإحصائيات

- **ملفات PHP:** 20+
- **API Endpoints:** 30+
- **Models:** 3 رئيسية
- **Controllers:** 5
- **AI Features:** 8 ميزات
- **Frontend Pages:** 10+

---

## 🎯 الأهداف المستقبلية

- [ ] تطبيق موبايل (React Native)
- [ ] إشعارات push
- [ ] مزامنة Google Calendar
- [ ] تقارير PDF
- [ ] Dark Mode
- [ ] Multi-language support

---

## 📞 الدعم

للمشاكل والأسئلة:
1. راجع [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
2. شغل `test-system.php`
3. افتح Developer Console (F12)
4. راجع `logs/app.log`

---

## 👨‍💻 المطور

تم تطويره بـ ❤️ كمشروع تعليمي

---

## 📄 الترخيص

MIT License - حرية الاستخدام والتعديل

---

## 🌟 شكراً

شكراً لاستخدامك Smart Study Planner!
نتمنى لك تجربة دراسية منتجة وممتعة 🎓✨

---

**Version: 2.0.0** | Made with ❤️ for students