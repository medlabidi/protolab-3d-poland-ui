# Test du Flux d'Authentification - ProtoLab 3D Poland

## 🎯 Objectif
Tester le flux complet de création de compte avec approbation admin et vérification par email (Resend).

---

## 📋 Prérequis

### 1. Base de Données Supabase
✅ **Exécuter le script SQL complet:**
```sql
-- Dans Supabase SQL Editor, exécuter:
c:\proto\landing_page\protolab-3d-poland-ui\SQL\complete-schema-with-approval.sql
```

Ce script crée:
- ✅ Table `users` avec tous les champs d'approbation
- ✅ Table `orders`
- ✅ Table `refresh_tokens`
- ✅ Table `settings`
- ✅ Indexes et RLS policies

### 2. Créer un Utilisateur Admin
```sql
-- Dans Supabase SQL Editor
INSERT INTO users (name, email, password_hash, role, email_verified, status, approved_at)
VALUES (
  'Admin ProtoLab',
  'protolablogin@proton.me',
  '$2b$10$abcdefghijklmnopqrstuvwxyz', -- Hash bcrypt pour un mot de passe temporaire
  'admin',
  true,
  'approved',
  NOW()
);
```

### 3. Variables d'Environnement
Vérifier `.env`:
```env
# Supabase
SUPABASE_URL=https://uxzhylisyovbdpdnguti.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email
RESEND_API_KEY=re_5uvYahPi_CXKRTzv5UWZMMG7r7zsHsC44
FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=protolablogin@proton.me

# URLs
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:5000

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
```

---

## 🚀 Démarrage du Serveur

### Terminal 1 - Backend (Port 5000)
```bash
cd c:\proto\landing_page\protolab-3d-poland-ui
npm run dev:server
```

### Terminal 2 - Frontend (Port 8080)
```bash
cd c:\proto\landing_page\protolab-3d-poland-ui
npm run dev:client
```

**Ou tout en un:**
```bash
npm run dev
```

---

## 📝 Scénario de Test Complet

### Étape 1: Inscription d'un Nouvel Utilisateur

**URL:** `http://localhost:8080/login`

**Actions:**
1. Cliquer sur l'onglet "Sign Up"
2. Remplir le formulaire:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
   - Phone (optionnel): `+48 123 456 789`
   - Address (optionnel): `123 Main Street`
   - City: `Warsaw`
   - Zip Code: `00-001`
   - Country: `Poland`

3. Cliquer sur "Sign Up"

**✅ Résultat Attendu:**
- Toast de succès: `"Registration submitted! Waiting for admin approval."`
- Toast d'info: `"You will receive an email once your account is approved."`
- Retour automatique à l'onglet "Login" après 2 secondes
- **AUCUN** accès au dashboard (pas de tokens stockés)

**❌ Comportement Incorrect (avant fix):**
- Tentative de redirection vers `/dashboard`
- Erreur car l'utilisateur n'a pas de tokens

---

### Étape 2: Vérifier les Emails Envoyés

#### Email 1: Confirmation de Soumission (User)
**Destinataire:** `testuser@example.com`
**Sujet:** `Registration Request Submitted - ProtoLab 3D Poland`
**Contenu:**
- Message de confirmation
- Statut: En attente d'approbation
- Temps estimé: 24-48 heures

#### Email 2: Notification Admin
**Destinataire:** `protolablogin@proton.me`
**Sujet:** `🔔 New Registration: Test User - Action Required`
**Contenu:**
- Détails du nouvel utilisateur
- Boutons d'action:
  - ✅ **Approve User** → `http://localhost:5000/api/auth/approve-user?token=xxx`
  - ❌ **Reject User** → `http://localhost:5000/api/auth/reject-user?token=xxx`

---

### Étape 3: Tentative de Connexion (Avant Approbation)

**Actions:**
1. Aller sur l'onglet "Login"
2. Email: `testuser@example.com`
3. Password: `TestPass123!`
4. Cliquer sur "Sign In"

**✅ Résultat Attendu:**
- Toast d'avertissement: `"Your account is awaiting admin approval. Please check your email."`
- **AUCUNE** connexion autorisée
- Reste sur la page de login

---

### Étape 4: Approbation Admin

**Actions:**
1. Admin ouvre l'email de notification
2. Clique sur le bouton **"✅ Approve User"**
3. Le navigateur s'ouvre sur `http://localhost:5000/api/auth/approve-user?token=xxx`

**✅ Résultat Attendu:**
- Page HTML s'affiche: `"✅ User Approved Successfully!"`
- Message: `"User Test User (testuser@example.com) has been approved successfully."`
- Dans Supabase:
  ```sql
  SELECT status, approved_at, approved_by FROM users WHERE email = 'testuser@example.com';
  -- status: 'approved'
  -- approved_at: 2025-01-XX XX:XX:XX
  -- approved_by: 'admin'
  ```

#### Email 3: Email d'Approbation (User)
**Destinataire:** `testuser@example.com`
**Sujet:** `✅ Account Approved - Welcome to ProtoLab 3D Poland!`
**Contenu:**
- Message de félicitations
- Lien vers le dashboard: `http://localhost:8080/login`
- Instructions pour commencer

---

### Étape 5: Connexion Après Approbation

**Actions:**
1. Retourner sur `http://localhost:8080/login`
2. Email: `testuser@example.com`
3. Password: `TestPass123!`
4. Cliquer sur "Sign In"

**✅ Résultat Attendu:**
- Toast de succès: `"Login successful!"`
- Redirection vers `/dashboard`
- Tokens stockés dans localStorage:
  - `accessToken`
  - `refreshToken`
  - `user` (JSON avec id, name, email, role)
  - `isLoggedIn`: `"true"`

**Vérification localStorage (F12 → Console):**
```javascript
console.log(localStorage.getItem('accessToken')); // JWT token
console.log(JSON.parse(localStorage.getItem('user'))); // User object
```

---

### Étape 6: Navigation Dashboard

**URL:** `http://localhost:8080/dashboard`

**✅ Résultat Attendu:**
- Dashboard s'affiche correctement
- Sidebar visible avec nom de l'utilisateur
- Accès aux pages protégées:
  - `/dashboard` ✅
  - `/orders` ✅
  - `/settings` ✅
- **Page publique accessible sans login:**
  - `/new-print` ✅ (pas de protection ProtectedRoute)

---

## 🧪 Tests Supplémentaires

### Test 1: Rejection Flow (Optionnel)

**Actions:**
1. Créer un nouveau compte avec email: `rejecttest@example.com`
2. Admin clique sur **"❌ Reject User"** dans l'email

**✅ Résultat Attendu:**
- Page HTML: `"❌ User Registration Rejected"`
- Email de rejet envoyé à `rejecttest@example.com`
- Tentative de login → Erreur: `"Account not approved. Please contact support."`

---

### Test 2: Vérifier la Base de Données

**SQL Queries:**
```sql
-- Voir tous les utilisateurs
SELECT id, name, email, role, status, email_verified, approved_at 
FROM users 
ORDER BY created_at DESC;

-- Utilisateurs en attente
SELECT name, email, created_at 
FROM users 
WHERE status = 'pending';

-- Utilisateurs approuvés
SELECT name, email, approved_at, approved_by 
FROM users 
WHERE status = 'approved';

-- Tokens actifs
SELECT u.name, u.email, rt.token, rt.expires_at 
FROM refresh_tokens rt 
JOIN users u ON rt.user_id = u.id;
```

---

### Test 3: Logs du Serveur

**Vérifier dans le terminal backend:**
```
✅ User registered (pending approval): testuser@example.com
✅ Submission confirmation sent to testuser@example.com via Resend
✅ Admin notification sent for user: testuser@example.com via Resend
✅ User approved with token: 1234567890...
✅ Approval email sent to testuser@example.com via Resend
✅ User logged in: testuser@example.com
```

---

## ❌ Problèmes Connus et Solutions

### Problème 1: Emails Non Reçus
**Causes possibles:**
- Clé API Resend invalide
- Email dans le spam
- Quota Resend dépassé

**Solution:**
1. Vérifier les logs: `logger.info` et `logger.error`
2. Tester l'API Resend dans leur dashboard
3. Vérifier `FROM_EMAIL` et `ADMIN_EMAIL` dans `.env`

---

### Problème 2: Login Échoue Après Approbation
**Causes possibles:**
- Champ `status` n'a pas été mis à jour
- JWT secrets incorrects

**Solution:**
```sql
-- Vérifier le statut
SELECT status, approved_at FROM users WHERE email = 'testuser@example.com';

-- Forcer l'approbation manuellement
UPDATE users 
SET status = 'approved', approved_at = NOW(), approved_by = 'admin' 
WHERE email = 'testuser@example.com';
```

---

### Problème 3: Dashboard Non Accessible
**Causes possibles:**
- Tokens non stockés
- ProtectedRoute mal configuré

**Solution:**
```javascript
// Vérifier dans la console (F12)
console.log({
  accessToken: localStorage.getItem('accessToken'),
  user: JSON.parse(localStorage.getItem('user')),
  isLoggedIn: localStorage.getItem('isLoggedIn')
});
```

---

## 📊 Checklist de Test Complète

### Backend
- [ ] Serveur démarre sur port 5000
- [ ] Connexion Supabase réussie
- [ ] Route `/api/auth/register` fonctionne
- [ ] Route `/api/auth/login` fonctionne
- [ ] Route `/api/auth/approve-user` fonctionne
- [ ] Route `/api/auth/reject-user` fonctionne

### Frontend
- [ ] Application démarre sur port 8080
- [ ] Page login affiche les deux onglets
- [ ] Formulaire Sign Up fonctionnel
- [ ] Formulaire Login fonctionnel
- [ ] Redirection dashboard après login approuvé
- [ ] Pas de redirection après signup (avant approbation)

### Emails (Resend)
- [ ] Email de confirmation de soumission reçu
- [ ] Email de notification admin reçu
- [ ] Liens d'approbation/rejet fonctionnels
- [ ] Email d'approbation reçu après validation
- [ ] Email de rejet reçu (si testé)

### Base de Données
- [ ] Table `users` contient tous les champs nécessaires
- [ ] Statut `pending` après inscription
- [ ] Statut `approved` après validation admin
- [ ] `approval_token` généré et stocké
- [ ] `approved_at` et `approved_by` renseignés

### Sécurité
- [ ] Utilisateur pending ne peut pas se connecter
- [ ] Utilisateur rejected ne peut pas se connecter
- [ ] Tokens JWT valides après approbation
- [ ] Dashboard protégé par ProtectedRoute
- [ ] Page `/new-print` accessible publiquement

---

## 🎉 Succès!

Si tous les tests passent, le flux d'authentification avec approbation admin fonctionne correctement!

**Prochaines étapes:**
1. Tester en production avec un domaine email personnalisé
2. Configurer SPF/DKIM pour Resend
3. Créer un dashboard admin pour gérer les approbations
4. Ajouter des notifications en temps réel (optionnel)

---

**ProtoLab 3D Poland - Professional 3D Printing Services**
