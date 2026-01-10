# Diagnostic rapide pour le problème de chargement des imprimantes
Write-Host "🔍 Diagnostic Printers API" -ForegroundColor Cyan
Write-Host "=" -NoNewline; 1..60 | ForEach-Object { Write-Host "=" -NoNewline }; Write-Host ""

# 1. Vérifier les variables d'environnement
Write-Host "`n1️⃣  Variables d'environnement:" -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "   ✅ Fichier .env trouvé" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "   ✅ VITE_SUPABASE_URL configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_URL manquant" -ForegroundColor Red
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY") {
        Write-Host "   ✅ VITE_SUPABASE_ANON_KEY configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_ANON_KEY manquant" -ForegroundColor Red
    }
    
    if ($envContent -match "VITE_API_URL") {
        $apiUrl = ($envContent | Select-String "VITE_API_URL=(.+)").Matches.Groups[1].Value.Trim()
        Write-Host "   ✅ VITE_API_URL = $apiUrl" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  VITE_API_URL non défini (utilisera /api par défaut)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Fichier .env introuvable!" -ForegroundColor Red
    Write-Host "   → Copiez .env.example vers .env et configurez les variables" -ForegroundColor Gray
}

# 2. Vérifier les fichiers SQL
Write-Host "`n2️⃣  Fichiers SQL de migration:" -ForegroundColor Yellow

$sqlFiles = @(
    "SQL\create-printers-table.sql",
    "SQL\add-printer-maintenance-costs.sql"
)

foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
    }
}

# 3. Vérifier les endpoints API
Write-Host "`n3️⃣  Endpoints API:" -ForegroundColor Yellow

$apiFiles = @(
    "api\printers\index.ts",
    "api\materials\index.ts",
    "api\suppliers\index.ts"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
    }
}

# 4. Vérifier le composant AdminPrinters
Write-Host "`n4️⃣  Frontend:" -ForegroundColor Yellow

if (Test-Path "client\src\pages\admin\AdminPrinters.tsx") {
    Write-Host "   ✅ AdminPrinters.tsx existe" -ForegroundColor Green
    
    $content = Get-Content "client\src\pages\admin\AdminPrinters.tsx" -Raw
    
    if ($content -match "fetchPrinters") {
        Write-Host "   ✅ Fonction fetchPrinters() présente" -ForegroundColor Green
    }
    
    if ($content -match "useEffect") {
        Write-Host "   ✅ useEffect() pour le chargement initial" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ AdminPrinters.tsx introuvable" -ForegroundColor Red
}

# 5. Instructions de résolution
Write-Host "`n" + "=" -NoNewline; 1..60 | ForEach-Object { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host "📋 Instructions de résolution:" -ForegroundColor Cyan
Write-Host "=" -NoNewline; 1..60 | ForEach-Object { Write-Host "=" -NoNewline }; Write-Host ""

Write-Host "`n✅ ÉTAPE 1: Créer la table dans Supabase" -ForegroundColor Green
Write-Host "   1. Ouvrez https://app.supabase.com" -ForegroundColor Gray
Write-Host "   2. Sélectionnez votre projet" -ForegroundColor Gray
Write-Host "   3. Allez dans SQL Editor" -ForegroundColor Gray
Write-Host "   4. Copiez le contenu de: SQL\create-printers-table.sql" -ForegroundColor Gray
Write-Host "   5. Exécutez (Run ou F5)" -ForegroundColor Gray

Write-Host "`n✅ ÉTAPE 2: Vérifier la table" -ForegroundColor Green
Write-Host "   Exécutez dans SQL Editor:" -ForegroundColor Gray
Write-Host "   SELECT * FROM printers;" -ForegroundColor White

Write-Host "`n✅ ÉTAPE 3: Tester l'application" -ForegroundColor Green
Write-Host "   1. Démarrez le serveur: npm run dev" -ForegroundColor Gray
Write-Host "   2. Ouvrez: http://localhost:5173/admin/printers" -ForegroundColor Gray
Write-Host "   3. Vérifiez la console (F12) pour les logs" -ForegroundColor Gray

Write-Host "`n✅ ÉTAPE 4: Si le problème persiste" -ForegroundColor Green
Write-Host "   - Consultez: docs\FIX_PRINTERS_LOADING.md" -ForegroundColor Gray
Write-Host "   - Vérifiez les logs de la console navigateur" -ForegroundColor Gray
Write-Host "   - Testez l'API: node test-printers-api.js" -ForegroundColor Gray

Write-Host "`n🔗 Liens utiles:" -ForegroundColor Cyan
Write-Host "   - Documentation: docs\FIX_PRINTERS_LOADING.md" -ForegroundColor Gray
Write-Host "   - SQL migration: SQL\create-printers-table.sql" -ForegroundColor Gray
Write-Host "   - Test API: test-printers-api.js" -ForegroundColor Gray

Write-Host "`n"
