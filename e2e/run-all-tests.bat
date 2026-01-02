@echo off
echo 🚀 Starting ProtoLab Overnight Test Suite
echo ==========================================
echo.

set ITERATION=1
set MAX_ITERATIONS=100

if not exist e2e-results mkdir e2e-results

:loop
if %ITERATION% GTR %MAX_ITERATIONS% goto end

echo 🔄 Test Iteration #%ITERATION%
echo Started at: %date% %time%

rem Run tests
call npx playwright test --reporter=html,json

rem Save results with timestamp
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
copy playwright-report\index.html e2e-results\report_%TIMESTAMP%.html 2>nul

echo Completed iteration #%ITERATION% at: %date% %time%
echo.

rem Sleep for 30 seconds
timeout /t 30 /nobreak >nul

set /a ITERATION+=1
goto loop

:end
echo ✅ Test suite completed all iterations
pause
