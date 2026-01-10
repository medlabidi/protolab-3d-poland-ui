# 🔧 Système de Gestion des Coûts de Maintenance des Imprimantes

## 📋 Vue d'ensemble

Ce système moderne permet de suivre et analyser les coûts de maintenance de chaque imprimante 3D dans votre parc. Il offre une visibilité complète sur les dépenses de maintenance, les plannings, et les insights financiers pour une meilleure gestion des ressources.

---

## ✨ Fonctionnalités

### 1. **Suivi des Coûts de Maintenance**
- ✅ Coût mensuel de maintenance par imprimante
- ✅ Coût total cumulé depuis l'achat
- ✅ Historique complet de toutes les interventions
- ✅ Calcul automatique des totaux

### 2. **Planning de Maintenance**
- ✅ Date de dernière maintenance
- ✅ Date de prochaine maintenance planifiée
- ✅ Intervalle configurable (par défaut 90 jours)
- ✅ Alertes pour maintenances en retard
- ✅ Notifications pour maintenances imminentes

### 3. **Dashboard Insights**
- ✅ Coût mensuel total du parc
- ✅ Projection annuelle
- ✅ Répartition visuelle par imprimante
- ✅ Statistiques de maintenance (urgences, moyenne, etc.)
- ✅ Vue consolidée de l'état du parc

### 4. **Historique de Maintenance**
- ✅ Logs détaillés de chaque intervention
- ✅ Types de maintenance (routine, réparation, urgence, upgrade)
- ✅ Pièces remplacées
- ✅ Durée d'intervention
- ✅ Coût par intervention
- ✅ Mise à jour automatique des totaux

---

## 🗄️ Structure de Base de Données

### Table `printers` - Colonnes ajoutées

```sql
-- Coûts
maintenance_cost_monthly DECIMAL(10,2)    -- Coût mensuel estimé
total_maintenance_cost DECIMAL(10,2)      -- Coût cumulé total

-- Planification
last_maintenance_date TIMESTAMP           -- Dernière intervention
next_maintenance_date TIMESTAMP           -- Prochaine intervention planifiée
maintenance_interval_days INTEGER         -- Intervalle en jours (défaut: 90)

-- Documentation
maintenance_notes TEXT                    -- Notes et observations
```

### Table `printer_maintenance_logs` - Nouvelle table

```sql
CREATE TABLE printer_maintenance_logs (
  id UUID PRIMARY KEY,
  printer_id UUID REFERENCES printers(id),
  maintenance_date TIMESTAMP,
  maintenance_type VARCHAR(50),           -- 'routine', 'repair', 'upgrade', 'emergency'
  cost DECIMAL(10,2),
  description TEXT,
  parts_replaced TEXT[],                  -- Liste des pièces
  performed_by VARCHAR(100),
  duration_minutes INTEGER,
  next_scheduled_date TIMESTAMP,
  status VARCHAR(20),                     -- 'completed', 'scheduled', 'in_progress'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Vue `printer_maintenance_insights`

Vue consolidée pour le dashboard admin avec:
- Statistiques de maintenance par imprimante
- Nombre total d'interventions
- Nombre d'urgences
- Coût moyen par intervention
- Jours avant prochaine maintenance
- État global

---

## 📁 Fichiers Créés/Modifiés

### SQL
- **`SQL/add-printer-maintenance-costs.sql`** (NOUVEAU)
  - Migration complète avec colonnes
  - Table historique
  - Triggers automatiques
  - Vue insights

### Frontend
- **`client/src/pages/admin/AdminMaintenanceInsights.tsx`** (NOUVEAU)
  - Dashboard complet de maintenance
  - Visualisations des coûts
  - Tableau détaillé par imprimante
  - Alertes et statuts

- **`client/src/pages/admin/AdminPrinters.tsx`** (MODIFIÉ)
  - Ajout affichage coût mensuel
  - Ajout date prochaine maintenance
  - Icons DollarSign et Calendar

- **`client/src/App.tsx`** (MODIFIÉ)
  - Route `/admin/printers/maintenance`

- **`client/src/components/AdminSidebar.tsx`** (MODIFIÉ)
  - Lien "Maintenance" dans menu Resources
  - Icon Wrench

---

## 🚀 Installation

### 1. Migration Base de Données

```bash
# Se connecter à Supabase SQL Editor et exécuter:
psql -h <SUPABASE_HOST> -U postgres -d postgres -f SQL/add-printer-maintenance-costs.sql
```

Ou via Supabase Dashboard:
1. Ouvrir **SQL Editor**
2. Copier le contenu de `SQL/add-printer-maintenance-costs.sql`
3. Exécuter le script

### 2. Vérification

```sql
-- Vérifier les colonnes ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'printers' 
AND column_name LIKE 'maintenance%';

-- Vérifier la table logs
SELECT * FROM printer_maintenance_logs LIMIT 1;

-- Vérifier la vue
SELECT * FROM printer_maintenance_insights;
```

### 3. Frontend

```bash
# Le code est déjà intégré, simplement rebuild
cd client
npm run build

# Ou en développement
npm run dev
```

---

## 💡 Utilisation

### Accès au Dashboard

1. **Connexion Admin**: `https://your-domain.com/admin/login`
2. **Navigation**: Sidebar → Resources → Maintenance
3. **URL directe**: `/admin/printers/maintenance`

### Visualisation des Insights

Le dashboard affiche:
- 📊 **4 cartes statistiques** en haut
  - Coût mensuel total
  - Coût cumulé
  - Maintenances en retard
  - Maintenances imminentes

- 📈 **Graphique de répartition**
  - Barres horizontales par imprimante
  - Pourcentage du coût total
  - Montant en PLN

- 📋 **Tableau détaillé**
  - Toutes les imprimantes
  - Statuts de maintenance
  - Coûts mensuels/totaux
  - Historique
  - Badges de statut (à jour, imminent, en retard)

- 📊 **Métriques clés**
  - Coût moyen par imprimante
  - Intervalle moyen
  - Taux d'urgence

### Page Printers

Chaque carte d'imprimante affiche maintenant:
- 💰 **Coût Maintenance**: XX PLN/mois
- 📅 **Prochaine Maintenance**: Date formatée

---

## 🎨 Design Moderne

### Couleurs & Thème
- **Bleu**: Coûts mensuels
- **Violet**: Coûts cumulés
- **Rouge**: Alertes/retards
- **Jaune**: Imminents/attention
- **Vert**: À jour/OK

### Badges de Statut
- 🔴 **En retard**: maintenance_date < aujourd'hui
- 🟡 **Imminent**: 0-14 jours restants
- 🟢 **À jour**: > 14 jours

### Responsive
- ✅ Desktop: 4 colonnes de stats
- ✅ Tablet: 2 colonnes
- ✅ Mobile: 1 colonne

---

## 🔄 Fonctionnement Automatique

### Triggers

**1. Mise à jour automatique des totaux**
```sql
-- Quand un log de maintenance est complété
-- → Update automatique de printers.total_maintenance_cost
-- → Update de last_maintenance_date
-- → Update de next_maintenance_date
```

**2. Timestamp automatique**
```sql
-- Chaque UPDATE sur printer_maintenance_logs
-- → updated_at = NOW()
```

### Calculs

**Coût Annuel**
```typescript
totalAnnual = maintenance_cost_monthly * 12
```

**Coût Moyen**
```typescript
avgCost = SUM(all_costs) / COUNT(printers)
```

**Taux d'Urgence**
```typescript
emergencyRate = (emergency_count / total_maintenance_count) * 100
```

---

## 📊 Exemples de Données

### Imprimante Standard
```typescript
{
  name: "Prusa i3 MK3S+",
  maintenanceCostMonthly: 75.00,     // 75 PLN/mois
  totalMaintenanceCost: 850.00,       // 850 PLN total
  lastMaintenanceDate: "2026-01-03",
  nextMaintenanceDate: "2026-03-03",  // Dans 54 jours
  maintenanceIntervalDays: 90,        // Tous les 3 mois
  totalMaintenanceCount: 12,           // 12 interventions
  emergencyCount: 2,                   // 2 urgences
  avgMaintenanceCost: 70.83            // Moyenne 70.83 PLN
}
```

### Log de Maintenance
```typescript
{
  printer_id: "uuid-...",
  maintenance_type: "routine",
  cost: 65.00,
  description: "Remplacement courroie X, graissage axes",
  parts_replaced: ["Courroie X", "Graisse PTFE"],
  performed_by: "Technicien A",
  duration_minutes: 45,
  status: "completed"
}
```

---

## 🔮 Évolutions Futures

### Court Terme
- [ ] Formulaire d'ajout de log de maintenance
- [ ] Export Excel/PDF des rapports
- [ ] Notifications par email pour maintenances
- [ ] Upload de photos/documents

### Moyen Terme
- [ ] Prédiction des coûts avec ML
- [ ] Comparaison entre imprimantes
- [ ] Graphiques temporels (évolution)
- [ ] Suivi des pièces de rechange

### Long Terme
- [ ] Intégration fournisseurs (commande auto)
- [ ] Planning équipe de maintenance
- [ ] Analyse ROI par imprimante
- [ ] Maintenance prédictive IoT

---

## 🧪 Tests

### Checklist de Test

- [ ] Migration SQL exécutée sans erreur
- [ ] Colonnes visibles dans table printers
- [ ] Table printer_maintenance_logs créée
- [ ] Vue printer_maintenance_insights accessible
- [ ] Page /admin/printers/maintenance charge
- [ ] Stats affichées correctement
- [ ] Graphique de répartition visible
- [ ] Tableau détaillé complet
- [ ] Badges de statut corrects
- [ ] Responsive mobile/tablet
- [ ] Lien sidebar fonctionnel
- [ ] Coûts affichés sur page Printers

### Commandes de Test SQL

```sql
-- Test insertion log
INSERT INTO printer_maintenance_logs (
  printer_id, 
  maintenance_type, 
  cost, 
  description,
  status
) VALUES (
  (SELECT id FROM printers LIMIT 1),
  'routine',
  75.00,
  'Test maintenance',
  'completed'
);

-- Vérifier mise à jour auto
SELECT 
  name,
  total_maintenance_cost,
  last_maintenance_date
FROM printers;

-- Test de la vue
SELECT * FROM printer_maintenance_insights;
```

---

## 🤝 Compatibilité

### Backend
- ✅ Supabase PostgreSQL 14+
- ✅ Types TypeScript compatibles
- ✅ API existantes non impactées

### Frontend
- ✅ React 18+
- ✅ TypeScript 5+
- ✅ Tailwind CSS 3+
- ✅ shadcn/ui components
- ✅ Lucide icons

### Navigation
- ✅ React Router v6
- ✅ Routes protégées admin
- ✅ Breadcrumb compatible

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier la migration SQL (logs d'erreur)
2. Vérifier les console errors frontend
3. Consulter la documentation Supabase
4. Ouvrir une issue GitHub

---

## 📝 Changelog

### Version 1.0.0 (2026-01-08)
- ✅ Migration base de données complète
- ✅ Table printer_maintenance_logs
- ✅ Vue printer_maintenance_insights
- ✅ Page AdminMaintenanceInsights
- ✅ Intégration AdminPrinters
- ✅ Routes et navigation
- ✅ Design moderne responsive
- ✅ Documentation complète

---

## 🎯 Résumé des Bénéfices

1. **Visibilité Financière**: Connaître précisément les coûts de maintenance
2. **Planification**: Anticiper les interventions et budgets
3. **Optimisation**: Identifier les imprimantes coûteuses
4. **Historique**: Tracer toutes les interventions
5. **Conformité**: Documentation complète pour audits
6. **Décisions**: Données pour renouvellement matériel
7. **Efficacité**: Réduire les pannes par maintenance préventive
8. **Insights**: Comprendre les patterns de maintenance

---

**Développé pour ProtoLab 3D Poland** 🇵🇱  
*Système moderne de gestion de maintenance pour impression 3D professionnelle*
