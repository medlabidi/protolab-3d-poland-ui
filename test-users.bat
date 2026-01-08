@echo off
echo.
echo ========================================
echo Testing Admin Users API
echo ========================================
echo.

if not defined ADMIN_TOKEN (
    echo Warning: ADMIN_TOKEN not set
    echo Set it with: set ADMIN_TOKEN=your-token-here
    echo.
)

node test-users-api.js

echo.
pause
