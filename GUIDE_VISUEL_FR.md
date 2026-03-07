# 🎯 Guide Visuel de Migration - Version Française

## 📺 Vue d'ensemble

```
AVANT                           APRÈS
──────                          ─────

orders (table unique)     →     print_jobs
├── print                       ├── file_name
├── design                      ├── material
└── tout mélangé               ├── color
                                └── status: printing

                                design_requests
                                ├── project_name
                                ├── idea_description
                                ├── usage_type
                                └── design_status: pending
```

## 🚀 Processus en 3 Étapes

### Étape 1: Préparation (2 minutes)
```
┌─────────────────────────────────────────┐
│  1. Vérifier votre environnement        │
│     ✓ .env existe                       │
│     ✓ SUPABASE_URL configuré            │
│     ✓ SUPABASE_SERVICE_ROLE_KEY OK      │
│                                         │
│  2. Backup (optionnel)                  │
│     ✓ Export depuis Supabase            │
└─────────────────────────────────────────┘
```

### Étape 2: Migration SQL (2 minutes)
```
┌─────────────────────────────────────────┐
│  Supabase Dashboard                     │
│  ├── SQL Editor                         │
│  ├── + New query                        │
│  ├── Copier: separate-print-design...  │
│  ├── Coller dans l'éditeur             │
│  └── Cliquer "Run" ⚡                   │
│                                         │
│  Résultat attendu:                      │
│  ✓ print_jobs created                   │
│  ✓ design_requests created              │
│  ✓ Data migrated                        │
│  ✓ Indices created                      │
└─────────────────────────────────────────┘
```

### Étape 3: Vérification (1 minute)
```
┌─────────────────────────────────────────┐
│  Terminal                               │
│  $ node verify-migration.js             │
│                                         │
│  Output:                                │
│  ✓ print_jobs table exists              │
│  ✓ design_requests table exists         │
│  ✓ all_orders view exists               │
│  ✓ Migration Complete!                  │
└─────────────────────────────────────────┘
```

## 📊 Structure des Données

### Print Jobs (Impressions 3D)
```
┌────────────────────────────────────────────┐
│ print_jobs                                 │
├────────────────────────────────────────────┤
│ 📄 Fichier                                 │
│   • file_name: "support.stl"              │
│   • file_url: "https://..."               │
│                                            │
│ 🎨 Spécifications                          │
│   • material: "PLA"                        │
│   • color: "Bleu"                          │
│   • layer_height: 0.2mm                    │
│   • infill: 20%                            │
│   • quantity: 2                            │
│                                            │
│ 📈 Statut                                  │
│   submitted → in_queue → printing          │
│   → finished → delivered ✓                 │
│                                            │
│ 💰 Prix: 45.00 PLN                         │
│ 🚚 Livraison: InPost Paczkomat            │
└────────────────────────────────────────────┘
```

### Design Requests (Assistance Design)
```
┌────────────────────────────────────────────┐
│ design_requests                            │
├────────────────────────────────────────────┤
│ 💡 Projet                                  │
│   • project_name: "Support téléphone"     │
│   • idea_description: "Je veux..."        │
│                                            │
│ 🎯 Usage                                   │
│   • usage_type: functional                 │
│   • usage_details: "Doit tenir iPhone"    │
│   • dimensions: "100x60x40mm"              │
│                                            │
│ 📎 Références                              │
│   • attached_files: [sketch.jpg, ref.pdf] │
│   • reference_images: [img1.jpg]          │
│                                            │
│ 💬 Communication                           │
│   • request_chat: Oui ✓                    │
│                                            │
│ 📈 Statut Design                           │
│   pending → in_review → in_progress        │
│   → completed ✓                            │
│                                            │
│ 👨‍💼 Admin                                   │
│   • admin_design_file: "model.stl"        │
│   • admin_notes: "Modifié selon..."       │
└────────────────────────────────────────────┘
```

## 🔄 Flux de Travail

### Scénario 1: Impression Directe
```
Client                  Système                 Admin
  │                       │                       │
  │ Upload STL           │                       │
  ├──────────────────────>│                       │
  │                       │                       │
  │                       │ CREATE print_job      │
  │                       │ status: submitted     │
  │                       │                       │
  │                       │ Notification ────────>│
  │                       │                       │
  │                       │                       │ Approuve
  │                       │<──────────────────────┤
  │                       │ status: in_queue      │
  │                       │                       │
  │ Email confirmation   │                       │
  │<──────────────────────│                       │
  │                       │                       │
  │                       │                       │ Imprime
  │                       │<──────────────────────┤
  │                       │ status: printing      │
  │                       │                       │
  │ SMS mise à jour      │                       │
  │<──────────────────────│                       │
  │                       │                       │
  │                       │                       │ Termine
  │                       │<──────────────────────┤
  │                       │ status: finished      │
  │                       │                       │
  │ Prêt à récupérer!    │                       │
  │<──────────────────────│                       │
```

### Scénario 2: Design puis Impression
```
Client                  Système                 Admin
  │                       │                       │
  │ Soumet idée          │                       │
  ├──────────────────────>│                       │
  │                       │                       │
  │                       │ CREATE design_request │
  │                       │ design_status: pending│
  │                       │                       │
  │                       │ Notification ────────>│
  │                       │                       │
  │                       │                       │ Revue
  │                       │<──────────────────────┤
  │                       │ status: in_review     │
  │                       │                       │
  │ Questions?           │<──────────────────────┤
  │<──────────────────────┤ Via chat              │
  │                       │                       │
  │ Réponses             │                       │
  ├──────────────────────>├──────────────────────>│
  │                       │                       │
  │                       │                       │ Design
  │                       │<──────────────────────┤
  │                       │ status: in_progress   │
  │                       │                       │
  │                       │                       │ Upload 3D
  │                       │<──────────────────────┤
  │                       │ admin_design_file     │
  │                       │ status: completed ✓   │
  │                       │                       │
  │ Fichier prêt!        │                       │
  │<──────────────────────│                       │
  │                       │                       │
  │ Commander impression?│                       │
  ├──────────────────────>│                       │
  │                       │                       │
  │                       │ CREATE print_job      │
  │                       │ parent_design_request │
  │                       │                       │
  │    (Suite comme Scénario 1...)               │
```

## 🎨 Interface Utilisateur

### Dashboard Client
```
┌─────────────────────────────────────────────────┐
│ Mes Commandes                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🖨️  Support Bureau               [printing]    │
│     PLA Bleu • 45.00 PLN                       │
│     Créé: 10/01/2026                           │
│                                                 │
│ 🎨  Support Téléphone            [in_progress] │
│     Design assistance • Devis en cours          │
│     Créé: 08/01/2026                           │
│     💬 3 messages non lus                      │
│                                                 │
│ 🖨️  Boîtier Raspberry Pi         [delivered]  │
│     PETG Noir • 62.00 PLN                      │
│     Créé: 05/01/2026                           │
│     ✓ Livré le 09/01/2026                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Dashboard Admin
```
┌─────────────────────────────────────────────────┐
│ Orders Management                               │
├─────────────────────────────────────────────────┤
│ [All] [Print Jobs] [Design Assistance]         │
│                                                 │
│ 🖨️  Support Bureau - Jean Dupont              │
│     PLA Bleu • in_queue                        │
│     [Start Printing] [Contact] [Details]       │
│                                                 │
│ 🎨  Support Téléphone - Marie Martin           │
│     Design • in_progress • 💬 Chat actif       │
│     [Upload Design] [Message] [Details]        │
│                                                 │
│ 🖨️  Boîtier Pi - Pierre Leroy                 │
│     PETG Noir • printing                       │
│     [Mark Finished] [Track] [Details]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 📈 Statistiques

### Avant Migration
```
┌────────────────────┐
│ orders             │
├────────────────────┤
│ Total: 150         │
│ ├─ Type inconnu    │
│ ├─ Données mixtes  │
│ └─ Queries lentes  │
└────────────────────┘
```

### Après Migration
```
┌────────────────────┐  ┌────────────────────┐
│ print_jobs         │  │ design_requests    │
├────────────────────┤  ├────────────────────┤
│ Total: 120         │  │ Total: 30          │
│ ├─ submitted: 5    │  │ ├─ pending: 8      │
│ ├─ in_queue: 3     │  │ ├─ in_review: 4    │
│ ├─ printing: 2     │  │ ├─ in_progress: 6  │
│ ├─ finished: 10    │  │ ├─ completed: 10   │
│ └─ delivered: 100  │  │ └─ cancelled: 2    │
│                    │  │                    │
│ + 6 indices        │  │ + 6 indices        │
│ Queries rapides ⚡  │  │ Queries rapides ⚡  │
└────────────────────┘  └────────────────────┘
```

## ✅ Avantages de la Séparation

### Performance
```
AVANT                     APRÈS
─────                     ─────
SELECT * FROM orders      SELECT * FROM print_jobs
WHERE order_type='print'  (direct, indexé)
⏱️  150ms                  ⏱️  10ms
```

### Maintenance
```
AVANT                           APRÈS
─────                           ─────
Ajouter un champ design    →   Ajouter seulement dans
Affecte TOUS les orders         design_requests
⚠️  Risque d'erreurs             ✅ Sûr et isolé
```

### Clarté du Code
```typescript
// AVANT
interface Order {
  // Champs pour print
  material?: string;  // ❌ Optionnel partout
  color?: string;
  
  // Champs pour design
  idea_description?: string;  // ❌ Confusion
  usage_type?: string;
}

// APRÈS
interface PrintJob {
  material: string;  // ✅ Requis et clair
  color: string;
  layer_height: number;
}

interface DesignRequest {
  idea_description: string;  // ✅ Requis et clair
  usage_type: UsageType;
  project_name: string;
}
```

## 🎯 Commandes Rapides

### Lancer la Migration
```bash
# Option 1: Script automatique
.\run-migration.ps1

# Option 2: Étape par étape
node verify-migration.js
node test-new-tables.js
```

### Vérifier le Statut
```bash
# Vérifier que tout fonctionne
node verify-migration.js

# Tester les tables
node test-new-tables.js

# Compter les enregistrements
# (Dans Supabase SQL Editor)
SELECT 'print_jobs', COUNT(*) FROM print_jobs
UNION ALL
SELECT 'design_requests', COUNT(*) FROM design_requests;
```

---

**Temps total:** 5 minutes  
**Difficulté:** ⭐⭐☆☆☆ (Facile)  
**Risque:** Très faible (backup automatique)  
**Support:** Documentation complète incluse
