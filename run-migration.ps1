# Migration Automation Script for ProtoLab Database
# This script helps you execute the migration step-by-step

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ProtoLab Database Migration Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "This script will help you:" -ForegroundColor Yellow
Write-Host "1. Verify your Supabase connection" -ForegroundColor White
Write-Host "2. Run the migration (you'll execute SQL manually)" -ForegroundColor White
Write-Host "3. Verify the migration succeeded" -ForegroundColor White
Write-Host "4. Test the new tables" -ForegroundColor White
Write-Host "`n"

# Function to pause
function Pause {
    Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 1: Check environment
Write-Host "STEP 1: Checking environment..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray

if (Test-Path .env) {
    Write-Host "[OK] .env file found" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content .env -Raw
    if ($envContent -match "SUPABASE_URL") {
        Write-Host "[OK] SUPABASE_URL is set" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] SUPABASE_URL not found in .env" -ForegroundColor Red
    }
    
    if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY") {
        Write-Host "[OK] SUPABASE_SERVICE_ROLE_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] SUPABASE_SERVICE_ROLE_KEY not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n"
Pause

# Step 2: Instructions for SQL migration
Write-Host "`nSTEP 2: Run SQL Migration in Supabase" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "`n"

Write-Host "Follow these steps:" -ForegroundColor Yellow
Write-Host "1. Open your Supabase Dashboard" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Create a new query" -ForegroundColor White
Write-Host "4. Copy the SQL from: SQL/separate-print-design-tables.sql" -ForegroundColor White
Write-Host "5. Paste and click 'Run'" -ForegroundColor White
Write-Host "`n"

Write-Host "SQL file location:" -ForegroundColor Yellow
Write-Host "  $(Get-Location)\SQL\separate-print-design-tables.sql" -ForegroundColor White
Write-Host "`n"

$openSQL = Read-Host "Do you want to open the SQL file now? (y/n)"
if ($openSQL -eq 'y') {
    $sqlPath = Join-Path (Get-Location) "SQL\separate-print-design-tables.sql"
    if (Test-Path $sqlPath) {
        Start-Process notepad $sqlPath
        Write-Host "[OK] SQL file opened in notepad" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] SQL file not found at: $sqlPath" -ForegroundColor Red
    }
}

Write-Host "`n"
Write-Host "After running the SQL in Supabase..." -ForegroundColor Yellow
Pause

# Step 3: Verify migration
Write-Host "`nSTEP 3: Verifying Migration..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "`n"

if (Test-Path "verify-migration.js") {
    Write-Host "Running verification script..." -ForegroundColor Yellow
    node verify-migration.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[OK] Verification completed" -ForegroundColor Green
    } else {
        Write-Host "`n[ERROR] Verification failed" -ForegroundColor Red
        Write-Host "Please check the error messages above" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[ERROR] verify-migration.js not found" -ForegroundColor Red
}

Write-Host "`n"
Pause

# Step 4: Test new tables
Write-Host "`nSTEP 4: Testing New Tables..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "`n"

if (Test-Path "test-new-tables.js") {
    Write-Host "Running table tests..." -ForegroundColor Yellow
    node test-new-tables.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[OK] Tests completed" -ForegroundColor Green
    } else {
        Write-Host "`n[ERROR] Tests failed" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] test-new-tables.js not found" -ForegroundColor Red
}

Write-Host "`n"
Pause

# Step 5: Restart server
Write-Host "`nSTEP 5: Restart Backend Server" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "`n"

Write-Host "You need to restart your backend server:" -ForegroundColor Yellow
Write-Host "1. Stop the current server (Ctrl+C if running)" -ForegroundColor White
Write-Host "2. cd server" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
Write-Host "`n"

$restartNow = Read-Host "Do you want to restart the server now? (y/n)"
if ($restartNow -eq 'y') {
    Write-Host "`nStarting server..." -ForegroundColor Yellow
    Set-Location server
    npm run dev
} else {
    Write-Host "`nRemember to restart the server manually!" -ForegroundColor Yellow
}

# Summary
Write-Host "`n"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration Process Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test creating orders through your application" -ForegroundColor White
Write-Host "2. Verify admin dashboard displays correctly" -ForegroundColor White
Write-Host "3. Check user dashboard shows their orders" -ForegroundColor White
Write-Host "4. Monitor for any errors in the console" -ForegroundColor White
Write-Host "`n"

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- Full guide: docs/SEPARATE_TABLES_GUIDE.md" -ForegroundColor White
Write-Host "- Quick reference: docs/SEPARATE_TABLES_SUMMARY.md" -ForegroundColor White
Write-Host "- Architecture: docs/DATABASE_ARCHITECTURE.md" -ForegroundColor White
Write-Host "`n"

Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
