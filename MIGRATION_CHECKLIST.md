## ✅ Checklist de Migration - Print Jobs & Design Assistance

### 📋 Avant de Commencer

- [ ] J'ai un backup de ma base de données (optionnel mais recommandé)
- [ ] Mon serveur backend fonctionne actuellement
- [ ] J'ai accès au dashboard Supabase
- [ ] J'ai vérifié mon fichier `.env` (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY)

### 🚀 Exécution de la Migration

#### Étape 1: Préparer
- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans "SQL Editor"
- [ ] Créer une nouvelle requête

#### Étape 2: Exécuter le SQL
- [ ] Ouvrir `SQL/separate-print-design-tables.sql`
- [ ] Copier tout le contenu
- [ ] Coller dans l'éditeur Supabase
- [ ] Cliquer sur "Run"
- [ ] Attendre la confirmation (30-60 secondes)

#### Étape 3: Vérifier dans Supabase
- [ ] Voir le message "Migration Complete!"
- [ ] Vérifier que `print_jobs` existe (dans Table Editor)
- [ ] Vérifier que `design_requests` existe
- [ ] Vérifier que les données sont migrées

### 🧪 Vérification Automatique

#### Exécuter les Scripts
- [ ] Exécuter `node verify-migration.js`
  - [ ] Voir "print_jobs table exists ✓"
  - [ ] Voir "design_requests table exists ✓"
  - [ ] Voir "all_orders view exists ✓"
- [ ] Exécuter `node test-new-tables.js`
  - [ ] Les requêtes fonctionnent
  - [ ] Les statistiques s'affichent
  - [ ] Aucune erreur

### 🔄 Redémarrage du Serveur

- [ ] Arrêter le serveur actuel (Ctrl+C)
- [ ] Se placer dans le dossier server: `cd server`
- [ ] Redémarrer: `npm run dev`
- [ ] Vérifier qu'il démarre sans erreur
- [ ] Vérifier les logs pour les erreurs de connexion

### 🎯 Tests Fonctionnels

#### Test 1: Créer un Print Job
- [ ] Aller sur l'interface de soumission
- [ ] Uploader un fichier STL
- [ ] Remplir les paramètres (matériel, couleur, etc.)
- [ ] Soumettre
- [ ] Vérifier que la commande apparaît dans le dashboard

#### Test 2: Créer une Design Request
- [ ] Aller sur la page Design Assistance
- [ ] Remplir le formulaire:
  - [ ] Nom du projet
  - [ ] Description de l'idée
  - [ ] Type d'utilisation
  - [ ] Demander un chat (optionnel)
- [ ] Soumettre
- [ ] Vérifier que la demande apparaît dans le dashboard admin

#### Test 3: Dashboard Admin
- [ ] Se connecter en tant qu'admin
- [ ] Aller sur "Orders"
- [ ] Vérifier que les deux types s'affichent:
  - [ ] Print jobs (icône d'imprimante)
  - [ ] Design requests (icône de palette)
- [ ] Filtrer par type:
  - [ ] Cliquer sur "Print Jobs" - voir uniquement les prints
  - [ ] Cliquer sur "Design Assistance" - voir uniquement les designs
- [ ] Tester la mise à jour de statut:
  - [ ] Pour un print job: changer de "submitted" à "in_queue"
  - [ ] Pour une design request: changer de "pending" à "in_review"

#### Test 4: Dashboard Utilisateur
- [ ] Se connecter en tant qu'utilisateur
- [ ] Aller sur "My Orders"
- [ ] Vérifier que toutes les commandes s'affichent
- [ ] Vérifier les détails d'une commande
- [ ] Vérifier que les conversations existent

### 📊 Vérification des Données

#### Dans Supabase SQL Editor
```sql
-- Comptage par table
SELECT 'print_jobs' as table_name, COUNT(*) as total FROM print_jobs
UNION ALL
SELECT 'design_requests', COUNT(*) FROM design_requests
UNION ALL
SELECT 'orders (old)', COUNT(*) FROM orders;
```
- [ ] Les totaux correspondent
- [ ] Aucune donnée perdue

```sql
-- Vérifier les statuts
SELECT status, COUNT(*) FROM print_jobs GROUP BY status;
SELECT design_status, COUNT(*) FROM design_requests GROUP BY design_status;
```
- [ ] Les statuts sont corrects
- [ ] Aucun statut NULL ou invalide

```sql
-- Vérifier les relations
SELECT COUNT(*) FROM print_jobs WHERE parent_design_request_id IS NOT NULL;
```
- [ ] Les relations parent-enfant sont préservées

### 🔍 Vérification des Indices

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'print_jobs' 
ORDER BY indexname;
```
- [ ] 6 indices pour print_jobs
- [ ] 6 indices pour design_requests

### ✨ Fonctionnalités Avancées

#### Test de Création Print depuis Design
- [ ] Dans admin, ouvrir une design request complétée
- [ ] Cliquer sur "Create Print Job"
- [ ] Vérifier que le print job est lié (parent_design_request_id)

#### Test des Conversations
- [ ] Chaque nouvelle commande a une conversation
- [ ] Les admins peuvent envoyer des messages
- [ ] Les utilisateurs reçoivent les notifications

### 📝 Documentation

- [ ] Lire `docs/SEPARATE_TABLES_GUIDE.md`
- [ ] Consulter `docs/DATABASE_ARCHITECTURE.md`
- [ ] Garder `MIGRATION_README.md` comme référence

### 🎉 Finalisation

- [ ] Tous les tests passent
- [ ] Aucune erreur dans les logs
- [ ] L'interface fonctionne correctement
- [ ] Les utilisateurs peuvent créer des commandes
- [ ] Les admins peuvent gérer les commandes

### 📌 Optionnel: Backup de l'ancienne table

Après 1-2 jours de vérification:
```sql
ALTER TABLE orders RENAME TO orders_backup_2026_01_11;
COMMENT ON TABLE orders_backup_2026_01_11 IS 'Backup avant séparation en print_jobs et design_requests';
```
- [ ] Vérifier que tout fonctionne depuis plusieurs jours
- [ ] Renommer l'ancienne table
- [ ] Garder le backup pendant 1 mois minimum

---

## 🚨 Si Quelque Chose Ne Va Pas

### Rollback (en cas de problème majeur)

1. Supprimer les nouvelles tables:
```sql
DROP TABLE IF EXISTS print_jobs CASCADE;
DROP TABLE IF EXISTS design_requests CASCADE;
DROP VIEW IF EXISTS all_orders;
```

2. L'ancienne table `orders` est toujours là
3. Redémarrer avec l'ancien code
4. Analyser le problème avant de réessayer

---

## ✅ État Final Attendu

```
Database Tables:
  ✓ print_jobs          (X records)
  ✓ design_requests     (Y records)
  ✓ orders (backup)     (X+Y records)
  ✓ all_orders (view)

Backend Models:
  ✓ PrintJob.ts
  ✓ DesignRequest.ts

Backend Services:
  ✓ printJob.service.ts
  ✓ designRequest.service.ts
  ✓ order.service.ts (updated)

Frontend:
  ✓ Can create print jobs
  ✓ Can create design requests
  ✓ Admin sees both types
  ✓ User sees their orders
  ✓ Conversations work

Tests:
  ✓ verify-migration.js passes
  ✓ test-new-tables.js passes
  ✓ Manual testing complete
```

---

**Dernière mise à jour:** 11 janvier 2026  
**Temps total estimé:** 15-20 minutes  
**Difficulté:** ⭐⭐ (Facile)
