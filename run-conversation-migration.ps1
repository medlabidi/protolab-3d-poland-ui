Write-Host "Adding design_request_id column to conversations table..." -ForegroundColor Cyan

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Green

# Read the SQL file
$sqlContent = Get-Content "SQL\add-design-request-to-conversations.sql" -Raw

# Execute the migration using Supabase REST API
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

# Split SQL into individual statements and execute each
$statements = $sqlContent -split ";"
$successCount = 0
$errorCount = 0

foreach ($statement in $statements) {
    $statement = $statement.Trim()
    if ($statement -and $statement -ne "" -and -not $statement.StartsWith("--")) {
        Write-Host "`nExecuting: $($statement.Substring(0, [Math]::Min(80, $statement.Length)))..." -ForegroundColor Yellow
        
        $body = @{
            query = $statement
        } | ConvertTo-Json

        try {
            Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop | Out-Null
            Write-Host "Success!" -ForegroundColor Green
            $successCount++
        } catch {
            # Try alternative method using pg_query
            try {
                $altBody = @{
                    sql = $statement
                } | ConvertTo-Json
                
                Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method Post -Headers $headers -Body $altBody | Out-Null
                Write-Host "Success (alt method)!" -ForegroundColor Green
                $successCount++
            } catch {
                Write-Host "Warning: $($_.Exception.Message)" -ForegroundColor Yellow
                $errorCount++
            }
        }
    }
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "Successful statements: $successCount" -ForegroundColor Green
Write-Host "Failed/Skipped statements: $errorCount" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nPlease verify the migration by running the SELECT query manually in Supabase SQL Editor" -ForegroundColor Magenta
Write-Host "Or use this Node.js script to execute via Supabase client..." -ForegroundColor Magenta
