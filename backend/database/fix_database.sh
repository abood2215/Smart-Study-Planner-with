#!/bin/bash
# ============================================
# Fix Database Connection Issue
# ============================================

echo "Smart Study Planner - Database Fix"
echo "===================================="
echo ""

# Step 1: Delete old database (optional)
echo "1. Deleting old database (if exists)..."
mysql -u root -e "DROP DATABASE IF EXISTS smart_study_planner;"

# Step 2: Import fresh data
echo "2. Importing fresh data from smart_study_planner_complete.sql..."
mysql -u root < backend/database/smart_study_planner_complete.sql

# Step 3: Verify
echo "3. Verifying installation..."
mysql -u root -e "SELECT DATABASE(); USE smart_study_planner2; SELECT COUNT(*) as 'Users' FROM users;"

echo ""
echo "✓ Done! Your database is now smart_study_planner2"
echo ""
echo "Test login:"
echo "  Email: ahmad@test.com"
echo "  Password: password123"
