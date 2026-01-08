# 🚨 Résultat du Test: Serveur Non Démarré

## ❌ Problèmes Détectés

1. **Serveur API non accessible** (`http://localhost:3000/api/printers`)
   - Le fetch a échoué (Network Error)
   - Aucune réponse du serveur

2. **Variables Supabase manquantes**
   - VITE_SUPABASE_URL non défini
   - VITE_SUPABASE_ANON_KEY non défini

---

## ✅ Solution: Démarrer l'Application

### Option 1: Avec Vite (Recommandé pour dev)

```powershell
# Dans le dossier racine
npm run dev

# Ou dans le dossier client
cd client
npm run dev
```

**L'app sera disponible sur:**
- Frontend: http://localhost:5173
- API (via proxy Vite): http://localhost:5173/api

### Option 2: Avec Variables d'Environnement

**Créez/Vérifiez le fichier `.env`:**

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...votre-clé

# API (en production Vercel)
VITE_API_URL=/api

# En développement local avec serveur séparé
# VITE_API_URL=http://localhost:3000/api
```

**Puis redémarrez:**
```powershell
npm run dev
```

---

## 🧪 Nouvelle Commande de Test

### Sans Token (Test de disponibilité)
```powershell
node test-printers-api.js
```

### Avec Token Admin (Test complet)
```powershell
# 1. Démarrez l'app
npm run dev

# 2. Connectez-vous sur http://localhost:5173/admin/login

# 3. Dans la console du navigateur (F12):
localStorage.accessToken

# 4. Copiez le token et testez:
$env:ADMIN_TOKEN="eyJhbGc...votre-token"
node test-printers-api.js
```

**Ou avec le script batch:**
```cmd
set ADMIN_TOKEN=eyJhbGc...votre-token
test-printers.bat
```

---

## 📋 Checklist Complète

### Étape 1: Configuration
- [ ] Fichier `.env` existe à la racine
- [ ] `VITE_SUPABASE_URL` est défini
- [ ] `VITE_SUPABASE_ANON_KEY` est défini
- [ ] `VITE_API_URL=/api` (pour Vercel) ou `.../api` (dev local)

### Étape 2: Base de Données
- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Exécuter `SQL/create-printers-table.sql`
- [ ] Vérifier: `SELECT * FROM printers;` (4 imprimantes)

### Étape 3: Démarrage
- [ ] Installer les dépendances: `npm install`
- [ ] Démarrer: `npm run dev`
- [ ] Vérifier: http://localhost:5173 accessible

### Étape 4: Test Admin
- [ ] Aller sur http://localhost:5173/admin/login
- [ ] Se connecter (email + password)
- [ ] Aller sur /admin/printers
- [ ] Vérifier que les imprimantes s'affichent

---

## 🎯 Ordre des Opérations

```
1. Configuration .env
   ↓
2. Créer table Supabase (SQL)
   ↓
3. npm install
   ↓
4. npm run dev
   ↓
5. Login admin
   ↓
6. Test /admin/printers
   ↓
7. ✅ Les imprimantes s'affichent!
```

---

## 🔍 Vérification Rapide

```powershell
# 1. Vérifier que .env existe
Get-Content .env

# 2. Vérifier que le port est libre
netstat -an | findstr "5173"

# 3. Démarrer l'app
npm run dev

# 4. Tester l'endpoint dans un nouveau terminal
curl http://localhost:5173/api/health

# 5. Ou ouvrir dans le navigateur
start http://localhost:5173
```

---

## 💡 Conseils

### Si l'API ne répond toujours pas:

1. **Vérifiez le proxy Vite** (`vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

2. **Ou utilisez directement Vercel Dev**:
```powershell
npm install -g vercel
vercel dev
```

3. **Vérifiez que tous les fichiers API existent**:
```powershell
# Doit afficher les fichiers
ls api\printers\index.ts
ls api\materials\index.ts
ls api\suppliers\index.ts
```

---

## 📞 Résumé

**Problème actuel:** Serveur non démarré
**Solution:** `npm run dev`
**Test:** http://localhost:5173/admin/printers

Une fois l'app démarrée, relancez:
```powershell
node test-printers-api.js
```

✅ Le test devrait maintenant fonctionner!
