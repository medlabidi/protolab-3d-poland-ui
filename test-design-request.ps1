# Test script for Design Assistance API
# This script tests the design request submission

$API_URL = "http://localhost:5001/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Design Assistance API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get authentication token
Write-Host "Step 1: Authenticating..." -ForegroundColor Yellow
$loginData = @{
    email = "mayssajarbou4@gmail.com"  # Update with your test user email
    password = "your_password"           # Update with your test user password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "✓ Authenticated successfully" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Submit a design request
Write-Host "Step 2: Submitting design request..." -ForegroundColor Yellow

# Prepare multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

# Create form data
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"projectName`"$LF",
    "Test Design Request - Mechanical Part",
    "--$boundary",
    "Content-Disposition: form-data; name=`"ideaDescription`"$LF",
    "I need a custom mechanical part for my robotics project. The part should be compatible with standard servo motors.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"usage`"$LF",
    "mechanical",
    "--$boundary",
    "Content-Disposition: form-data; name=`"usageDetails`"$LF",
    "This part will be used in a robotic arm project. It needs to withstand repeated movements and some weight.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"approximateDimensions`"$LF",
    "50mm x 30mm x 20mm",
    "--$boundary",
    "Content-Disposition: form-data; name=`"desiredMaterial`"$LF",
    "PLA or ABS",
    "--$boundary",
    "Content-Disposition: form-data; name=`"requestChat`"$LF",
    "true",
    "--$boundary--$LF"
)

$body = $bodyLines -join $LF

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/design-requests" -Method POST -Headers $headers -Body $body
    
    Write-Host "✓ Design request submitted successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
} catch {
    Write-Host "✗ Submission failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 3: Get user's design requests
Write-Host "Step 3: Retrieving user's design requests..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $requests = Invoke-RestMethod -Uri "$API_URL/design-requests/my" -Method GET -Headers $headers
    
    Write-Host "✓ Retrieved design requests successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Design Requests:" -ForegroundColor Cyan
    
    if ($requests.requests -and $requests.requests.Count -gt 0) {
        foreach ($req in $requests.requests) {
            Write-Host "  - ID: $($req.id)" -ForegroundColor White
            Write-Host "    Name: $($req.name)" -ForegroundColor Gray
            Write-Host "    Status: $($req.status)" -ForegroundColor $(if ($req.status -eq 'completed') { 'Green' } else { 'Yellow' })
            Write-Host "    Created: $($req.created_at)" -ForegroundColor Gray
            Write-Host ""
        }
        Write-Host "Total: $($requests.requests.Count) request(s)" -ForegroundColor Cyan
    } else {
        Write-Host "  No design requests found" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ Failed to retrieve requests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
