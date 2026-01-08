# 🗄️ Schéma Base de Données - Maintenance des Imprimantes

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────┐    │
│  │   PRINTERS   │────┐    │  MAINTENANCE_LOGS        │    │
│  │              │    │    │                          │    │
│  │ + id (PK)    │    └───▶│ + id (PK)                │    │
│  │ + name       │         │ + printer_id (FK)        │    │
│  │ + model      │         │ + maintenance_date       │    │
│  │ + status     │         │ + maintenance_type       │    │
│  │ + cost_pln   │         │ + cost                   │    │
│  │              │         │ + description            │    │
│  │ MAINTENANCE: │         │ + parts_replaced[]       │    │
│  │ + maintenance_cost_monthly      │ + performed_by           │    │
│  │ + total_maintenance_cost        │ + duration_minutes       │    │
│  │ + last_maintenance_date         │ + status                 │    │
│  │ + next_maintenance_date         │                          │    │
│  │ + maintenance_interval_days     └──────────────────────────┘    │
│  │ + maintenance_notes │                                     │
│  └──────────────────────┘                                     │
│           │                                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────────────┐                               │
│  │ MAINTENANCE_INSIGHTS     │  (VIEW)                       │
│  │                          │                               │
│  │ Agrégations:             │                               │
│  │ - Total maintenances     │                               │
│  │ - Emergency count        │                               │
│  │ - Avg cost               │                               │
│  │ - Days until next        │                               │
│  └──────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Table: `printers` (Existante + Extensions)

### Colonnes Existantes
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique (PK) |
| `name` | VARCHAR(100) | Nom de l'imprimante |
| `model` | VARCHAR(100) | Modèle |
| `power_watts` | DECIMAL(10,2) | Puissance en watts |
| `cost_pln` | DECIMAL(10,2) | Coût d'achat en PLN |
| `lifespan_hours` | INTEGER | Durée de vie en heures |
| `maintenance_rate` | DECIMAL(5,4) | Taux de maintenance (0.03 = 3%) |
| `status` | VARCHAR(20) | operational, maintenance, offline |
| `is_default` | BOOLEAN | Imprimante par défaut |
| `is_active` | BOOLEAN | Active ou non |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Dernière modification |

### ➕ Nouvelles Colonnes Maintenance

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `maintenance_cost_monthly` | DECIMAL(10,2) | YES | 0.00 | 💰 Coût mensuel estimé |
| `total_maintenance_cost` | DECIMAL(10,2) | YES | 0.00 | 💰 Coût total cumulé |
| `last_maintenance_date` | TIMESTAMP | YES | NULL | 📅 Dernière intervention |
| `next_maintenance_date` | TIMESTAMP | YES | NULL | 📅 Prochaine planifiée |
| `maintenance_interval_days` | INTEGER | YES | 90 | ⏱️ Intervalle en jours |
| `maintenance_notes` | TEXT | YES | NULL | 📝 Notes et observations |

### Index
```sql
CREATE INDEX idx_printers_next_maintenance 
ON printers(next_maintenance_date) 
WHERE is_active = true;
```

---

## Table: `printer_maintenance_logs` (Nouvelle)

### Structure Complète

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | 🔑 Identifiant unique (PK) |
| `printer_id` | UUID | NO | - | 🔗 Référence vers printers(id) |
| `maintenance_date` | TIMESTAMP | NO | NOW() | 📅 Date de l'intervention |
| `maintenance_type` | VARCHAR(50) | NO | - | 🏷️ Type (voir valeurs) |
| `cost` | DECIMAL(10,2) | NO | 0.00 | 💰 Coût de l'intervention |
| `description` | TEXT | YES | NULL | 📝 Description détaillée |
| `parts_replaced` | TEXT[] | YES | NULL | 🔧 Liste des pièces |
| `performed_by` | VARCHAR(100) | YES | NULL | 👤 Technicien |
| `duration_minutes` | INTEGER | YES | NULL | ⏱️ Durée en minutes |
| `next_scheduled_date` | TIMESTAMP | YES | NULL | 📅 Prochaine planifiée |
| `status` | VARCHAR(20) | YES | 'completed' | ✅ Statut (voir valeurs) |
| `created_at` | TIMESTAMP | NO | NOW() | 📅 Date de création |
| `updated_at` | TIMESTAMP | NO | NOW() | 📅 Dernière modification |

### Valeurs Énumérées

**maintenance_type:**
- `routine` - Maintenance préventive régulière
- `repair` - Réparation suite à panne
- `upgrade` - Amélioration/upgrade matériel
- `emergency` - Intervention d'urgence

**status:**
- `completed` - Terminée
- `scheduled` - Planifiée future
- `in_progress` - En cours
- `cancelled` - Annulée

### Index
```sql
CREATE INDEX idx_maintenance_logs_printer 
ON printer_maintenance_logs(printer_id);

CREATE INDEX idx_maintenance_logs_date 
ON printer_maintenance_logs(maintenance_date);

CREATE INDEX idx_maintenance_logs_status 
ON printer_maintenance_logs(status);
```

### Contraintes
```sql
-- Foreign Key
ALTER TABLE printer_maintenance_logs
ADD CONSTRAINT fk_printer
FOREIGN KEY (printer_id) 
REFERENCES printers(id) 
ON DELETE CASCADE;
```

---

## Vue: `printer_maintenance_insights`

### Définition

```sql
CREATE OR REPLACE VIEW printer_maintenance_insights AS
SELECT 
  p.id,
  p.name,
  p.model,
  p.status,
  p.maintenance_cost_monthly,
  p.total_maintenance_cost,
  p.last_maintenance_date,
  p.next_maintenance_date,
  p.maintenance_interval_days,
  
  -- Calcul jours restants
  EXTRACT(DAY FROM (p.next_maintenance_date - NOW())) as days_until_maintenance,
  
  -- Agrégations des logs
  COUNT(pml.id) as total_maintenance_count,
  SUM(CASE WHEN pml.maintenance_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count,
  AVG(pml.cost) as avg_maintenance_cost,
  MAX(pml.maintenance_date) as last_recorded_maintenance
  
FROM printers p
LEFT JOIN printer_maintenance_logs pml 
  ON p.id = pml.printer_id 
  AND pml.status = 'completed'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.model, p.status, 
         p.maintenance_cost_monthly, p.total_maintenance_cost,
         p.last_maintenance_date, p.next_maintenance_date, 
         p.maintenance_interval_days;
```

### Colonnes Retournées

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID imprimante |
| `name` | VARCHAR | Nom |
| `model` | VARCHAR | Modèle |
| `status` | VARCHAR | Statut opérationnel |
| `maintenance_cost_monthly` | DECIMAL | Coût mensuel |
| `total_maintenance_cost` | DECIMAL | Total cumulé |
| `last_maintenance_date` | TIMESTAMP | Dernière intervention |
| `next_maintenance_date` | TIMESTAMP | Prochaine planifiée |
| `maintenance_interval_days` | INTEGER | Intervalle |
| `days_until_maintenance` | INTEGER | 📊 Jours restants (calculé) |
| `total_maintenance_count` | BIGINT | 📊 Nombre total interventions |
| `emergency_count` | BIGINT | 📊 Nombre urgences |
| `avg_maintenance_cost` | DECIMAL | 📊 Coût moyen |
| `last_recorded_maintenance` | TIMESTAMP | 📊 Dernier log enregistré |

---

## Triggers

### 1. Update Total Maintenance Cost

**Nom:** `trigger_update_printer_maintenance_cost`

**Déclenchement:** AFTER INSERT OR UPDATE ON `printer_maintenance_logs`

**Fonction:**
```sql
CREATE OR REPLACE FUNCTION update_printer_total_maintenance_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE printers 
    SET 
      total_maintenance_cost = COALESCE(total_maintenance_cost, 0) + NEW.cost,
      last_maintenance_date = NEW.maintenance_date,
      next_maintenance_date = NEW.next_scheduled_date
    WHERE id = NEW.printer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**But:** Mettre à jour automatiquement le coût total quand un log est complété

---

### 2. Update Timestamp

**Nom:** `trigger_maintenance_log_updated_at`

**Déclenchement:** BEFORE UPDATE ON `printer_maintenance_logs`

**Fonction:**
```sql
CREATE OR REPLACE FUNCTION update_maintenance_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**But:** Mettre à jour automatiquement le timestamp à chaque modification

---

## Relations

### One-to-Many: printers ➜ printer_maintenance_logs

```
┌─────────────┐       1      ┌─────────────────────────┐
│   printers  │───────────────│  maintenance_logs       │
│             │               │                         │
│  id (PK)    │◀──────────────│  printer_id (FK)        │
└─────────────┘       ∞       └─────────────────────────┘
```

- Une imprimante peut avoir **plusieurs** logs de maintenance
- Un log de maintenance appartient à **une seule** imprimante
- `ON DELETE CASCADE` : Si l'imprimante est supprimée, ses logs aussi

---

## Exemples de Requêtes

### Récupérer insights d'une imprimante
```sql
SELECT * 
FROM printer_maintenance_insights 
WHERE name = 'Prusa i3 MK3S+';
```

### Maintenances en retard
```sql
SELECT * 
FROM printer_maintenance_insights 
WHERE days_until_maintenance < 0
ORDER BY days_until_maintenance ASC;
```

### Top 5 coûts mensuels
```sql
SELECT name, maintenance_cost_monthly
FROM printers
WHERE is_active = true
ORDER BY maintenance_cost_monthly DESC
LIMIT 5;
```

### Historique d'une imprimante
```sql
SELECT 
  maintenance_date,
  maintenance_type,
  cost,
  description
FROM printer_maintenance_logs
WHERE printer_id = 'uuid-here'
ORDER BY maintenance_date DESC;
```

### Total dépensé par type
```sql
SELECT 
  maintenance_type,
  COUNT(*) as count,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost
FROM printer_maintenance_logs
WHERE status = 'completed'
GROUP BY maintenance_type
ORDER BY total_cost DESC;
```

---

## Migrations

### Ordre d'Exécution

1. ✅ `SQL/add-printer-maintenance-costs.sql`
   - Ajoute colonnes à `printers`
   - Crée table `printer_maintenance_logs`
   - Crée vue `printer_maintenance_insights`
   - Crée triggers

2. ✅ `SQL/seed-printer-maintenance.sql` (Optionnel)
   - Données d'exemple pour tests

### Rollback (Revert)

```sql
-- Supprimer vue
DROP VIEW IF EXISTS printer_maintenance_insights;

-- Supprimer triggers
DROP TRIGGER IF EXISTS trigger_update_printer_maintenance_cost 
ON printer_maintenance_logs;

DROP TRIGGER IF EXISTS trigger_maintenance_log_updated_at 
ON printer_maintenance_logs;

-- Supprimer fonctions
DROP FUNCTION IF EXISTS update_printer_total_maintenance_cost();
DROP FUNCTION IF EXISTS update_maintenance_log_timestamp();

-- Supprimer table
DROP TABLE IF EXISTS printer_maintenance_logs CASCADE;

-- Supprimer colonnes de printers
ALTER TABLE printers 
  DROP COLUMN IF EXISTS maintenance_cost_monthly,
  DROP COLUMN IF EXISTS total_maintenance_cost,
  DROP COLUMN IF EXISTS last_maintenance_date,
  DROP COLUMN IF EXISTS next_maintenance_date,
  DROP COLUMN IF EXISTS maintenance_interval_days,
  DROP COLUMN IF EXISTS maintenance_notes;
```

---

## Taille & Performance

### Estimations

**Table `printer_maintenance_logs`:**
- ~100 bytes par log
- 4 imprimantes × 4 maintenances/an = 16 logs/an
- Sur 5 ans = 80 logs
- Taille estimée: **~8 KB** (négligeable)

**Index:**
- 3 index B-tree = ~3-5 KB

**Vue:**
- Pas de stockage (virtuellement calculée)

**Total:** < 15 KB pour 5 ans de données

### Optimisations

- ✅ Index sur `printer_id` pour JOINs rapides
- ✅ Index sur `maintenance_date` pour tri
- ✅ Index sur `status` pour filtrage
- ✅ Vue matérialisée possible si besoin (pas nécessaire)

---

## Sécurité

### Permissions Recommandées

```sql
-- Admin: Full access
GRANT ALL ON printers TO admin_role;
GRANT ALL ON printer_maintenance_logs TO admin_role;
GRANT ALL ON printer_maintenance_insights TO admin_role;

-- Technicien: Insert logs, read all
GRANT SELECT, INSERT ON printer_maintenance_logs TO technician_role;
GRANT SELECT ON printers TO technician_role;
GRANT SELECT ON printer_maintenance_insights TO technician_role;

-- Manager: Read only
GRANT SELECT ON printers TO manager_role;
GRANT SELECT ON printer_maintenance_logs TO manager_role;
GRANT SELECT ON printer_maintenance_insights TO manager_role;
```

---

## Backup & Restore

### Backup
```bash
# Backup complet
pg_dump -h HOST -U postgres -d DATABASE \
  -t printers \
  -t printer_maintenance_logs \
  > backup_maintenance.sql

# Backup données uniquement
pg_dump -h HOST -U postgres -d DATABASE \
  -t printers \
  -t printer_maintenance_logs \
  --data-only \
  > backup_maintenance_data.sql
```

### Restore
```bash
psql -h HOST -U postgres -d DATABASE < backup_maintenance.sql
```

---

**Schéma Version:** 1.0.0  
**Dernière mise à jour:** 2026-01-08  
**Compatible:** PostgreSQL 14+
