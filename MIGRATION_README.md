# 🚀 Migration Rapide - Séparer Print Jobs et Design Assistance

## 📋 Ce qui va se passer

La migration va créer **2 nouvelles tables** séparées:
- `print_jobs` - Pour les impressions 3D
- `design_requests` - Pour l'assistance de design

**Temps estimé:** 5 minutes  
**Perte de données:** Aucune (les anciennes données sont conservées)

---

## 🎯 Option 1: Script Automatique (Recommandé)

### Windows PowerShell:
```powershell
.\run-migration.ps1
```

Le script va:
1. ✅ Vérifier votre configuration
2. ✅ Vous guider dans Supabase
3. ✅ Vérifier la migration
4. ✅ Tester les nouvelles tables
5. ✅ Redémarrer le serveur

---

## 🎯 Option 2: Manuel

### Étape 1: Ouvrir Supabase
1. Allez sur: https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"**
4. Cliquez sur **"+ New query"**

### Étape 2: Copier le SQL
1. Ouvrez: `SQL/separate-print-design-tables.sql`
2. Copiez tout le contenu
3. Collez dans l'éditeur Supabase
4. Cliquez sur **"Run"**

### Étape 3: Vérifier
```bash
node verify-migration.js
```

### Étape 4: Tester
```bash
node test-new-tables.js
```

### Étape 5: Redémarrer
```bash
cd server
npm run dev
```

---

## ✅ Vérification Rapide

Après la migration, vérifiez dans Supabase SQL Editor:

```sql
-- Compter les enregistrements
SELECT 'print_jobs' as table_name, COUNT(*) FROM print_jobs
UNION ALL
SELECT 'design_requests', COUNT(*) FROM design_requests;
```

Vous devriez voir:
```
table_name         | count
-------------------|-------
print_jobs         | X
design_requests    | Y
```

---

## 📝 Résumé des Fichiers Créés

### Base de données
- ✅ `SQL/separate-print-design-tables.sql` - Migration SQL

### Backend
- ✅ `server/src/models/PrintJob.ts` - Modèle print jobs
- ✅ `server/src/models/DesignRequest.ts` - Modèle design requests
- ✅ `server/src/services/printJob.service.ts` - Service print jobs
- ✅ `server/src/services/designRequest.service.ts` - Service design requests

### Scripts de vérification
- ✅ `verify-migration.js` - Vérifie que tout est créé
- ✅ `test-new-tables.js` - Teste les nouvelles tables
- ✅ `run-migration.ps1` - Script automatique

### Documentation
- ✅ `docs/SEPARATE_TABLES_GUIDE.md` - Guide complet
- ✅ `docs/SEPARATE_TABLES_SUMMARY.md` - Résumé
- ✅ `docs/DATABASE_ARCHITECTURE.md` - Diagrammes
- ✅ `MIGRATION_GUIDE_EXECUTE.md` - Guide d'exécution

---

## 🔧 En cas de problème

### "Table already exists"
✅ **C'est OK!** Les tables existent déjà. Passez à la vérification.

### "Cannot connect to Supabase"
1. Vérifiez votre `.env`
2. Vérifiez `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
3. Testez la connexion: `node check-database.js`

### Le serveur ne démarre pas
1. Vérifiez les logs d'erreur
2. Vérifiez que toutes les dépendances sont installées: `npm install`
3. Redémarrez: `npm run dev`

---

## 📞 Besoin d'aide?

1. **Guide complet**: `docs/SEPARATE_TABLES_GUIDE.md`
2. **Architecture**: `docs/DATABASE_ARCHITECTURE.md`
3. **Vérifier le statut**: `node verify-migration.js`

---

## 🎉 Après la Migration

Testez ces scénarios:

1. ✅ Créer une commande d'impression (print job)
2. ✅ Créer une demande de design
3. ✅ Voir toutes les commandes dans le dashboard admin
4. ✅ Filtrer par type (print/design)
5. ✅ Mettre à jour le statut
6. ✅ Vérifier que les conversations se créent automatiquement

---

**Date:** 11 janvier 2026  
**Status:** ✅ Prêt à déployer  
**Rétrocompatible:** Oui  
**Backup automatique:** Oui
