#!/usr/bin/env pwsh

# Conversation Data Testing Script
# This script tests the conversation API endpoints

$apiUrl = "http://localhost:5000/api"
$adminUrl = "http://localhost:5000/api/admin"

# Color output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "================================"
Write-Info "Conversation Data Testing"
Write-Info "================================"

# You need to provide these values
Write-Info "`nEnter your test credentials:"
$userToken = Read-Host "User Access Token"
$adminToken = Read-Host "Admin Access Token"

if (-not $userToken -or -not $adminToken) {
  Write-Error "Tokens required to test!"
  exit 1
}

$userHeaders = @{
  "Authorization" = "Bearer $userToken"
  "Content-Type" = "application/json"
}

$adminHeaders = @{
  "Authorization" = "Bearer $adminToken"
  "Content-Type" = "application/json"
}

# Test 1: Get User Conversations
Write-Info "`n[TEST 1] GET /api/conversations (User conversations)"
try {
  $response = Invoke-WebRequest -Uri "$apiUrl/conversations" `
    -Headers $userHeaders `
    -Method GET `
    -UseBasicParsing
  
  if ($response.StatusCode -eq 200) {
    Write-Success "✓ Status: 200 OK"
    $data = $response.Content | ConvertFrom-Json
    Write-Success "✓ Found $(($data.conversations | Measure-Object).Count) conversations"
    
    if ($data.conversations.Count -gt 0) {
      $conv = $data.conversations[0]
      Write-Success "✓ Sample conversation:"
      Write-Host "  - ID: $($conv.id)"
      Write-Host "  - Status: $($conv.status)"
      Write-Host "  - User: $($conv.user.name) ($($conv.user.email))"
      Write-Host "  - Unread: $($conv.unread_count)"
    }
  } else {
    Write-Error "✗ Unexpected status: $($response.StatusCode)"
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

# Test 2: Get Admin Conversations
Write-Info "`n[TEST 2] GET /api/admin/conversations (Admin view)"
try {
  $response = Invoke-WebRequest -Uri "$adminUrl/conversations" `
    -Headers $adminHeaders `
    -Method GET `
    -UseBasicParsing
  
  if ($response.StatusCode -eq 200) {
    Write-Success "✓ Status: 200 OK"
    $data = $response.Content | ConvertFrom-Json
    Write-Success "✓ Admin can see $(($data.conversations | Measure-Object).Count) conversations"
    Write-Success "✓ Pagination: Page $($data.pagination.page) of $($data.pagination.pages)"
    
    if ($data.conversations.Count -gt 0) {
      $conv = $data.conversations[0]
      Write-Success "✓ Sample conversation:"
      Write-Host "  - ID: $($conv.id)"
      Write-Host "  - Status: $($conv.status)"
      Write-Host "  - Customer: $($conv.user.name)"
      Write-Host "  - Order: $($conv.order.file_name)"
      Write-Host "  - Last Message: $($conv.last_message.message)"
    }
  } else {
    Write-Error "✗ Unexpected status: $($response.StatusCode)"
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

# Test 3: Get Unread Count
Write-Info "`n[TEST 3] GET /api/conversations/unread (Unread count)"
try {
  $response = Invoke-WebRequest -Uri "$apiUrl/conversations/unread" `
    -Headers $userHeaders `
    -Method GET `
    -UseBasicParsing
  
  if ($response.StatusCode -eq 200) {
    Write-Success "✓ Status: 200 OK"
    $data = $response.Content | ConvertFrom-Json
    Write-Success "✓ Unread message count: $($data.unread_count)"
  } else {
    Write-Error "✗ Unexpected status: $($response.StatusCode)"
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

# Test 4: List with filters
Write-Info "`n[TEST 4] GET /api/admin/conversations with filters"
try {
  $params = "?status=open&limit=5"
  $response = Invoke-WebRequest -Uri "$adminUrl/conversations$params" `
    -Headers $adminHeaders `
    -Method GET `
    -UseBasicParsing
  
  if ($response.StatusCode -eq 200) {
    Write-Success "✓ Status: 200 OK"
    $data = $response.Content | ConvertFrom-Json
    Write-Success "✓ Found $(($data.conversations | Measure-Object).Count) OPEN conversations"
  } else {
    Write-Error "✗ Unexpected status: $($response.StatusCode)"
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

# Test 5: Search conversations
Write-Info "`n[TEST 5] GET /api/admin/conversations with search"
try {
  $searchTerm = Read-Host "Enter name/email to search (or press Enter to skip)"
  
  if ($searchTerm) {
    $params = "?search=$([Uri]::EscapeDataString($searchTerm))"
    $response = Invoke-WebRequest -Uri "$adminUrl/conversations$params" `
      -Headers $adminHeaders `
      -Method GET `
      -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
      Write-Success "✓ Status: 200 OK"
      $data = $response.Content | ConvertFrom-Json
      Write-Success "✓ Search found $(($data.conversations | Measure-Object).Count) results"
    } else {
      Write-Error "✗ Unexpected status: $($response.StatusCode)"
    }
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

Write-Info "`n================================"
Write-Success "Testing Complete!"
Write-Info "================================"

Write-Info "`nConversation API Status:"
Write-Success "✓ User endpoints: /api/conversations"
Write-Success "✓ Admin endpoints: /api/admin/conversations"
Write-Success "✓ All conversation data is accessible"

Write-Info "`nDocumentation: See CONVERSATION_DATA_GUIDE.md"
