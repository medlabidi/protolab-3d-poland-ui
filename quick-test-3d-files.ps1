# Test 3D File Upload - Quick Test Guide
# ========================================

Write-Host "Testing 3D File Upload - Admin to User" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify system is running
Write-Host "[Step 1] Checking system status..." -ForegroundColor Yellow
$serverRunning = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
$clientRunning = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue

if ($serverRunning) {
    Write-Host "  Server: RUNNING on port 5001" -ForegroundColor Green
} else {
    Write-Host "  Server: NOT RUNNING - Start with 'npm run dev'" -ForegroundColor Red
    exit 1
}

if ($clientRunning) {
    Write-Host "  Client: RUNNING on port 8080" -ForegroundColor Green
} else {
    Write-Host "  Client: NOT RUNNING" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "ADMIN TESTING (Send 3D File + Price)" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Open: http://localhost:8080/admin/login" -ForegroundColor White
Write-Host "   Login as: mahmoud@protolab.info" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Go to: Design Assistance (sidebar)" -ForegroundColor White
Write-Host ""

Write-Host "3. Select a design request and click the EYE icon" -ForegroundColor White
Write-Host ""

Write-Host "4. In conversation panel:" -ForegroundColor White
Write-Host "   - Click Upload button" -ForegroundColor Cyan
Write-Host "   - Select a valid .STL file (< 5MB recommended)" -ForegroundColor Cyan
Write-Host "   - Enter Proposed Price: 150.00" -ForegroundColor Cyan
Write-Host "   - Type message: 'Here is your 3D design'" -ForegroundColor Cyan
Write-Host "   - Click SEND" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Open Browser Console (F12) and verify:" -ForegroundColor White
Write-Host "   [Admin] Sending message with file: ..." -ForegroundColor Green
Write-Host "   [Admin] Response status: 200 OK" -ForegroundColor Green
Write-Host "   [Admin] File uploaded successfully" -ForegroundColor Green
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "USER TESTING (View 3D File)" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Logout from admin" -ForegroundColor White
Write-Host ""

Write-Host "2. Login as regular user" -ForegroundColor White
Write-Host "   (Use any user account you created)" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Go to: Design Assistance" -ForegroundColor White
Write-Host ""

Write-Host "4. Click 'View Conversation' on your design request" -ForegroundColor White
Write-Host ""

Write-Host "5. You should see:" -ForegroundColor White
Write-Host "   - Admin message with your text" -ForegroundColor Green
Write-Host "   - Price: 'Proposed Price: 150.00 PLN'" -ForegroundColor Green
Write-Host "   - 3D file attachment card" -ForegroundColor Green
Write-Host ""

Write-Host "6. Click: 'Open 3D Viewer (Fullscreen)'" -ForegroundColor White
Write-Host ""

Write-Host "7. Verify the 3D viewer:" -ForegroundColor White
Write-Host "   - Loading spinner appears" -ForegroundColor Green
Write-Host "   - 3D model loads and displays" -ForegroundColor Green
Write-Host "   - Badge shows 'Loaded from local server'" -ForegroundColor Green
Write-Host "   - Can rotate with mouse" -ForegroundColor Green
Write-Host "   - Can zoom with scroll" -ForegroundColor Green
Write-Host "   - NO download button (view only)" -ForegroundColor Green
Write-Host "   - Approve/Reject buttons visible" -ForegroundColor Green
Write-Host ""

Write-Host "8. Check Browser Console (F12):" -ForegroundColor White
Write-Host "   [S3FileViewer] Opening fullscreen..." -ForegroundColor Green
Write-Host "   [ModelViewer] Loading model..." -ForegroundColor Green
Write-Host "   [STL Loader] Response status: 200 OK" -ForegroundColor Green
Write-Host "   [STL Loader] Successfully parsed STL file" -ForegroundColor Green
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "TROUBLESHOOTING" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If file upload fails:" -ForegroundColor Red
Write-Host "  1. Check server terminal for errors" -ForegroundColor White
Write-Host "  2. Run: .\test-file-upload.ps1" -ForegroundColor White
Write-Host "  3. Try a smaller file (< 5MB)" -ForegroundColor White
Write-Host "  4. Verify file format: .stl, .obj, or .3mf" -ForegroundColor White
Write-Host ""

Write-Host "If 3D viewer shows error:" -ForegroundColor Red
Write-Host "  1. Check browser console for errors" -ForegroundColor White
Write-Host "  2. Verify file exists in: server/uploads/" -ForegroundColor White
Write-Host "  3. Clear browser cache and reload" -ForegroundColor White
Write-Host "  4. Check file is not corrupted (not HTML)" -ForegroundColor White
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Ready to test! Follow steps above." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check for test file
Write-Host "Looking for valid test files in uploads..." -ForegroundColor Yellow
$uploads = "c:\proto\landing_page\protolab-3d-poland-ui\server\uploads"
$validFiles = Get-ChildItem $uploads -Filter "*.stl" | Where-Object {
    $_.Length -gt 10000  # More than 10KB
} | Sort-Object LastWriteTime -Descending | Select-Object -First 3

if ($validFiles) {
    Write-Host ""
    Write-Host "Valid test files found:" -ForegroundColor Green
    foreach ($file in $validFiles) {
        $sizeKB = [math]::Round($file.Length / 1024, 2)
        Write-Host "  - $($file.Name) ($sizeKB KB)" -ForegroundColor Cyan
    }
} else {
    Write-Host "No valid test files found. Upload a new file from admin." -ForegroundColor Yellow
}

Write-Host ""
