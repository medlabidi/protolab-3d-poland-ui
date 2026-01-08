# 🚀 Guide de Démarrage Rapide - Maintenance des Imprimantes

## Installation en 5 minutes

### Étape 1: Migration Base de Données ⚡
```bash
# Connexion à Supabase
# Via SQL Editor dans le dashboard Supabase:

1. Ouvrir https://app.supabase.com/project/YOUR_PROJECT/sql
2. Cliquer "New query"
3. Copier le contenu de: SQL/add-printer-maintenance-costs.sql
4. Cliquer "Run"
5. Vérifier le message: "Success. No rows returned"
```

### Étape 2: Données d'Exemple (Optionnel) 📊
```bash
# Toujours dans SQL Editor:

1. Nouvelle query
2. Copier: SQL/seed-printer-maintenance.sql
3. Run
4. Vous verrez les NOTICE avec nombre de logs insérés
```

### Étape 3: Build Frontend 🎨
```bash
cd client
npm install  # Si ce n'est pas déjà fait
npm run build
# Ou en dev: npm run dev
```

### Étape 4: Accès ✅
```
1. Ouvrir: http://localhost:5173/admin/login
2. Se connecter avec compte admin
3. Sidebar → Resources → Maintenance
4. OU directement: /admin/printers/maintenance
```

---

## Vérification Rapide

### Check 1: Tables
```sql
-- Dans Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('printers', 'printer_maintenance_logs');

-- Devrait retourner 2 lignes
```

### Check 2: Colonnes
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'printers' 
AND column_name LIKE 'maintenance%';

-- Devrait retourner 6 colonnes
```

### Check 3: Vue
```sql
SELECT * FROM printer_maintenance_insights LIMIT 1;

-- Devrait retourner des données
```

### Check 4: Frontend
```
✅ Page charge sans erreur
✅ 4 cartes de stats visibles
✅ Graphique de répartition affiché
✅ Tableau avec données
✅ Badges colorés (vert/jaune/rouge)
```

---

## Utilisation Immédiate

### Voir les Insights
1. **Dashboard Maintenance**: `/admin/printers/maintenance`
   - Vue d'ensemble des coûts
   - Statuts de maintenance
   - Alertes automatiques

### Voir sur Printers
2. **Page Printers**: `/admin/printers`
   - Chaque carte affiche maintenant:
   - 💰 Coût mensuel
   - 📅 Prochaine maintenance

### Navigation
```
Admin Dashboard
└── Resources
    ├── Printers (liste imprimantes)
    └── Maintenance (insights détaillés) ⭐ NOUVEAU
```

---

## Personnalisation Rapide

### Changer le Coût Mensuel
```sql
UPDATE printers 
SET maintenance_cost_monthly = 100.00  -- Nouveau montant
WHERE name = 'Prusa i3 MK3S+';
```

### Changer l'Intervalle
```sql
UPDATE printers 
SET maintenance_interval_days = 60  -- 2 mois au lieu de 3
WHERE id = 'printer-uuid';
```

### Ajouter un Log
```sql
INSERT INTO printer_maintenance_logs (
  printer_id,
  maintenance_type,
  cost,
  description,
  status
) VALUES (
  (SELECT id FROM printers WHERE name = 'Prusa i3 MK3S+'),
  'routine',
  75.00,
  'Maintenance mensuelle',
  'completed'
);

-- Le total_maintenance_cost sera mis à jour automatiquement!
```

---

## Troubleshooting

### ❌ Erreur: Table does not exist
```bash
Solution: Relancer SQL/add-printer-maintenance-costs.sql
```

### ❌ Page blanche /admin/printers/maintenance
```bash
# Vérifier la console navigateur (F12)
# Probable: import manquant

Solution:
cd client
npm install
npm run dev
```

### ❌ Pas de données dans le dashboard
```bash
Solution: Exécuter SQL/seed-printer-maintenance.sql
```

### ❌ Badges ne s'affichent pas
```bash
# Vérifier que ui/badge.tsx existe
ls client/src/components/ui/badge.tsx

# Si absent, l'installer via shadcn:
npx shadcn-ui@latest add badge
```

---

## Fonctionnalités Clés

### 🎯 Ce qui marche out-of-the-box

✅ **Calcul Automatique**
- Total maintenance mis à jour automatiquement
- Dates calculées avec intervalles
- Badges de statut dynamiques

✅ **Visualisations**
- Graphique en barres horizontal
- Tableau détaillé responsive
- 4 cartes métriques clés

✅ **Alertes**
- Rouge: Maintenance en retard
- Jaune: Imminent (< 14 jours)
- Vert: À jour

✅ **Multi-Imprimante**
- Supporte nombre illimité d'imprimantes
- Agrégations automatiques
- Comparaisons visuelles

---

## Prochaines Étapes

1. **Personnaliser les coûts** pour vos imprimantes réelles
2. **Ajuster les intervalles** selon vos besoins
3. **Ajouter des logs** pour l'historique réel
4. **Configurer des alertes** email (à venir)
5. **Exporter des rapports** (à venir)

---

## Support Express

| Problème | Solution |
|----------|----------|
| Migration échoue | Vérifier PostgreSQL 14+ |
| Pas de données | Lancer seed script |
| Page 404 | Vérifier route dans App.tsx |
| Styling cassé | npm install && npm run dev |
| Triggers pas actifs | Re-run migration complète |

---

## Commandes Utiles

```bash
# Dev
npm run dev

# Build
npm run build

# Check SQL
psql -h HOST -U postgres -d postgres -c "SELECT * FROM printer_maintenance_insights;"

# Reset (ATTENTION: perte de données)
DROP TABLE printer_maintenance_logs CASCADE;
DROP VIEW printer_maintenance_insights;
# Puis relancer migration
```

---

## Resources

- 📄 [Documentation Complète](./PRINTER_MAINTENANCE_SYSTEM.md)
- 📊 [Migration SQL](../SQL/add-printer-maintenance-costs.sql)
- 🎨 [Composant React](../client/src/pages/admin/AdminMaintenanceInsights.tsx)
- 🔧 [Seed Data](../SQL/seed-printer-maintenance.sql)

---

**Temps total d'installation: ~5 minutes** ⏱️  
**Niveau requis: Débutant** 🟢  
**Compatibilité: 100%** ✅
