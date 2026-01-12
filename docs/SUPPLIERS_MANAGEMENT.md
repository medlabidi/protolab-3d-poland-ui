# Suppliers Management - Guide d'utilisation

## Vue d'ensemble
Le système de gestion des fournisseurs (Suppliers Management) permet de gérer tous les fournisseurs de matériaux pour l'impression 3D, suivre leurs performances, et maintenir des relations commerciales.

## Installation

### 1. Créer la table dans Supabase
Exécutez le fichier SQL dans votre console Supabase :
```bash
SQL/create-suppliers-table.sql
```

Ce script va :
- ✅ Créer la table `suppliers` avec tous les champs nécessaires
- ✅ Créer les index pour optimiser les performances
- ✅ Activer Row Level Security (RLS)
- ✅ Créer les politiques d'accès (admins peuvent tout gérer, utilisateurs peuvent voir les actifs)
- ✅ Insérer 4 fournisseurs par défaut (PolyMaker, Spectrum, Rosa3D, Devil Design)

### 2. Redémarrer le serveur
```bash
npm run dev
```

## Endpoints API

### Obtenir tous les fournisseurs
```http
GET /api/admin/suppliers
Authorization: Bearer {admin_token}
```

**Réponse :**
```json
{
  "suppliers": [...],
  "count": 4
}
```

### Obtenir les fournisseurs actifs uniquement
```http
GET /api/admin/suppliers/active
Authorization: Bearer {admin_token}
```

### Obtenir les fournisseurs préférés
```http
GET /api/admin/suppliers/preferred
Authorization: Bearer {admin_token}
```

### Obtenir les fournisseurs par type de matériau
```http
GET /api/admin/suppliers/material/{materialType}
Authorization: Bearer {admin_token}

Exemple: /api/admin/suppliers/material/PLA
```

### Obtenir un fournisseur par ID
```http
GET /api/admin/suppliers/{id}
Authorization: Bearer {admin_token}
```

### Créer un nouveau fournisseur
```http
POST /api/admin/suppliers
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Nouveau Fournisseur",
  "company_name": "Entreprise XYZ",
  "email": "contact@xyz.com",
  "phone": "+48 12 345 6789",
  "address": "ul. Example 123",
  "city": "Warsaw",
  "postal_code": "00-001",
  "country": "Poland",
  "materials_supplied": ["PLA", "PETG", "ABS"],
  "lead_time_days": 5,
  "payment_terms": "Net 30",
  "is_preferred": false
}
```

### Mettre à jour un fournisseur
```http
PATCH /api/admin/suppliers/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "quality_rating": 4.5,
  "reliability_rating": 4.8,
  "is_preferred": true
}
```

### Mettre à jour les statistiques après une commande
```http
PATCH /api/admin/suppliers/{id}/stats
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "orderAmount": 1500.00
}
```

### Supprimer un fournisseur
```http
DELETE /api/admin/suppliers/{id}
Authorization: Bearer {admin_token}
```

### Obtenir les statistiques des fournisseurs
```http
GET /api/admin/suppliers/stats
Authorization: Bearer {admin_token}
```

**Réponse :**
```json
{
  "stats": {
    "total": 4,
    "active": 4,
    "inactive": 0,
    "preferred": 2,
    "totalOrders": 156,
    "totalSpent": 45678.50
  }
}
```

## Structure des données

### Champs principaux
- **name** : Nom du fournisseur (unique)
- **email** : Email de contact
- **materials_supplied** : Liste des matériaux fournis
- **lead_time_days** : Délai de livraison moyen
- **status** : `active`, `inactive`, `suspended`, `pending`
- **is_preferred** : Fournisseur préféré
- **quality_rating** : Note de qualité (0-5)
- **reliability_rating** : Note de fiabilité (0-5)
- **price_rating** : Note de prix (0-5)
- **total_orders** : Nombre total de commandes
- **total_spent** : Montant total dépensé

## Utilisation dans le code

### Import du service
```typescript
import { supplierService } from '../services/supplier.service';
```

### Exemples d'utilisation
```typescript
// Obtenir tous les fournisseurs actifs
const suppliers = await supplierService.getActiveSuppliers();

// Obtenir les fournisseurs pour un matériau spécifique
const plaSuppliers = await supplierService.getSuppliersByMaterial('PLA');

// Créer un nouveau fournisseur
const newSupplier = await supplierService.createSupplier({
  name: "Test Supplier",
  email: "test@example.com",
  materials_supplied: ["PLA", "PETG"]
});

// Mettre à jour les stats après une commande
await supplierService.updateSupplierStats(supplierId, 1200.00);
```

## Fournisseurs par défaut

Le système inclut 4 fournisseurs polonais par défaut :

1. **PolyMaker Poland** - Fournisseur préféré
   - Matériaux : PLA, PETG, ABS, TPU, Nylon
   - Ville : Warsaw

2. **Spectrum Filaments** - Fournisseur préféré
   - Matériaux : PLA, PETG, ABS, ASA, PC
   - Ville : Peczniów

3. **Rosa3D**
   - Matériaux : PLA, PETG, Resin, TPU
   - Ville : Poznań

4. **Devil Design**
   - Matériaux : PLA, PETG, ABS, HIPS, Silk PLA
   - Ville : Wrocław

## Sécurité

- ✅ Row Level Security (RLS) activé
- ✅ Les admins peuvent tout gérer
- ✅ Les utilisateurs normaux peuvent seulement voir les fournisseurs actifs
- ✅ Authentification Bearer token requise

## Prochaines étapes

Pour créer l'interface admin frontend :
1. Créer `client/src/pages/admin/AdminSuppliers.tsx`
2. Ajouter la route dans `client/src/App.tsx`
3. Ajouter le lien dans `client/src/components/AdminSidebar.tsx`

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.
