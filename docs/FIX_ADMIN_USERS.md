# 🔧 Fix Admin Users Management - Guide Complet

## 📋 Problème Résolu

La page `/admin/users` appelait l'endpoint `/api/admin/users` qui n'existait pas. Maintenant, un CRUD complet a été implémenté.

## ✅ Ce qui a été créé

### 1. API Backend: `/api/admin/users.ts`

**Endpoints disponibles:**

#### GET `/api/admin/users`
Récupère tous les utilisateurs (admin uniquement)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/users
```

**Réponse:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "status": "approved",
      "email_verified": true,
      "phone": "+48 123 456 789",
      "country": "Poland",
      "created_at": "2026-01-08T10:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/users`
Crée un nouvel utilisateur
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "status": "approved",
    "email_verified": true
  }' \
  http://localhost:3000/api/admin/users
```

#### PATCH `/api/admin/users`
Met à jour un utilisateur existant
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-uuid",
    "role": "admin",
    "status": "approved"
  }' \
  http://localhost:3000/api/admin/users
```

#### DELETE `/api/admin/users`
Supprime un utilisateur
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "user-uuid"}' \
  http://localhost:3000/api/admin/users
```

### 2. Frontend: `/client/src/pages/admin/AdminUsers.tsx`

**Nouvelles fonctionnalités:**

✅ **Bouton "Add User"** - Créer un nouvel utilisateur
✅ **Bouton Edit** sur chaque ligne - Modifier l'utilisateur
✅ **Bouton Delete** sur chaque ligne - Supprimer l'utilisateur
✅ **Dialog modal** - Formulaire de création/édition
✅ **Toast notifications** - Feedback visuel pour chaque action
✅ **Gestion des erreurs** - Messages d'erreur clairs
✅ **Validation** - Champs requis vérifiés

**Champs du formulaire:**
- Name * (requis)
- Email * (requis, non modifiable après création)
- Role (user / admin)
- Status (pending / approved / suspended)
- Phone (optionnel)
- Country (optionnel)
- Email Verified (checkbox)

### 3. Scripts de test

**`test-users-api.js`** - Script Node.js pour tester l'API
**`test-users.bat`** - Script Windows pour lancer le test facilement

## 🚀 Comment utiliser

### Étape 1: Vérifier la table users dans Supabase

La table `users` doit exister avec ces colonnes:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

Colonnes attendues:
- `id` (uuid)
- `name` (varchar)
- `email` (varchar, unique)
- `role` (varchar)
- `status` (varchar)
- `email_verified` (boolean)
- `phone` (varchar, nullable)
- `country` (varchar, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Étape 2: Démarrer le serveur

```powershell
npm run dev
```

Ou depuis le dossier client:
```powershell
cd client
npm run dev
```

### Étape 3: Se connecter en tant qu'admin

1. Aller sur http://localhost:5173/admin/login
2. Se connecter avec un compte admin
3. Le token JWT sera stocké dans localStorage

### Étape 4: Accéder à la gestion des utilisateurs

Naviguer vers: http://localhost:5173/admin/users

### Étape 5: Tester les fonctionnalités CRUD

#### Créer un utilisateur
1. Cliquer sur "Add User"
2. Remplir le formulaire
3. Cliquer sur "Create"
4. ✅ Toast de confirmation

#### Modifier un utilisateur
1. Cliquer sur l'icône Edit (crayon bleu)
2. Modifier les champs
3. Cliquer sur "Update"
4. ✅ Toast de confirmation

#### Supprimer un utilisateur
1. Cliquer sur l'icône Delete (poubelle rouge)
2. Confirmer la suppression
3. ✅ Toast de confirmation

## 🧪 Tester l'API directement

### Avec PowerShell

```powershell
# Obtenir un token admin
$token = "votre-token-jwt-admin"

# Tester GET
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Headers $headers

# Tester POST
$body = @{
    name = "Test User"
    email = "test@example.com"
    role = "user"
    status = "approved"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json"
```

### Avec le script de test

```powershell
# Sans token (teste juste la connexion)
node test-users-api.js

# Avec token admin
$env:ADMIN_TOKEN = "votre-token"
node test-users-api.js
```

Ou utiliser le batch:
```cmd
test-users.bat
```

## 🔒 Sécurité

L'API vérifie:
1. ✅ Token JWT valide
2. ✅ Token non expiré
3. ✅ Rôle = 'admin'
4. ✅ Email unique lors de la création
5. ✅ Impossible de se supprimer soi-même

**Codes d'erreur:**
- `401` - Token manquant ou invalide
- `403` - Non admin (accès refusé)
- `404` - Utilisateur non trouvé
- `409` - Email déjà existant
- `500` - Erreur serveur

## 🐛 Dépannage

### Erreur: "Failed to fetch users"

**Cause:** Serveur non démarré ou URL incorrecte

**Solution:**
```powershell
npm run dev
```

### Erreur: "Session expirée" (401)

**Cause:** Token JWT expiré

**Solution:**
1. Se reconnecter sur `/admin/login`
2. Le nouveau token sera sauvegardé automatiquement

### Erreur: "Accès refusé" (403)

**Cause:** L'utilisateur n'est pas admin

**Solution:**
1. Vérifier le rôle dans Supabase:
```sql
SELECT id, name, email, role FROM users WHERE email = 'votre@email.com';
```

2. Mettre à jour le rôle si nécessaire:
```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

### Erreur: "Table users introuvable"

**Cause:** La table n'existe pas dans Supabase

**Solution:**
Créer la table dans Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(50),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Erreur: Dialog ne s'ouvre pas

**Cause:** Composants shadcn/ui manquants

**Solution:**
```powershell
npx shadcn@latest add dialog
npx shadcn@latest add select
```

## 📊 Structure de la table users

```sql
CREATE TABLE users (
  -- Identité
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Accès et statut
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  email_verified BOOLEAN DEFAULT false,
  
  -- Informations supplémentaires
  phone VARCHAR(50),
  country VARCHAR(100),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();
```

## ✅ Checklist de vérification

- [ ] Table `users` existe dans Supabase
- [ ] Serveur de dev démarré (`npm run dev`)
- [ ] Connexion admin réussie
- [ ] Page `/admin/users` se charge sans erreur
- [ ] Liste des utilisateurs s'affiche
- [ ] Bouton "Add User" fonctionne
- [ ] Formulaire s'ouvre correctement
- [ ] Création d'utilisateur réussie
- [ ] Modification d'utilisateur réussie
- [ ] Suppression d'utilisateur réussie
- [ ] Toast notifications s'affichent
- [ ] Filtres fonctionnent (All, Admins, Users, etc.)
- [ ] Statistiques s'affichent correctement

## 📝 Résumé

✅ **API créée:** `/api/admin/users.ts` avec CRUD complet
✅ **Frontend amélioré:** Boutons Add/Edit/Delete + Dialog modal
✅ **Sécurité:** Authentification JWT + vérification rôle admin
✅ **UX:** Toast notifications + gestion d'erreurs
✅ **Tests:** Scripts de test fournis
✅ **Documentation:** Guide complet

**Prêt à utiliser!** 🚀
