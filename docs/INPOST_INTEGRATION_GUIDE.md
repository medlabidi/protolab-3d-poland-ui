# InPost ShipX API Integration Guide

## Overview
This document describes the InPost ShipX API integration prepared for ProtoLab 3D Poland.

## API Documentation
- **Manager Portal**: https://manager.paczkomaty.pl/
- **API Documentation**: https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/overview

## Required Credentials (To Be Obtained)

### 1. Register Business Account
1. Go to https://manager.paczkomaty.pl/
2. Create business account
3. Complete company data (required for API generation):
   - Company address details
   - Billing information (invoice data)
4. Navigate to "Moje Konto" → "Ustawienia organizacji"

### 2. Generate API Access
1. In Manager, go to API ShipX section
2. Click "Generuj" to generate new API access
3. Optional: Enter courier contract client number if available
4. System generates:
   - **Organization ID** (found in "Ustawienia organizacji")
   - **API Token** (click "Pokaż token" to reveal)

### 3. Generate Geowidget Token
1. In Manager, expand "Geowidget" section
2. Click "Generuj"
3. Add allowed domains (e.g., protolab3d.pl)
4. Copy the Geowidget token

### 4. Configure Webhook (Optional)
1. In "Ustawienia organizacji"
2. Add webhook URL: `https://api.protolab3d.pl/webhooks/inpost`
3. Must use HTTPS format

## Environment Variables Needed

```env
# InPost ShipX API Configuration
INPOST_ORGANIZATION_ID=your_organization_id_here
INPOST_API_TOKEN=your_api_token_here
INPOST_GEOWIDGET_TOKEN=your_geowidget_token_here
INPOST_SANDBOX_MODE=true  # Set to false in production

# InPost API Endpoints
INPOST_API_BASE_URL=https://api-shipx-pl.easypack24.net
INPOST_SANDBOX_API_URL=https://sandbox-api-shipx-pl.easypack24.net

# Webhook Configuration
INPOST_WEBHOOK_SECRET=your_webhook_secret_here
```

## API Capabilities Once Integrated

### Parcel Lockers (Paczkomaty)
- ✅ Get all locker locations
- ✅ Search lockers by city/address
- ✅ Get locker details
- ✅ Check locker availability

### Shipment Management
- ✅ Create shipment orders
- ✅ Generate shipping labels
- ✅ Track shipments
- ✅ Get shipment status
- ✅ Cancel shipments

### Courier Services (if contract number provided)
- ✅ Schedule courier pickup
- ✅ Courier delivery to address
- ✅ Return shipments

### Pricing
- ✅ Get shipping rates
- ✅ Calculate costs
- ✅ Get available services

## Current Implementation Status

### ✅ Ready (No API Key Required)
- Frontend locker picker modal
- Map search fallback
- Manual locker code entry
- UI/UX for locker selection

### ⏹️ Pending API Credentials
- Locker data fetching
- Shipment creation
- Label generation
- Tracking integration
- Webhook handling

## Next Steps

1. **Business Registration**
   - Register at https://manager.paczkomaty.pl/
   - Complete all company information
   - Submit business verification documents

2. **API Access Generation**
   - Generate Organization ID and API Token
   - Generate Geowidget token for website
   - Add website domain to allowed list

3. **Credentials Configuration**
   - Add credentials to `.env` files
   - Update backend configuration
   - Test in sandbox mode first

4. **Production Deployment**
   - Switch to production API endpoints
   - Set `INPOST_SANDBOX_MODE=false`
   - Monitor webhook logs

## Integration Timeline
- Estimated setup time: 1-2 business days (waiting for account approval)
- Integration testing: 2-3 days
- Production deployment: 1 day

## Support
- InPost Technical Support: https://manager.paczkomaty.pl/
- Documentation: https://dokumentacja-inpost.atlassian.net/
