# Testing Checklist - Services Implementation

## 🌐 Your Test Environment

**Frontend (Running):** http://localhost:8080/
**Backend APIs:** Will use production Vercel endpoints OR local if you set up

---

## ⚠️ IMPORTANT: Database Setup Required

Before testing, you **MUST** run the SQL migration in Supabase:

### Step 1: Run SQL Migration
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire content from `SQL/add-services-tables.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see: "Success. No rows returned"

**Verify tables were created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('design_requests', 'appointments');
```
You should see both tables listed.

---

## 📋 Testing Steps

### Test 1: Services Overview Page ✅
1. Open http://localhost:8080/services
2. **Check:**
   - [ ] Page loads without errors
   - [ ] Three service cards are visible (3D Printing, Design, Consulting)
   - [ ] Navigation buttons work
   - [ ] All text is properly translated
   - [ ] Images/icons display correctly
   - [ ] Responsive on mobile (resize browser)

---

### Test 2: Design Service Page ✅
1. Navigate to http://localhost:8080/services/design
2. **Visual Check:**
   - [ ] Page loads without errors
   - [ ] Hero section displays correctly
   - [ ] Form is visible and styled properly
   - [ ] Process steps section shows 4 steps
   - [ ] "What's Included" section visible

3. **Form Submission Test:**
   - [ ] Fill in your name
   - [ ] Enter a **valid email** (you'll receive confirmation)
   - [ ] Add phone number (optional)
   - [ ] Write a project description
   - [ ] Try uploading files (optional - images, PDFs)
   - [ ] Click "Submit Request"
   
4. **Expected Results:**
   - [ ] Loading indicator appears
   - [ ] Success toast notification shows
   - [ ] Form resets after submission
   - [ ] Check browser DevTools Network tab:
     - Look for POST request to `/api/design-requests`
     - Status should be 201 (Created)
   
5. **Email Check (5-10 minutes later):**
   - [ ] Check your email inbox (the one you entered)
   - [ ] You should receive: "ProtoLab 3D - Design Request Received"
   - [ ] Admin should receive notification (if ADMIN_EMAIL is set)

6. **Error Handling Test:**
   - [ ] Try submitting without name - should show error
   - [ ] Try submitting without email - should show error
   - [ ] Try submitting with invalid email - should show error
   - [ ] Try submitting without description - should show error

---

### Test 3: Consulting/Appointments Page ✅
1. Navigate to http://localhost:8080/services/consulting
2. **Visual Check:**
   - [ ] Page loads without errors
   - [ ] Calendar component displays
   - [ ] Benefits section visible
   - [ ] Form is properly styled

3. **Calendar Interaction:**
   - [ ] Click on calendar
   - [ ] Past dates should be disabled (grayed out)
   - [ ] Weekend dates (Sat/Sun) should be disabled
   - [ ] Select a future weekday
   - [ ] Time slots grid should appear

4. **Availability Test:**
   - [ ] After selecting a date, time slots should load
   - [ ] Check browser DevTools Network tab:
     - Look for GET request to `/api/appointments?date=YYYY-MM-DD`
     - Should see available and booked slots
   - [ ] All slots from 09:00 to 17:30 should be visible

5. **Booking Test:**
   - [ ] Select a date
   - [ ] Click on an available time slot
   - [ ] Fill in name
   - [ ] Enter **valid email**
   - [ ] Add phone (optional)
   - [ ] Select a topic from dropdown
   - [ ] Add a message (optional)
   - [ ] Click "Book Appointment"

6. **Expected Results:**
   - [ ] Loading indicator appears
   - [ ] Success toast notification shows
   - [ ] Form resets after submission
   - [ ] Check browser DevTools Network tab:
     - POST request to `/api/appointments`
     - Status should be 201 (Created)

7. **Email Check:**
   - [ ] Check your email inbox
   - [ ] You should receive: "ProtoLab 3D - Appointment Confirmation"
   - [ ] Email should include date, time, topic, confirmation ID
   - [ ] Admin should receive notification

8. **Error Handling Test:**
   - [ ] Try booking without selecting date - should show error
   - [ ] Try booking without selecting time - should show error
   - [ ] Try booking without name - should show error
   - [ ] Try booking without email - should show error
   - [ ] Try booking without topic - should show error
   - [ ] Try booking the same slot twice - should show "already booked" error

9. **Availability After Booking:**
   - [ ] Refresh the page
   - [ ] Select the same date you just booked
   - [ ] The time slot you booked should NOT appear in available slots

---

### Test 4: Navigation & Routes ✅
1. **Landing Page:**
   - [ ] Go to http://localhost:8080/
   - [ ] Click "Services" in header → should go to /services
   - [ ] Scroll to footer
   - [ ] Click "3D Design" in footer → should go to /services/design
   - [ ] Click "Consulting" in footer → should go to /services/consulting

2. **Direct Routes:**
   - [ ] http://localhost:8080/services (Services overview)
   - [ ] http://localhost:8080/services/design (Design service)
   - [ ] http://localhost:8080/services/consulting (Consulting)
   - [ ] http://localhost:8080/design-assistance (Design info page)
   - [ ] http://localhost:8080/privacy-policy (Privacy policy)

3. **Back Navigation:**
   - [ ] From any service page, click "Back" button
   - [ ] Should return to services overview

---

### Test 5: Multi-Language Support ✅
1. **Change Language:**
   - [ ] Look for language switcher in header
   - [ ] Switch between Polish (PL), English (EN), Russian (RU)
   
2. **Verify Translation:**
   - [ ] All page content changes language
   - [ ] Form labels translate
   - [ ] Buttons translate
   - [ ] Error messages translate
   - [ ] Toast notifications translate

---

### Test 6: Responsive Design ✅
1. **Desktop (1920x1080):**
   - [ ] All pages display correctly
   - [ ] No horizontal scroll
   - [ ] Images/cards properly sized

2. **Tablet (768px):**
   - [ ] Resize browser to tablet width
   - [ ] Layouts stack properly
   - [ ] Navigation still works
   - [ ] Forms are usable

3. **Mobile (375px):**
   - [ ] Resize to mobile width
   - [ ] All content is readable
   - [ ] Forms are easy to fill
   - [ ] Buttons are tappable
   - [ ] Calendar works on mobile

---

### Test 7: Browser Compatibility ✅
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## 🔍 Developer Tools Checks

### Network Tab
1. Open DevTools (F12) → Network tab
2. When submitting forms, verify:
   - [ ] POST requests return 201 status
   - [ ] Response includes success message
   - [ ] No CORS errors
   - [ ] Request payload looks correct

### Console Tab
1. Check for errors:
   - [ ] No red errors in console
   - [ ] No warning about missing translations
   - [ ] No API errors

---

## 📊 Database Verification

After testing, check Supabase:

1. **Design Requests Table:**
```sql
SELECT * FROM public.design_requests ORDER BY created_at DESC LIMIT 5;
```
- [ ] Your test submissions appear
- [ ] All fields populated correctly
- [ ] Status is 'pending'
- [ ] Timestamps are correct

2. **Appointments Table:**
```sql
SELECT * FROM public.appointments ORDER BY created_at DESC LIMIT 5;
```
- [ ] Your test bookings appear
- [ ] Date and time correct
- [ ] Status is 'scheduled'
- [ ] Timestamps are correct

---

## 🐛 Known Issues to Ignore

These are pre-existing issues not related to new features:
- AdminAnalytics.tsx compilation errors (already existed)
- Any errors in admin dashboard (not part of this implementation)

---

## ✅ Success Criteria

All tests pass if:
- ✅ All pages load without errors
- ✅ Forms submit successfully
- ✅ Data appears in database
- ✅ Emails are sent (if Resend configured)
- ✅ Navigation works correctly
- ✅ Multi-language works
- ✅ Responsive on all screen sizes
- ✅ No console errors related to new features

---

## 🚨 If Something Fails

### Issue: Forms submit but no success message
**Fix:** Check browser console for errors, verify API endpoint URLs

### Issue: "Failed to submit" error
**Possible causes:**
1. Database tables not created (run SQL migration)
2. Environment variables missing in .env
3. CORS issues (check Vercel function logs)

### Issue: No emails received
**Note:** This is normal if RESEND_API_KEY is not configured locally. Emails will work in production if Vercel env vars are set.

### Issue: Time slots don't load
**Fix:** 
1. Check SQL migration was run
2. Verify appointments table exists
3. Check Network tab for API errors

---

## 📝 Testing Log

As you test, mark items complete:

**Date:** December 28, 2025  
**Tester:** _____________  
**Branch:** Mayssa  

| Test | Status | Notes |
|------|--------|-------|
| Services Overview | ⬜ | |
| Design Service Form | ⬜ | |
| Consulting Calendar | ⬜ | |
| Appointment Booking | ⬜ | |
| Navigation | ⬜ | |
| Multi-language | ⬜ | |
| Responsive Design | ⬜ | |
| Database Entries | ⬜ | |
| Email Notifications | ⬜ | |

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
```bash
# Push to your Mayssa branch first
git push origin Mayssa

# Test on Vercel preview deployment
# Then merge to production branch
git checkout mahmoud
git merge Mayssa
git push origin mahmoud
```

### If Issues Found 🐛
1. Document the issue
2. Check error messages in console
3. Review API logs in Vercel
4. Fix and re-test

---

## 💡 Tips

1. **Keep DevTools Open:** Monitor Network and Console tabs during testing
2. **Use Real Email:** Enter your actual email to test notifications
3. **Test Edge Cases:** Try unusual inputs, special characters, long text
4. **Test Twice:** Submit forms multiple times to ensure consistency
5. **Clear Browser Cache:** If seeing old data, clear cache and hard reload (Ctrl+Shift+R)

---

**Ready to test? Start with Step 1 - Run the SQL Migration!** 🚀
