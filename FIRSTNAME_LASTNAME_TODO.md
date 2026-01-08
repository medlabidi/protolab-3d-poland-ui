# firstName/lastName Implementation - Remaining Tasks

## ✅ Completed
1. Database migration SQL created (`SQL/add-firstname-lastname.sql`)
2. Signup form updated to use firstName/lastName fields
3. Auth validators updated (registerSchema, updateUserSchema)
4. Auth service updated to use firstName/lastName
5. User model interface updated
6. PayU integration updated to use first_name/last_name from database

## 🔄 Remaining Tasks

### 1. **Run Database Migration** (CRITICAL - DO THIS FIRST!)
```bash
# Open Supabase Dashboard > SQL Editor and run:
SQL/add-firstname-lastname.sql
```

### 2. **Update Settings/Profile Page**
Files: `client/src/pages/Settings.tsx` or `client/src/pages/Profile.tsx`
- Change single "name" field to "firstName" and "lastName" fields
- Update form submission to send both fields
- Update display to show `${firstName} ${lastName}`

### 3. **Update Admin Pages**
Files to check:
- `client/src/pages/Admin*.tsx`
- `server/src/controllers/admin.controller.ts`
- Display full name as `${first_name} ${last_name}`
- Update user editing forms to use firstName/lastName

### 4. **Update Email Templates**
Files: `server/src/services/email.service.ts`
- Already updated in auth.service.ts to pass `${first_name} ${last_name}`
- Verify all email templates use the name parameter correctly

### 5. **Update Translation Files** 
Files: `client/src/locales/*.json`
Add new translation keys:
```json
{
  "signup": {
    "fields": {
      "firstName": "First Name / Imię",
      "lastName": "Last Name / Nazwisko"
    },
    "placeholders": {
      "firstName": "Jan",
      "lastName": "Kowalski"
    }
  }
}
```

### 6. **Update User Service/Controller**
Files: `server/src/services/user.service.ts`, `server/src/controllers/user.controller.ts`
- Update getUserProfile to return firstName/lastName
- Update updateProfile to accept firstName/lastName
- Keep backward compatibility with legacy `name` field where needed

### 7. **Update Frontend User Context/State**
Files: `client/src/contexts/*.tsx` or stores
- Update user type definitions to include firstName/lastName
- Update localStorage user object structure
- Display name as `${firstName} ${lastName}` throughout app

### 8. **Search for Legacy "name" Field Usage**
Run these searches and update:
```bash
# Find all references to user.name
grep -r "user\.name" client/src/
grep -r "userData\.name" client/src/
grep -r "\.name" server/src/

# Find all references in database queries
grep -r "select.*name" server/src/
```

### 9. **Update Order/Print Related Pages**
Any page that displays user info with orders:
- `client/src/pages/Orders.tsx`
- `client/src/pages/EditOrder.tsx`  
- `client/src/pages/NewPrint.tsx`
Update to use firstName/lastName if displaying user name

### 10. **Test All Flows**
- ✅ New user signup with firstName/lastName
- ✅ User login
- ✅ Update profile (firstName/lastName)
- ✅ PayU payment (verify correct buyer name)
- ✅ Admin viewing users (full name display)
- ✅ Email notifications (correct name)

## Quick Search Commands

```bash
# Find all "name" field usage in client
cd client/src
grep -r "\.name" --include="*.tsx" --include="*.ts" | grep -v "file_name\|material_name\|firstName\|lastName"

# Find all "name" field usage in server  
cd server/src
grep -r "user\.name\|userData\.name" --include="*.ts"

# Find form inputs with "name"
cd client/src
grep -r "id=\"name\"" --include="*.tsx"
```

## Notes
- Keep `name` field in database for backward compatibility during transition
- Consider deprecation timeline for `name` field
- Update API documentation if exists
- Test with existing users (migration splits their name)
- Ensure admin can edit both fields separately
