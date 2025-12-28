# Services Implementation - Deployment Guide

## Overview
This guide covers the deployment steps for the new services features added by Mayssa:
- Design Requests Service
- Consulting/Appointments Service

## Database Setup

### 1. Run SQL Migration

Execute the following SQL script in your Supabase SQL Editor:

```bash
# Location: SQL/add-services-tables.sql
```

This will create two new tables:
- `design_requests` - Stores 3D design service requests
- `appointments` - Stores consulting appointment bookings

### 2. Verify Tables

After running the migration, verify the tables exist:

```sql
SELECT * FROM public.design_requests LIMIT 1;
SELECT * FROM public.appointments LIMIT 1;
```

## Environment Variables

### Required Variables

Add these to your `.env` file (local) and Vercel environment variables (production):

```env
# Email Configuration (already existing, but verify)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@protolab.info
ADMIN_EMAIL=admin@protolab3d.com

# Frontend URL (for email links)
FRONTEND_URL=https://protolab-3d-poland.vercel.app

# Database (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### Setting Vercel Environment Variables

Run this command to sync environment variables to Vercel:

```bash
# Update environment variables in Vercel
vercel env pull .env.production

# Or manually set each variable
vercel env add ADMIN_EMAIL
# Enter: admin@protolab3d.com
```

## API Endpoints

The following new API endpoints are now available:

### Design Requests

- `POST /api/design-requests` - Submit a new design request
- `GET /api/design-requests` - Get user's design requests (authenticated)
- `PUT /api/design-requests` - Update design request (admin only)

### Appointments

- `GET /api/appointments?date=YYYY-MM-DD` - Check availability for a date
- `GET /api/appointments` - Get user's appointments (authenticated)
- `POST /api/appointments` - Book a new appointment
- `PUT /api/appointments` - Update appointment (admin only)
- `DELETE /api/appointments?id=<id>` - Cancel an appointment

## Frontend Integration

### 1. API Helper Functions

All API calls are handled through utility functions in:
```
client/src/utils/servicesApi.ts
```

### 2. New Routes

The following routes are now available:
- `/services` - Services overview page
- `/services/design` - 3D Design service
- `/services/consulting` - Consulting/appointments
- `/design-assistance` - Design assistance information
- `/privacy-policy` - Privacy policy page

### 3. Navigation

Navigation links are already integrated in:
- Landing page header
- Landing page footer
- Services page

## Testing

### Local Testing

1. Start the development server:
```bash
cd client
npm run dev
```

2. Test the services:
- Navigate to `/services`
- Try submitting a design request at `/services/design`
- Try booking an appointment at `/services/consulting`

### Production Testing

After deployment:

1. Verify pages load correctly
2. Test form submissions
3. Check email notifications (if configured)
4. Verify database entries

## Email Notifications

### Design Requests
- Customer receives: Confirmation email with request ID
- Admin receives: Notification with project details

### Appointments
- Customer receives: Confirmation with appointment details
- Admin receives: Notification with appointment info
- When meeting link is added: Customer receives meeting link email

## Admin Dashboard Integration (Future Enhancement)

To fully integrate with admin dashboard, create these pages:

1. **Design Requests Management** (`/admin/design-requests`)
   - List all design requests
   - Update status
   - Add notes and pricing
   - Upload final files

2. **Appointments Management** (`/admin/appointments`)
   - View calendar of appointments
   - Update appointment status
   - Add meeting links
   - Add admin notes

## Troubleshooting

### Issue: Forms not submitting

**Check:**
1. API endpoints are accessible (`/api/design-requests`, `/api/appointments`)
2. CORS headers are properly configured
3. Network tab in browser DevTools for error details

### Issue: Email not sending

**Check:**
1. `RESEND_API_KEY` is set correctly
2. `FROM_EMAIL` is verified in Resend dashboard
3. Check Vercel function logs for email errors

### Issue: Database errors

**Check:**
1. SQL migration was run successfully
2. RLS policies are properly configured
3. Supabase connection is working
4. Check Vercel function logs for database errors

## Deployment Steps

### 1. Commit Changes

```bash
git add .
git commit -m "Add design requests and appointments services"
git push origin Mayssa
```

### 2. Merge to Main

```bash
git checkout mahmoud
git merge Mayssa
git push origin mahmoud
```

### 3. Deploy to Vercel

```bash
# Automatic deployment on push to main branch
# Or manual deployment:
vercel --prod
```

### 4. Verify Deployment

1. Check Vercel deployment logs
2. Test all new pages and forms
3. Verify database connections
4. Test email notifications

## Post-Deployment Checklist

- [ ] SQL migration executed in Supabase
- [ ] Environment variables set in Vercel
- [ ] API endpoints responding correctly
- [ ] Forms submitting successfully
- [ ] Email notifications working
- [ ] All pages loading without errors
- [ ] Mobile responsive design verified
- [ ] Browser compatibility tested
- [ ] Production URLs updated in .env

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## Additional Resources

- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Resend Dashboard: https://resend.com/dashboard
- API Documentation: `/docs/SERVICES_IMPLEMENTATION.md`
