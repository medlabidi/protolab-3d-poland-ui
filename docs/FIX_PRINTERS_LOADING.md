# 🔧 Fix: Échec de chargement des imprimantes

## ❌ Problème
L'erreur "Échec du chargement des imprimantes" apparaît car la table `printers` n'existe pas dans Supabase.

## ✅ Solution Rapide (3 étapes)

### Étape 1: Créer la table dans Supabase

1. Ouvrez votre **Supabase Dashboard**: https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu latéral)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier: `SQL/create-printers-table.sql`
6. Cliquez sur **Run** (ou F5)

✅ Vous devriez voir: "Success. No rows returned"

### Étape 2: Vérifier que la table existe

Dans le SQL Editor, exécutez:
```sql
SELECT * FROM printers;
```

Vous devriez voir 4 imprimantes par défaut:
- Prusa i3 MK3S+
- Creality Ender 3 Pro
- Anycubic i3 Mega
- Artillery Sidewinder X1

### Étape 3: Tester l'API

```bash
# Option A: Depuis le terminal
node test-printers-api.js

# Option B: Vérifier directement dans le navigateur
# 1. Ouvrez l'app: http://localhost:5173
# 2. Connectez-vous en tant qu'admin
# 3. Allez sur: /admin/printers
# 4. Les imprimantes devraient s'afficher
```

---

## 🔍 Diagnostic des Erreurs

### Erreur: "Unauthorized - No token provided"
**Cause:** Vous n'êtes pas connecté ou votre token a expiré

**Solution:**
1. Reconnectez-vous via `/admin/login`
2. Vérifiez que `localStorage.accessToken` existe
3. Vérifiez que votre compte a `role = 'admin'`

### Erreur: "relation printers does not exist"
**Cause:** La table n'a pas été créée dans Supabase

**Solution:**
Exécutez `SQL/create-printers-table.sql` dans Supabase SQL Editor

### Erreur: "Failed to fetch"
**Cause:** Problème de connexion réseau ou CORS

**Solution:**
1. Vérifiez que l'API est démarrée
2. Vérifiez `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   # ou pour production:
   VITE_API_URL=https://your-domain.vercel.app/api
   ```

---

## 📊 Structure de la Table Printers

```sql
CREATE TABLE printers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,           -- Nom de l'imprimante
  status VARCHAR(50),                    -- online, offline, maintenance
  current_job TEXT,                      -- Job en cours
  progress INTEGER,                      -- 0-100%
  temperature INTEGER,                   -- Température buse
  bed_temp INTEGER,                      -- Température plateau
  uptime VARCHAR(50),                    -- Taux de disponibilité
  total_prints INTEGER,                  -- Nombre total d'impressions
  
  -- Maintenance
  last_maintenance TIMESTAMP,            -- Dernière maintenance
  next_maintenance TIMESTAMP,            -- Prochaine maintenance
  maintenance_cost_monthly DECIMAL,      -- Coût mensuel (PLN)
  maintenance_interval_days INTEGER,     -- Intervalle (jours)
  
  -- Métadonnées
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Endpoints API Disponibles

### GET /api/printers
Récupère toutes les imprimantes
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.vercel.app/api/printers
```

### POST /api/printers
Créer une nouvelle imprimante
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Prusa MK4","status":"offline","temperature":25}' \
     https://your-domain.vercel.app/api/printers
```

### PATCH /api/printers
Mettre à jour une imprimante
```bash
curl -X PATCH \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"id":"uuid-here","status":"online","temperature":210}' \
     https://your-domain.vercel.app/api/printers
```

### DELETE /api/printers?id=uuid
Supprimer une imprimante
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.vercel.app/api/printers?id=uuid-here
```

---

## 🧪 Test Automatique

Utilisez le script de test:
```bash
# Avec votre token admin
ADMIN_TOKEN="your-jwt-token" node test-printers-api.js
```

Le script vérifie:
- ✅ Connexion à l'API
- ✅ Authentification
- ✅ Accès à la table printers
- ✅ Récupération des données

---

## ✅ Checklist de Vérification

- [ ] Table `printers` créée dans Supabase
- [ ] 4 imprimantes de test insérées
- [ ] Variable `VITE_API_URL` configurée dans `.env`
- [ ] Connexion admin fonctionnelle
- [ ] Token JWT valide dans localStorage
- [ ] Rôle admin dans la table users
- [ ] API `/api/printers` accessible
- [ ] Page `/admin/printers` charge les données

---

## 📞 Support

Si le problème persiste après ces étapes:

1. **Vérifiez les logs du serveur**
   ```bash
   # En développement
   npm run dev
   
   # Vérifiez la console pour les erreurs
   ```

2. **Vérifiez la console du navigateur**
   - F12 > Console
   - Recherchez les erreurs fetch ou 401/403/500

3. **Vérifiez Supabase**
   - Dashboard > Table Editor > printers
   - La table doit exister avec des données

4. **Variables d'environnement**
   ```bash
   # .env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   VITE_API_URL=/api
   ```
