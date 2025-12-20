# Clean Database and Storage Script
# This script cleans the database (except users table) and storage buckets

Write-Host "🧹 ProtoLab 3D Poland - Database & Storage Cleanup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "server\.env")) {
    Write-Host "❌ Error: server\.env file not found!" -ForegroundColor Red
    Write-Host "   Please ensure your environment variables are configured." -ForegroundColor Yellow
    exit 1
}

Write-Host "⚠️  WARNING: This will:" -ForegroundColor Yellow
Write-Host "   1. Delete ALL data from database tables (except users)" -ForegroundColor Yellow
Write-Host "   2. Delete ALL files from storage buckets" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"

if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📋 Step 1: Cleaning Database Tables..." -ForegroundColor Green
Write-Host "─────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "Please run the following SQL script in your Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "   scripts/clean-database.sql" -ForegroundColor Cyan
Write-Host ""
$dbDone = Read-Host "Press Enter when database cleanup is complete (or 'skip' to skip)"

if ($dbDone -ne "skip") {
    Write-Host "✅ Database cleanup acknowledged" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Step 2: Cleaning Storage Buckets..." -ForegroundColor Green
Write-Host "────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Run the storage cleanup script
try {
    Set-Location server
    npx tsx ../scripts/clean-storage-buckets.ts
    Set-Location ..
    Write-Host ""
    Write-Host "✅ All cleanup operations completed!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Error running storage cleanup: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "   - Database tables cleaned (users table preserved)" -ForegroundColor Gray
Write-Host "   - Storage buckets emptied" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
