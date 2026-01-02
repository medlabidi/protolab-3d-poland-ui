# InPost ShipX Integration - Complete Setup Checklist

## ✅ Phase 1: Code Preparation (COMPLETED)

### Backend Files Created
- ✅ `server/src/services/inpost.service.ts` - Complete InPost API service
- ✅ `server/src/routes/inpost.routes.ts` - API endpoints for InPost operations
- ✅ `server/src/examples/inpost-examples.ts` - Working examples and test code
- ✅ `server/.env.inpost.template` - Environment configuration template

### Frontend Files Created
- ✅ `client/src/services/inpost-geowidget.ts` - Geowidget integration (official InPost map)
- ✅ `client/src/components/LockerPickerModal.tsx` - Fallback UI with manual entry

### Documentation Created
- ✅ `docs/INPOST_INTEGRATION_GUIDE.md` - Complete integration guide

---

## ⏹️ Phase 2: Business Registration (PENDING)

### Step 1: Register Business Account
- [ ] Go to https://manager.paczkomaty.pl/
- [ ] Click "Zarejestruj się" (Register)
- [ ] Choose business account type
- [ ] Fill in company information:
  - [ ] Company name: ProtoLab 3D Poland
  - [ ] NIP (Tax ID)
  - [ ] REGON
  - [ ] Company address
  - [ ] Contact email
  - [ ] Contact phone

### Step 2: Complete Company Profile
- [ ] Log into Manager Portal
- [ ] Navigate to "Moje Konto" (My Account)
- [ ] Fill in ALL required fields:
  - [ ] Company address details (street, building, city, postal code)
  - [ ] Billing information (invoice recipient data)
  - [ ] Bank account details
  - [ ] Contact person details
- [ ] **IMPORTANT**: All fields must be complete to generate API access

### Step 3: Submit Business Verification
- [ ] Upload required documents:
  - [ ] Business registration certificate (KRS/CEIDG)
  - [ ] Tax identification document
  - [ ] ID of company representative
- [ ] Wait for verification (typically 1-2 business days)

---

## ⏹️ Phase 3: API Credentials Generation (PENDING)

### Step 1: Generate API Token
- [ ] Log into https://manager.paczkomaty.pl/
- [ ] Navigate to "Ustawienia organizacji" (Organization Settings)
- [ ] Click on "API ShipX" section
- [ ] Click "Generuj" (Generate) button
- [ ] **OPTIONAL**: If you have courier contract, enter client number
- [ ] Click "Generuj" to create token
- [ ] **Copy Organization ID** from "Ustawienia organizacji"
- [ ] Click "Pokaż token" (Show token) to reveal API token
- [ ] **Copy API Token** securely

### Step 2: Generate Geowidget Token
- [ ] In Manager Portal, expand "Geowidget" section
- [ ] Click "Generuj" (Generate)
- [ ] Add allowed domains:
  - [ ] localhost:8081 (for development)
  - [ ] protolab3d.pl (your production domain)
  - [ ] www.protolab3d.pl
- [ ] Click "Generuj"
- [ ] **Copy Geowidget Token**

### Step 3: Configure Webhook (Optional)
- [ ] In "Ustawienia organizacji"
- [ ] Find "Webhook" section
- [ ] Enter your webhook URL: `https://api.protolab3d.pl/api/inpost/webhook`
- [ ] **Must use HTTPS**
- [ ] Save configuration

---

## ⏹️ Phase 4: Environment Configuration (PENDING)

### Backend Configuration
- [ ] Copy `server/.env.inpost.template` to `server/.env` (or add to existing .env)
- [ ] Fill in the following:
  ```env
  INPOST_ORGANIZATION_ID=<your_organization_id>
  INPOST_API_TOKEN=<your_api_token>
  INPOST_GEOWIDGET_TOKEN=<your_geowidget_token>
  INPOST_SANDBOX_MODE=true  # Start with sandbox
  INPOST_WEBHOOK_SECRET=<generate_random_string>
  
  # Company details
  COMPANY_NAME=ProtoLab 3D Poland
  SENDER_EMAIL=orders@protolab3d.pl
  SENDER_PHONE=+48123456789
  SENDER_STREET=<your street>
  SENDER_BUILDING=<building number>
  SENDER_CITY=Kraków
  SENDER_POST_CODE=<postal code>
  SENDER_COUNTRY=PL
  ```

### Frontend Configuration
- [ ] Add to `client/.env.local`:
  ```env
  VITE_INPOST_GEOWIDGET_TOKEN=<your_geowidget_token>
  ```

### Install Dependencies
- [ ] Backend: `cd server && npm install axios`
- [ ] Frontend: Already has required dependencies

---

## ⏹️ Phase 5: Code Integration (PENDING)

### Backend Integration
- [ ] Add InPost routes to main app:
  ```typescript
  // In server/src/index.ts or app.ts
  import inpostRoutes from './routes/inpost.routes';
  app.use('/api/inpost', inpostRoutes);
  ```

### Frontend Integration - Option A: Use Official Geowidget
- [ ] Update `LockerPickerModal.tsx` to use Geowidget:
  ```typescript
  import { useInPostGeowidget } from '@/services/inpost-geowidget';
  
  const { isLoaded, openMap } = useInPostGeowidget();
  
  // Replace current map with:
  <button onClick={() => openMap(onSelectLocker)}>
    Open InPost Map
  </button>
  ```

### Frontend Integration - Option B: Use API Endpoint
- [ ] Update locker fetching to use backend:
  ```typescript
  const response = await fetch('/api/inpost/points?city=Krakow');
  const data = await response.json();
  setLockers(data.data);
  ```

### Update Order Creation
- [ ] Modify `server/src/services/order.service.ts`:
  ```typescript
  import { getInPostService } from './inpost.service';
  
  async createOrder(orderData) {
    // ... existing code
    
    if (orderData.deliveryMethod === 'inpost') {
      const inpost = getInPostService();
      const shipment = await inpost.createShipment({
        receiver: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone,
        },
        parcels: [{
          dimensions: orderData.modelDimensions,
          weight: { amount: orderData.modelWeight },
        }],
        custom_attributes: {
          target_point: orderData.lockerId,
        },
        service: 'inpost_locker_standard',
        reference: orderData.orderId,
      });
      
      // Save tracking number
      order.tracking_number = shipment.tracking_number;
      order.label_url = shipment.label_url;
    }
    
    return order;
  }
  ```

---

## ⏹️ Phase 6: Testing (PENDING)

### Sandbox Testing
- [ ] Ensure `INPOST_SANDBOX_MODE=true`
- [ ] Test endpoints:
  ```bash
  # Get lockers
  curl http://localhost:5000/api/inpost/points?city=Krakow
  
  # Get specific locker
  curl http://localhost:5000/api/inpost/points/KRA01M
  
  # Create test shipment (use Postman or similar)
  POST http://localhost:5000/api/inpost/shipments
  ```

### Frontend Testing
- [ ] Open locker picker modal
- [ ] Verify map loads with lockers
- [ ] Select a locker
- [ ] Confirm locker details display correctly
- [ ] Test complete order flow

### Integration Testing
- [ ] Create test order with InPost delivery
- [ ] Verify shipment is created in InPost system
- [ ] Check tracking number is saved
- [ ] Download and verify shipping label
- [ ] Test webhook callbacks

---

## ⏹️ Phase 7: Production Deployment (PENDING)

### Pre-Production Checklist
- [ ] All sandbox tests passing
- [ ] Webhook URL configured in InPost Manager
- [ ] SSL certificate installed on production server
- [ ] Backup of all configuration

### Production Switch
- [ ] Change `INPOST_SANDBOX_MODE=false`
- [ ] Update API URLs if needed
- [ ] Verify all environment variables set on production server
- [ ] Deploy updated code

### Production Testing
- [ ] Create real test shipment
- [ ] Verify label generation
- [ ] Test tracking
- [ ] Verify webhook delivery
- [ ] Monitor logs for errors

### Go Live
- [ ] Enable InPost delivery option for customers
- [ ] Monitor first few orders closely
- [ ] Set up alerts for API errors
- [ ] Document any issues

---

## 📊 Current Status Summary

| Component | Status | Progress |
|-----------|--------|----------|
| Code Preparation | ✅ Complete | 100% |
| Business Registration | ⏹️ Pending | 0% |
| API Credentials | ⏹️ Pending | 0% |
| Environment Setup | ⏹️ Pending | 0% |
| Code Integration | ⏹️ Pending | 0% |
| Testing | ⏹️ Pending | 0% |
| Production | ⏹️ Pending | 0% |

**Overall Progress: 14% (1/7 phases complete)**

---

## 🚀 Quick Start (When Ready)

Once you have API credentials:

1. Copy credentials to `.env` files
2. Run: `cd server && npm install axios`
3. Add route to `server/src/index.ts`:
   ```typescript
   import inpostRoutes from './routes/inpost.routes';
   app.use('/api/inpost', inpostRoutes);
   ```
4. Restart servers
5. Test: `curl http://localhost:5000/api/inpost/points?city=Krakow`

---

## 📞 Support Resources

- **InPost Manager**: https://manager.paczkomaty.pl/
- **Documentation**: https://dokumentacja-inpost.atlassian.net/
- **Technical Support**: Available through Manager Portal
- **API Status**: Check Manager Portal for service status

---

## ⚠️ Important Notes

1. **All company data must be complete** before API generation is possible
2. **Business verification** may take 1-2 business days
3. **Start with sandbox mode** - test thoroughly before production
4. **HTTPS required** for webhooks and production use
5. **Keep API tokens secure** - never commit to version control
6. **Monitor API limits** - check your account for rate limits

---

## 📝 Next Action

**ACTION REQUIRED**: Register business at https://manager.paczkomaty.pl/

Once registration is complete, follow Phase 3 to generate API credentials.
