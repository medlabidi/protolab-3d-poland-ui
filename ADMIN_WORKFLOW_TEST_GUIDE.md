# Admin Workflow Test Guide

## Prerequisites
- Admin account with proper role
- At least one test print order
- At least one test design assistance request
- Access to admin dashboard

## Test Checklist

### 1. Dashboard Notifications ✓
- [ ] Navigate to `/admin`
- [ ] Verify NO stat boxes visible (Total Orders, Pending Orders, etc.)
- [ ] Verify "Print Jobs" notification card appears (if print orders exist)
- [ ] Verify "Design Assistance" notification card appears (if design requests exist)
- [ ] Card shows correct count of jobs
- [ ] Click "Print Jobs" card → Navigates to `/admin/orders/print-jobs`
- [ ] Go back, click "Design Assistance" card → Navigates to `/admin/orders/design-assistance`

### 2. Print Jobs Page ✓
#### Status Organization
- [ ] Navigate to `/admin/orders/print-jobs`
- [ ] Verify 4 status columns visible:
  - Submitted (Yellow background)
  - In Queue (Blue background)
  - Printing (Purple background)
  - Finished (Green background)
- [ ] Each column shows job count badge
- [ ] Jobs appear in correct status column

#### Job Cards
- [ ] Each job card shows:
  - File name
  - Customer name
  - Date/time created
  - Price in PLN
  - Status dropdown
- [ ] Cards with unread messages show blue MessageCircle icon
- [ ] Hover effect works (card slightly highlighted)

#### Status Changes from Card
- [ ] Click status dropdown on a job card (WITHOUT clicking card itself)
- [ ] Select new status (e.g., "Submitted" → "In Queue")
- [ ] Verify job moves to new status column
- [ ] Verify success toast appears
- [ ] Verify status persists on page refresh

#### Job Details Popup
- [ ] Click on a job card (not the dropdown)
- [ ] Verify dialog opens showing:
  
  **Left Panel:**
  - [ ] File name displayed
  - [ ] Customer name and email
  - [ ] Material, color, quantity
  - [ ] Price
  - [ ] 3D model preview loads (if file_url exists)
  - [ ] Status dropdown works in dialog
  
  **Right Panel:**
  - [ ] "Conversation" header visible
  - [ ] Messages display correctly
  - [ ] User messages styled differently than engineer messages
  - [ ] Timestamps shown on each message
  - [ ] If no messages: "No messages yet" placeholder
  - [ ] "Open Full Chat" button visible (if conversation exists)

- [ ] Change status from dialog dropdown
- [ ] Verify status updates immediately in dialog
- [ ] Click "Open Full Chat" button
- [ ] Verify navigates to `/admin/conversations?open=<conversation_id>`
- [ ] Close dialog with X button or clicking outside

### 3. Design Assistance Page ✓
#### Status Organization
- [ ] Navigate to `/admin/orders/design-assistance`
- [ ] Verify 4 status columns visible:
  - Submitted (Yellow)
  - In Review (Blue)
  - In Progress (Purple)
  - Completed (Green)
- [ ] Each column shows request count badge
- [ ] Requests appear in correct status column

#### Request Cards
- [ ] Each request card shows:
  - Design description (truncated to 40 chars)
  - Customer name
  - Date/time created
  - Price in PLN
  - Status dropdown
- [ ] Cards with unread messages show blue MessageCircle icon
- [ ] Hover effect works

#### Status Changes from Card
- [ ] Click status dropdown on a request card
- [ ] Select new status (e.g., "Submitted" → "In Review")
- [ ] Verify request moves to new status column
- [ ] Verify success toast appears

#### Request Details Popup
- [ ] Click on a request card
- [ ] Verify dialog opens showing:
  
  **Left Panel:**
  - [ ] Customer name
  - [ ] Created date
  - [ ] Price
  - [ ] Full design description (not truncated)
  - [ ] Design requirements (if provided)
  - [ ] Reference images in 2x2 grid (if uploaded)
  - [ ] Images clickable and display correctly
  - [ ] Status dropdown works
  
  **Right Panel:**
  - [ ] "Conversation" header visible
  - [ ] Messages display with timestamps
  - [ ] File attachments show with FileIcon
  - [ ] Attachment names visible
  - [ ] Download icon on attachments
  - [ ] Clicking attachment opens/downloads file
  - [ ] Multiple attachments on single message work
  - [ ] "Open Full Chat" button works

- [ ] Change status from dialog
- [ ] Close dialog

### 4. Conversation Integration ✓
#### From Job/Request Popup
- [ ] Open any print job or design request
- [ ] Verify conversation loads in right panel
- [ ] If conversation doesn't exist: Shows "No messages yet" placeholder
- [ ] If messages exist: All messages displayed in chronological order
- [ ] Engineer messages have blue left border
- [ ] User messages have gray background
- [ ] System messages centered with smaller text

#### Message Attachments
- [ ] Find a message with attachments
- [ ] Verify attachments display below message
- [ ] Each attachment shows:
  - FileIcon (blue)
  - File name
  - Download icon
- [ ] Click attachment → Opens in new tab or downloads
- [ ] Multiple attachments displayed in row with wrap

### 5. Real-Time Updates (If Applicable) ✓
- [ ] Have another admin user change job status
- [ ] Refresh page
- [ ] Verify job appears in correct new status column
- [ ] Have customer send message
- [ ] Refresh page
- [ ] Verify MessageCircle icon appears on job card

### 6. Responsive Design ✓
#### Desktop (>1024px)
- [ ] Status columns display 2x2 grid (lg:grid-cols-2)
- [ ] Dialog shows 2 columns side-by-side

#### Tablet/Mobile (<1024px)
- [ ] Status columns stack vertically (grid-cols-1)
- [ ] Dialog shows single column layout
- [ ] Cards still fully functional
- [ ] Dialogs scrollable on small screens

### 7. Error Handling ✓
- [ ] Disconnect from internet
- [ ] Try to load print jobs page
- [ ] Verify error toast appears: "Error loading print jobs"
- [ ] Reconnect
- [ ] Try to update job status with network error
- [ ] Verify error toast: "Error updating status"

### 8. Empty States ✓
#### No Jobs
- [ ] If no print jobs in a status column:
  - [ ] Package icon displayed
  - [ ] "No jobs in this status" message shown
- [ ] If no design requests in a status column:
  - [ ] Palette icon displayed
  - [ ] "No requests in this status" message shown

#### No Messages
- [ ] Open job with no conversation
- [ ] Verify conversation panel shows:
  - [ ] MessageCircle icon (large, faded)
  - [ ] "No messages yet" text
  - [ ] For design assistance: "Start a conversation to discuss design details"

### 9. Navigation Flow ✓
Complete workflow test:
- [ ] Start at `/admin` dashboard
- [ ] Click Print Jobs notification
- [ ] Click a "Submitted" job
- [ ] Review details
- [ ] Change status to "In Queue"
- [ ] Verify job moved to In Queue column
- [ ] Click another job in "In Queue"
- [ ] Read conversation messages
- [ ] Click "Open Full Chat"
- [ ] Verify full conversations page loads
- [ ] Navigate back to Print Jobs
- [ ] Go back to dashboard
- [ ] Click Design Assistance notification
- [ ] Repeat similar workflow for design requests

## Known Issues / Limitations
- Real-time updates require page refresh (no WebSocket yet)
- Unread message indicators updated on page load only
- Conversation in popup is read-only (can't send messages from popup)
- 3D model preview requires valid file_url in database
- Reference images must be publicly accessible URLs

## Success Criteria
✅ All checkboxes marked
✅ No console errors
✅ Status changes persist
✅ Conversations load properly
✅ File attachments work
✅ Navigation flows smoothly
✅ UI responsive on all screen sizes

## Report Issues
If any test fails:
1. Note which checkbox failed
2. Take screenshot of issue
3. Check browser console for errors
4. Note steps to reproduce
5. Report with: Page URL, Action taken, Expected result, Actual result

## Next Steps After Testing
- Deploy to staging environment
- Test with real customer orders
- Monitor for performance issues
- Gather feedback from admin users
- Iterate based on feedback
