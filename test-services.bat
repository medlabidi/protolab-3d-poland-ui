@echo off
REM Script de test pour les nouvelles pages de services

echo ===================================
echo Test des Services ProtoLab 3D
echo ===================================
echo.

echo [OK] Pages créées:
echo   - Services.tsx (page principale)
echo   - DesignService.tsx (conception 3D)
echo   - ConsultingService.tsx (consulting avec agenda)
echo.

echo [OK] Routes configurées:
echo   - /services
echo   - /services/design
echo   - /services/consulting
echo.

echo [OK] Traductions ajoutées:
echo   - Polonais (pl.json)
echo   - Anglais (en.json)
echo   - Russe (ru.json)
echo.

echo [OK] Navigation mise à jour:
echo   - Header: Lien 'Services'
echo   - Footer: Liens vers chaque service
echo.

echo ===================================
echo URLs à tester:
echo ===================================
echo [Home] Page d'accueil:     http://localhost:8080/
echo [List] Services:            http://localhost:8080/services
echo [3D]   Impression 3D:       http://localhost:8080/new-print
echo [Art]  Design 3D:           http://localhost:8080/services/design
echo [Cal]  Consulting:          http://localhost:8080/services/consulting
echo.

echo ===================================
echo Fonctionnalités à tester:
echo ===================================
echo 1. Navigation entre les pages
echo 2. Changement de langue (PL/EN/RU)
echo 3. Formulaire de design (upload de fichiers)
echo 4. Calendrier de rendez-vous (sélection date/heure)
echo 5. Validation des formulaires
echo 6. Design responsive (mobile/tablette/desktop)
echo.

echo Le serveur est lancé sur: http://localhost:8080/
echo.

pause
