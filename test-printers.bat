@echo off
echo ========================================
echo Test Printers API
echo ========================================
echo.

REM Check if token is provided
if "%ADMIN_TOKEN%"=="" (
    echo [INFO] Pas de token fourni - Test sans authentification
    echo.
    echo Pour tester avec authentification:
    echo 1. Connectez-vous sur http://localhost:5173/admin/login
    echo 2. Ouvrez la console (F12)
    echo 3. Tapez: localStorage.accessToken
    echo 4. Copiez le token
    echo 5. Lancez:
    echo    set ADMIN_TOKEN=votre-token-ici
    echo    test-printers.bat
    echo.
    pause
)

echo Testing API...
echo.
node test-printers-api.js

echo.
pause
