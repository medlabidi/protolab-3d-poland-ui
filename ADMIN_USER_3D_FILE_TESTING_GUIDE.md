# Admin to User 3D File Transfer - Testing Guide

## 🎯 Overview
This guide will help you test the complete flow of an admin sending a 3D model file with a price to a user, and the user viewing it in their dashboard.

## 📋 Prerequisites
- Admin account with proper permissions
- User account (test user)
- Valid 3D file (.stl, .obj, .3mf format)
- Server running on port 5001
- Client running on port 8080

## ⚠️ Current Issue Identified
The uploaded file `1772484212131-352809934-1767739884529-Yes_No__6_Sided_Dice(3).stl` is corrupted - it's actually an HTML error page (2.4 KB) instead of a binary STL file.

### Possible Causes:
1. File upload middleware rejecting the file
2. Authentication issues during upload
3. CORS issues
4. File size/type validation failures

## 🔧 Step-by-Step Testing Procedure

### Step 1: Clean Up Old Test Data
```powershell
# Navigate to uploads directory
cd c:\proto\landing_page\protolab-3d-poland-ui\server\uploads

# Remove corrupted test files
Remove-Item "1772484212131-*.stl" -Force
Remove-Item "1772484113745-*.stl" -Force
```

### Step 2: Prepare a Valid Test File
1. Download a small, valid STL file (< 5MB for testing)
2. Recommended test file: [Benchy](https://www.thingiverse.com/thing:763622) or simple cube
3. Save it to your desktop for easy access

### Step 3: Admin Dashboard - Send 3D File with Price

#### 3.1 Login as Admin
1. Navigate to `http://localhost:8080/admin/login`
2. Login with admin credentials

#### 3.2 Open Design Assistance Admin Panel
1. Click **Design Assistance** in the admin sidebar
2. You should see a list of design requests from users

#### 3.3 Select a Design Request
1. Find a design request (or create a test request as a user first)
2. Click the **Eye icon** to open the conversation

#### 3.4 Send Message with 3D File and Price
1. In the conversation panel, you'll see:
   - Message input field
   - **Proposed Price (PLN)** input field
   - File attachment button

2. Fill in the fields:
   ```
   Message: "Here is your custom 3D model design"
   Proposed Price: 150.00
   File: [Attach your valid .stl file]
   ```

3. Click **Send** button

4. **Check browser console (F12)** for any errors:
   ```javascript
   // Look for these logs:
   [Admin] Sending message with file: {fileName: "...", fileSize: ..., fileType: "..."}
   [Admin] FormData prepared, sending to: http://localhost:5001/api/conversations/...
   [Admin] Response status: 200 OK
   ```

5. **Check server terminal** for upload confirmation:
   ```
   INFO: File uploaded successfully
   INFO: Uploaded 3D file to S3 (if S3 is configured)
   ```

### Step 4: Verify File Upload on Server

```powershell
# Check if file was saved correctly
cd c:\proto\landing_page\protolab-3d-poland-ui\server\uploads
Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 3 Name, Length, LastWriteTime | Format-Table

# Verify file is binary (not HTML)
$file = Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$bytes = Get-Content $file.FullName -Encoding Byte -TotalCount 10
$bytes | ForEach-Object { [System.Convert]::ToString($_, 16).PadLeft(2, '0') }

# STL file should start with either:
# - "solid " (ASCII STL): 73 6f 6c 69 64 20
# - Binary STL header: various bytes but NOT 3c 21 64 6f 63 (which is <!doc HTML)
```

### Step 5: User Dashboard - View 3D File

#### 5.1 Login as User
1. Logout from admin
2. Navigate to `http://localhost:8080/login`
3. Login with the user account that has the design request

#### 5.2 Open Design Assistance
1. Click **Design Assistance** in main navigation
2. Click **View Conversation** on your design request

#### 5.3 View the 3D Model
1. You should see the admin's message with:
   - Message text: "Here is your custom 3D model design"
   - Price information: "💰 Proposed Price: 150.00 PLN"
   - 3D file attachment card

2. Click **Open 3D Viewer (Fullscreen)** button

3. The fullscreen viewer should:
   - Show loading spinner
   - Load the 3D model
   - Display "📁 Loaded from local server" or "☁️ Loaded from AWS S3" badge
   - Allow rotation/zoom with mouse
   - Show **Approve Design & Proceed to Payment** button
   - Show **Reject Design** button

#### 5.4 Check Browser Console for Errors
```javascript
// Open console (F12) and look for:
[S3FileViewer] Opening fullscreen, resolving URL...
[S3FileViewer] Resolved file URL: { fileName: "...", originalUrl: "...", resolvedUrl: "http://...", ... }
[ModelViewer] Loading model: { url: "http://localhost:5001/uploads/...", fileName: "..." }
[STL Loader] Attempting to load from URL: http://...
[STL Loader] Response status: 200 OK
[STL Loader] Content-Length: 653684
[STL Loader] Received buffer size: 653684 bytes
[STL Loader] Successfully parsed STL file
[STL Loader] Successfully validated STL file
```

## 🐛 Troubleshooting

### Problem: File Shows as Corrupted
**Symptoms:**
- "Failed to load 3D preview"
- "The file appears to be empty or corrupted"

**Solution:**
1. Check server console for upload errors
2. Verify file in `/server/uploads` is binary STL (not HTML)
3. Try a different, smaller STL file
4. Check that admin is logged in when uploading
5. Clear browser cache

### Problem: File Not Uploading
**Symptoms:**
- Message sends but no file attached
- Error in console

**Solution:**
1. Check file meets requirements:
   - Supported format: .stl, .obj, .3mf
   - Size: < 200MB
   - Valid 3D model file
2. Check authentication token is valid
3. Restart server

### Problem: Download Button Appears
**Issue:** User should only VIEW, not download

**Solution:** 
- Remove download button from ModelViewerUrl component (already done in latest code)

### Problem: S3 URLs Not Working
**Symptoms:**
- Files saved as `s3://...` but can't load

**Solution:**
1. Configure AWS credentials in `server/.env`:
   ```env
   S3_ENDPOINT=s3.eu-central-1.amazonaws.com
   S3_REGION=eu-central-1
   S3_ACCESS_KEY_ID=your_key
   S3_SECRET_ACCESS_KEY=your_secret
   S3_BUCKET_NAME=protolab-3d-files
   ```
2. Or disable S3 and use local storage only

## ✅ Success Criteria

After following this guide, you should be able to:

1. ✅ Admin uploads a valid 3D file (.stl) with a price
2. ✅ File is saved correctly in `/server/uploads` as binary STL
3. ✅ User receives message with file attachment and price
4. ✅ User can open fullscreen 3D viewer
5. ✅ 3D model loads and displays correctly
6. ✅ User can rotate/zoom the model
7. ✅ User can approve or reject the design
8. ✅ No download button (view-only mode)

## 📝 Price Field Feature

The price functionality is ALREADY IMPLEMENTED:

### Admin Side:
- Field name: **Proposed Price (PLN)**
- Location: Conversation panel when sending a message
- Usage: Enter price (e.g., `150.00`) before sending message
- Result: Price is appended to message as `💰 Proposed Price: [amount] PLN`

### User Side:
- Displays in the message text
- User sees the proposed price before approving
- On approval, user proceeds to payment

## 🔄 Next Steps

1. Follow this testing guide step by step
2. If file upload fails, check browser and server console logs
3. Test with a small, known-good STL file first
4. Once working, test with actual design files

## 📸 Expected Result

User should see a fullscreen dialog like this:
```
┌─────────────────────────────────────────────────────────┐
│ 3D Model Viewer - filename.stl          [X] Close        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│              [3D Model Rendered Here]                     │
│                                                           │
│  📁 Loaded from local server                             │
├─────────────────────────────────────────────────────────┤
│  [✓ Approve Design & Proceed to Payment]  [X Reject]    │
└─────────────────────────────────────────────────────────┘
```

