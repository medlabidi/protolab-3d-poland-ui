# 📋 Ordre d'Exécution des Migrations SQL

## ⚠️ IMPORTANT: Exécuter dans CET ORDRE

### Étape 1: Créer la table printers
**Fichier:** `SQL/create-printers-table.sql`
- Crée la table `printers` avec TOUTES les colonnes nécessaires
- Inclut déjà: maintenance_cost_monthly, last_maintenance, next_maintenance
- Insère 4 imprimantes par défaut
- **Statut:** ✅ À EXÉCUTER EN PREMIER

### Étape 2: NE PAS exécuter add-printer-maintenance-costs.sql
**Fichier:** `SQL/add-printer-maintenance-costs.sql`
- ❌ **NE PAS UTILISER** - Les colonnes existent déjà dans create-printers-table.sql
- Ce fichier fait `ALTER TABLE printers` mais les colonnes sont déjà créées
- **Action:** Ignorer ou supprimer ce fichier

## 🔧 Commandes à Exécuter dans Supabase SQL Editor

```sql
-- 1. VÉRIFIER si la table existe déjà
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'printers';

-- 2. Si la table N'EXISTE PAS, exécuter:
-- Copier-coller TOUT le contenu de SQL/create-printers-table.sql

-- 3. VÉRIFIER que les données sont créées:
SELECT id, name, status, maintenance_cost_monthly, last_maintenance 
FROM printers;

-- Devrait retourner 4 imprimantes
```

## 🚨 Si vous avez DÉJÀ des erreurs

### Scénario A: Table printers n'existe pas
```sql
-- Exécuter create-printers-table.sql
```

### Scénario B: Table printers existe mais est VIDE
```sql
-- Vérifier la structure
\d printers

-- Si les colonnes de maintenance manquent, les ajouter:
ALTER TABLE printers 
ADD COLUMN IF NOT EXISTS maintenance_cost_monthly DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS next_maintenance TIMESTAMP WITH TIME ZONE;

-- Puis insérer les données par défaut
INSERT INTO printers (name, model, manufacturer, status, temperature, bed_temp, uptime, total_prints, maintenance_cost_monthly)
VALUES 
  ('Prusa i3 MK3S+', 'MK3S+', 'Prusa Research', 'online', 210, 60, '98.2%', 342, 75.00),
  ('Creality Ender 3 Pro', 'Ender 3 Pro', 'Creality', 'online', 180, 45, '96.5%', 512, 50.00),
  ('Anycubic i3 Mega', 'i3 Mega', 'Anycubic', 'offline', 25, 25, '0%', 198, 45.00),
  ('Artillery Sidewinder X1', 'Sidewinder X1', 'Artillery', 'maintenance', 85, 40, '82.1%', 287, 60.00);
```

### Scénario C: Tout nettoyer et recommencer
```sql
-- ATTENTION: Supprime toutes les données!
DROP TABLE IF EXISTS printers CASCADE;

-- Puis exécuter create-printers-table.sql
```

## ✅ Vérification Finale

```sql
-- 1. Table existe?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'printers'
);

-- 2. Colonnes correctes?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'printers'
ORDER BY ordinal_position;

-- 3. Données présentes?
SELECT COUNT(*) as total_printers FROM printers;
-- Doit retourner: 4

-- 4. Données complètes?
SELECT * FROM printers;
```

## 📝 Résumé

1. ✅ Exécuter `SQL/create-printers-table.sql` (contient tout)
2. ❌ Ignorer `SQL/add-printer-maintenance-costs.sql` (redondant)
3. ✅ Vérifier avec `SELECT * FROM printers;`
4. ✅ Démarrer le serveur: `npm run dev`
5. ✅ Tester: http://localhost:5173/admin/printers
