# Test 3D File Upload
# This script helps test the file upload functionality

Write-Host "Testing 3D File Upload System" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if uploads directory exists
$uploadsDir = "c:\proto\landing_page\protolab-3d-poland-ui\server\uploads"
Write-Host "Checking uploads directory..." -ForegroundColor Yellow
if (Test-Path $uploadsDir) {
    Write-Host "   Uploads directory exists: $uploadsDir" -ForegroundColor Green
} else {
    Write-Host "   Uploads directory NOT found!" -ForegroundColor Red
    exit 1
}

# List recent uploads
Write-Host ""
Write-Host "Recent uploads (last 10):" -ForegroundColor Yellow
$files = Get-ChildItem $uploadsDir | Sort-Object LastWriteTime -Descending | Select-Object -First 10

if ($files.Count -eq 0) {
    Write-Host "   No files found in uploads directory" -ForegroundColor Yellow
} else {
    foreach ($file in $files) {
        $sizeKB = [math]::Round($file.Length / 1024, 2)
        $age = (Get-Date) - $file.LastWriteTime
        
        # Check if file is likely corrupted (HTML error page)
        $bytes = Get-Content $file.FullName -Encoding Byte -TotalCount 10
        $header = -join ($bytes | ForEach-Object { [char]$_ })
        
        $isLikelyHTML = $header.StartsWith("<!doc") -or $header.StartsWith("<!DOC") -or $header.StartsWith("<html")
        $isLikelySTL = $header.StartsWith("solid") -or ($bytes[0] -ge 0x00 -and $bytes[0] -le 0x50)
        
        $color = "White"
        $status = "OK Binary"
        
        if ($isLikelyHTML) {
            $color = "Red"
            $status = "ERROR HTML (Corrupted)"
        } elseif ($sizeKB -lt 3) {
            $color = "Yellow"
            $status = "WARNING Very Small"
        } elseif ($isLikelySTL) {
            $color = "Green"
            $status = "OK Valid STL"
        }
        
        Write-Host "   " -NoNewline
        Write-Host "$($file.Name)" -ForegroundColor $color
        Write-Host "      Size: $sizeKB KB | Age: $($age.Hours)h $($age.Minutes)m | $status" -ForegroundColor Gray
    }
}

# Check server status
Write-Host ""
Write-Host "Checking server status..." -ForegroundColor Yellow
$serverPort = 5001
$connection = Get-NetTCPConnection -LocalPort $serverPort -State Listen -ErrorAction SilentlyContinue

if ($connection) {
    Write-Host "   Server is running on port $serverPort" -ForegroundColor Green
} else {
    Write-Host "   Server is NOT running on port $serverPort" -ForegroundColor Red
    Write-Host "   Start the server with: npm run dev" -ForegroundColor Yellow
}

# Check client status
$clientPort = 8080
$clientConnection = Get-NetTCPConnection -LocalPort $clientPort -State Listen -ErrorAction SilentlyContinue

if ($clientConnection) {
    Write-Host "   Client is running on port $clientPort" -ForegroundColor Green
} else {
    Write-Host "   Client is NOT running on port $clientPort" -ForegroundColor Yellow
}

# Check for corrupted files
Write-Host ""
Write-Host "Scanning for corrupted files..." -ForegroundColor Yellow
$corruptedFiles = Get-ChildItem $uploadsDir | Where-Object {
    $bytes = Get-Content $_.FullName -Encoding Byte -TotalCount 10
    $header = -join ($bytes | ForEach-Object { [char]$_ })
    $header.StartsWith("<!doc") -or $header.StartsWith("<!DOC") -or $header.StartsWith("<html")
}

if ($corruptedFiles.Count -gt 0) {
    Write-Host "   Found $($corruptedFiles.Count) corrupted file(s):" -ForegroundColor Red
    foreach ($file in $corruptedFiles) {
        Write-Host "      - $($file.Name)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   Clean up corrupted files? (y/n): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -eq 'y') {
        foreach ($file in $corruptedFiles) {
            Remove-Item $file.FullName -Force
            Write-Host "      Deleted: $($file.Name)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   No corrupted files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure server and client are both running" -ForegroundColor White
Write-Host "   2. Login as admin at http://localhost:8080/admin/login" -ForegroundColor White
Write-Host "   3. Go to Design Assistance" -ForegroundColor White
Write-Host "   4. Upload a valid 3D file with a price" -ForegroundColor White
Write-Host "   5. Login as user and view the file" -ForegroundColor White
Write-Host ""
Write-Host "See ADMIN_USER_3D_FILE_TESTING_GUIDE.md for detailed instructions" -ForegroundColor Cyan

