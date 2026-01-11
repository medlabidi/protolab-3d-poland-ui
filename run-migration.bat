@echo off
echo.
echo ========================================
echo   ProtoLab Database Migration Tool
echo ========================================
echo.
echo This will help you migrate your database
echo from a single 'orders' table to separate
echo 'print_jobs' and 'design_requests' tables.
echo.
pause

echo.
echo STEP 1: Checking environment...
echo --------------------------------------
if exist .env (
    echo [OK] .env file found
) else (
    echo [ERROR] .env file not found!
    echo Please create .env with your Supabase credentials
    pause
    exit /b 1
)

echo.
echo STEP 2: Run SQL Migration
echo --------------------------------------
echo.
echo Please follow these steps:
echo 1. Open https://supabase.com/dashboard
echo 2. Go to SQL Editor
echo 3. Copy content from: SQL\separate-print-design-tables.sql
echo 4. Paste and click 'Run'
echo.
set /p openfile="Open SQL file now? (Y/N): "
if /i "%openfile%"=="Y" (
    notepad SQL\separate-print-design-tables.sql
)

echo.
echo After running SQL in Supabase...
pause

echo.
echo STEP 3: Verifying migration...
echo --------------------------------------
if exist verify-migration.js (
    node verify-migration.js
    if errorlevel 1 (
        echo [ERROR] Verification failed
        pause
        exit /b 1
    )
) else (
    echo [ERROR] verify-migration.js not found
)

echo.
pause

echo.
echo STEP 4: Testing new tables...
echo --------------------------------------
if exist test-new-tables.js (
    node test-new-tables.js
) else (
    echo [ERROR] test-new-tables.js not found
)

echo.
pause

echo.
echo STEP 5: Restart server
echo --------------------------------------
echo.
echo You need to restart your backend server:
echo   cd server
echo   npm run dev
echo.
set /p restart="Restart server now? (Y/N): "
if /i "%restart%"=="Y" (
    cd server
    npm run dev
) else (
    echo.
    echo Remember to restart the server manually!
)

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test creating orders in your app
echo 2. Check admin dashboard
echo 3. Verify user dashboard
echo.
echo Documentation:
echo - MIGRATION_README.md
echo - docs\SEPARATE_TABLES_GUIDE.md
echo.
pause
