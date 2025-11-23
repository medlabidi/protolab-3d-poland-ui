@echo off
REM 🚀 Script de Déploiement Rapide Vercel (Windows)

echo 🎨 ProtoLab - Déploiement Vercel
echo ================================
echo.

REM Vérifier si Vercel CLI est installé
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Vercel CLI n'est pas installé
    echo 📦 Installation en cours...
    npm install -g vercel
)

REM Nettoyer les anciens builds
echo 🧹 Nettoyage des anciens builds...
if exist client\dist rmdir /s /q client\dist

REM Build local pour test
echo 🔨 Build du projet...
cd client
call npm install
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build réussi!
    cd ..
    
    REM Déploiement
    echo.
    echo 🚀 Déploiement sur Vercel...
    echo.
    
    set /p deploy_prod="Déployer en production ? (y/n): "
    if /i "%deploy_prod%"=="y" (
        call vercel --prod
    ) else (
        call vercel
    )
    
    echo.
    echo ✨ Déploiement terminé!
) else (
    echo ❌ Erreur lors du build
    exit /b 1
)
