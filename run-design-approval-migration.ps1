# Run Design Approval Migration
# This script adds approval system columns to design_requests table

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Design Approval System Migration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Loaded: $name" -ForegroundColor Gray
        }
    }
}

$dbUrl = $env:DATABASE_URL

if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not found in environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running migration: add-design-approval-system.sql" -ForegroundColor Yellow
Write-Host ""

# Run the migration
try {
    $sqlFile = "SQL/add-design-approval-system.sql"
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "ERROR: Migration file not found: $sqlFile" -ForegroundColor Red
        exit 1
    }

    $sql = Get-Content $sqlFile -Raw
    
    # Use psql to execute the migration
    $env:PGPASSWORD = ($dbUrl -replace '.*://[^:]+:([^@]+)@.*', '$1')
    $dbHost = ($dbUrl -replace '.*@([^:]+):.*', '$1')
    $dbPort = ($dbUrl -replace '.*:(\d+)/.*', '$1')
    $dbName = ($dbUrl -replace '.*/([^?]+).*', '$1')
    $dbUser = ($dbUrl -replace '.*://([^:]+):.*', '$1')

    Write-Host "Connecting to database..." -ForegroundColor Cyan
    Write-Host "Host: $dbHost" -ForegroundColor Gray
    Write-Host "Port: $dbPort" -ForegroundColor Gray
    Write-Host "Database: $dbName" -ForegroundColor Gray
    Write-Host "User: $dbUser" -ForegroundColor Gray
    Write-Host ""

    # Execute the SQL
    $sql | psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f -

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Added columns:" -ForegroundColor Cyan
        Write-Host "  - user_approval_status (pending/approved/rejected)" -ForegroundColor Gray
        Write-Host "  - user_approval_at (timestamp)" -ForegroundColor Gray
        Write-Host "  - user_rejection_reason (text)" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✗ Migration failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
