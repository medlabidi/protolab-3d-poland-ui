@echo off
REM Installation et démarrage rapide du projet ProtoLab (Windows)

echo.
echo 🚀 ProtoLab 3D Printing - Installation Rapide
echo =============================================
echo.

REM Vérifier que npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm n'est pas installé. Veuillez installer Node.js.
    pause
    exit /b 1
)

echo 📦 Étape 1 : Installation des dépendances racine...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation racine
    pause
    exit /b 1
)

echo.
echo 📦 Étape 2 : Installation des dépendances client...
call npm install --prefix client
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation client
    pause
    exit /b 1
)

echo.
echo 📦 Étape 3 : Installation des dépendances server...
call npm install --prefix server
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation server
    pause
    exit /b 1
)

echo.
echo ✅ Installation complète !
echo.
echo 🚀 Pour démarrer le développement :
echo.
echo    npm run dev
echo.
echo    Ou individuellement :
echo    - Frontend : npm run dev:client (port 8080)
echo    - Backend  : npm run dev:server (port 5000)
echo.
echo 📚 Documentation :
echo    - SETUP.md          : Structure complète
echo    - NEXT_STEPS.md     : Prochaines étapes
echo    - SUMMARY.md        : Résumé des corrections
echo    - PROJECT_STRUCTURE.md : Vue d'ensemble
echo.
echo 🎉 Ready to rock! 🚀
echo.
pause
