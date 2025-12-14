# Scripts

This folder contains utility scripts for project maintenance.

## Available Scripts

### remove_comments.php
PHP script to remove comments from all PHP code files in the project. Replaces the old Python and Shell script versions while maintaining full functionality.

**Usage:**
```bash
php scripts/remove_comments.php
```

**Features:**
- Removes multi-line comments (`/* */`)
- Removes single-line comments (`//` and `#`)
- Preserves URLs (http://, https://) and shebangs (#!)
- Auto-detects file encoding (UTF-8, ISO-8859-1, Windows-1252)
- Cleans up empty lines left after comment removal
- Processes all PHP files recursively from project root

## Note
These scripts are for development/maintenance purposes only.

### list_users.php
Lists users in the application database. Usage:

```bash
php scripts/list_users.php
```

Note: This script uses the project's database configuration (`includes/db.php`) so make sure your local environment (Apache + MySQL) is running.

### reset_password.php
Reset a user's password (securely hashes the new password). Usage:

```bash
php scripts/reset_password.php --email=you@example.com --password=NewPass123
```

If `--password` is omitted the script will prompt for the new password interactively.

Security: passwords are stored hashed and cannot be recovered; use this script to set a new password instead.

### export_database.php
Export the entire database to an SQL file for backup or transfer to another machine.

**Usage:**

```bash
# Create timestamped backup
php scripts/export_database.php

# Create backup with custom filename
php scripts/export_database.php --file=my_backup.sql

# List all existing backups
php scripts/export_database.php --list
```

**Output:**
- Saves to `database/smart_study_planner2_YYYY-MM-DD_HH-MM-SS.sql`
- Includes CREATE DATABASE and CREATE TABLE statements
- Includes all data from all tables

**Restore on another machine:**
1. Copy the SQL file to the new machine
2. Create database: `CREATE DATABASE smart_study_planner2;`
3. Import the file: `mysql -u root < smart_study_planner2_YYYY-MM-DD_HH-MM-SS.sql`
   - Or in phpMyAdmin: Import → Select the SQL file → Go

---

## Sample Data File

File: `database/sample_data.sql`

Contains complete test data including:
- **2 Users**: ahmad@test.com, fatima@test.com (password: password123)
- **7 Courses**: With varying difficulties and progress levels
- **15 Tasks**: With detailed descriptions, deadlines, priorities
- **20+ Schedules**: Weekly schedule entries with statuses
- **Progress Logs**: Progress tracking entries

**Import Steps:**
1. First, import `database/schema.sql` (creates empty tables)
2. Then, import `database/sample_data.sql` (adds test data)
3. Login with test account: ahmad@test.com / password123
