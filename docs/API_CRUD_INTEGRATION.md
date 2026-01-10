# 🔌 API & CRUD Integration - Documentation Complète

## ✅ APIs Créées

### 1. **Printers API** (`/api/printers`)

**Endpoint:** `/api/printers/index.ts`

**Méthodes:**
- `GET` - Récupérer toutes les imprimantes
- `POST` - Créer une nouvelle imprimante
- `PATCH/PUT` - Mettre à jour une imprimante
- `DELETE` - Supprimer une imprimante

**Authentification:** Required (Admin)

**Request/Response:**
```typescript
// GET Response
{
  printers: Printer[]
}

// POST Request
{
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  temperature?: number;
  bed_temp?: number;
  maintenance_cost_monthly?: number;
  maintenance_interval_days?: number;
}

// PATCH Request
{
  id: string;
  // ... champs à mettre à jour
}

// DELETE Request
?id=printer_id
```

### 2. **Materials API** (`/api/materials`)

**Endpoint:** `/api/materials/index.ts`

**Méthodes:**
- `GET` - Récupérer tous les matériaux
- `POST` - Créer un nouveau matériau
- `PATCH/PUT` - Mettre à jour un matériau
- `DELETE` - Supprimer un matériau (soft delete)

**Authentification:** Required (Admin)

**Request/Response:**
```typescript
// GET Response
{
  materials: Material[]
}

// POST Request
{
  name: string;
  type: string;
  color: string;
  price_per_kg: number;
  density?: number;
  stock_quantity?: number;
  print_temp?: number;
  bed_temp?: number;
  supplier?: string;
}

// DELETE - Soft delete (is_active = false)
```

### 3. **Suppliers API** (`/api/suppliers`)

**Endpoint:** `/api/suppliers/index.ts`

**Méthodes:**
- `GET` - Récupérer tous les fournisseurs
- `POST` - Créer un nouveau fournisseur
- `PATCH/PUT` - Mettre à jour un fournisseur
- `DELETE` - Supprimer un fournisseur (soft delete)

**Authentification:** Required (Admin)

**Request/Response:**
```typescript
// GET Response
{
  suppliers: Supplier[]
}

// POST Request
{
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  materials_supplied?: string[];
  payment_terms?: string;
  delivery_time?: string;
}

// DELETE - Soft delete (active = false)
```

### 4. **Maintenance API** (Existant)

**Endpoints:**
- `/api/maintenance/insights.ts` - GET - Analytics de maintenance
- `/api/maintenance/logs.ts` - GET/POST - Logs de maintenance

## 🔐 Authentification

### Token Bearer

Tous les endpoints admin requièrent:
```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Vérification Admin

```typescript
// Chaque API vérifie:
1. Token valide
2. User existe
3. User.role === 'admin'
```

## 🛣️ Routes Frontend

### Router Configuration (`client/src/App.tsx`)

**Routes Publiques:**
- `/` - Landing page
- `/about` - À propos
- `/services` - Services
- `/signin`, `/login` - Connexion
- `/signup` - Inscription

**Routes Protégées (User):**
- `/dashboard` - Dashboard utilisateur
- `/new-print` - Nouvelle impression
- `/orders` - Liste des commandes
- `/settings` - Paramètres
- `/credits` - Crédits

**Routes Admin (`<AdminProtectedRoute>`):**
```typescript
/admin                              → AdminDashboard
/admin/login                        → AdminLogin (public)
/admin/orders                       → AdminOrders
/admin/orders/:orderId             → AdminOrderDetails
/admin/orders/print-jobs           → AdminPrintJobs
/admin/orders/design-assistance    → AdminDesignAssistance
/admin/users                       → AdminUsers
/admin/conversations               → AdminConversations
/admin/printers                    → AdminPrinters  ✅ CRUD complet
/admin/printers/maintenance        → AdminMaintenanceInsights
/admin/materials                   → AdminMaterials  ✅ CRUD à intégrer
/admin/suppliers                   → AdminSuppliers  ✅ CRUD à intégrer
/admin/analytics                   → AdminAnalytics
/admin/reports                     → AdminReports
/admin/notifications               → AdminNotifications
/admin/settings                    → AdminSettings
```

## 🔄 CRUD Operations - AdminPrinters

### État Complet

```typescript
const [printers, setPrinters] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [showAddDialog, setShowAddDialog] = useState(false);
const [showEditDialog, setShowEditDialog] = useState(false);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [editingPrinter, setEditingPrinter] = useState<any>(null);
const [deletingPrinter, setDeletingPrinter] = useState<any>(null);
```

### Create (POST)

```typescript
const handleAddPrinter = async () => {
  const response = await fetch(`${API_URL}/printers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: newPrinter.name,
      status: newPrinter.status,
      maintenance_cost_monthly: newPrinter.maintenanceCostMonthly,
      // ... autres champs
    }),
  });
  
  if (response.ok) {
    await fetchPrinters(); // Reload
    toast.success("Imprimante ajoutée!");
  }
};
```

### Read (GET)

```typescript
const fetchPrinters = async () => {
  setLoading(true);
  const response = await fetch(`${API_URL}/printers`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    setPrinters(data.printers || []);
  }
  setLoading(false);
};

useEffect(() => {
  fetchPrinters();
}, []);
```

### Update (PATCH)

```typescript
const handleUpdatePrinter = async () => {
  const response = await fetch(`${API_URL}/printers`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: editingPrinter.id,
      name: editingPrinter.name,
      // ... champs modifiés
    }),
  });
  
  if (response.ok) {
    await fetchPrinters(); // Reload
    toast.success("Imprimante mise à jour!");
  }
};
```

### Delete (DELETE)

```typescript
const handleConfirmDelete = async () => {
  const response = await fetch(`${API_URL}/printers?id=${deletingPrinter.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.ok) {
    await fetchPrinters(); // Reload
    toast.success("Imprimante supprimée!");
  }
};
```

### Status Update (PATCH)

```typescript
const handleStatusChange = async (printerId: string, newStatus: string) => {
  const response = await fetch(`${API_URL}/printers`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ id: printerId, status: newStatus }),
  });
  
  if (response.ok) {
    setPrinters(printers.map(p => 
      p.id === printerId ? { ...p, status: newStatus } : p
    ));
    toast.success("Statut mis à jour!");
  }
};
```

## 🎨 UI States

### Loading State

```tsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <p className="text-gray-400">Chargement...</p>
  </div>
) : ...}
```

### Empty State

```tsx
{printers.length === 0 ? (
  <Card>
    <CardContent className="p-12 text-center">
      <Printer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">
        Aucune imprimante
      </h3>
      <Button onClick={() => setShowAddDialog(true)}>
        Ajouter une imprimante
      </Button>
    </CardContent>
  </Card>
) : ...}
```

## 🔧 Custom Hook - useApi

**Fichier:** `client/src/hooks/useApi.ts`

**Usage:**
```typescript
import { useApi } from '@/hooks/useApi';

const { loading, error, get, post, patch, del } = useApi();

// GET
await get('/printers');

// POST
await post('/printers', printerData, {
  successMessage: 'Imprimante créée!',
  showErrorToast: true,
});

// PATCH
await patch('/printers', updateData);

// DELETE
await del('/printers?id=123');
```

**Avantages:**
- Gestion centralisée des erreurs
- Toast automatiques
- Loading state intégré
- Headers auth automatiques

## 📊 Database Schema

### Printers Table

```sql
CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model TEXT,
  status TEXT CHECK (status IN ('online', 'offline', 'maintenance')),
  current_job TEXT,
  progress INTEGER DEFAULT 0,
  temperature INTEGER,
  bed_temp INTEGER,
  uptime TEXT,
  total_prints INTEGER DEFAULT 0,
  last_maintenance DATE,
  next_maintenance DATE,
  maintenance_cost_monthly DECIMAL(10,2),
  maintenance_interval_days INTEGER DEFAULT 90,
  maintenance_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Materials Table

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  density DECIMAL(5,2),
  stock_quantity DECIMAL(10,2),
  print_temp INTEGER,
  bed_temp INTEGER,
  supplier TEXT,
  last_restocked DATE,
  reorder_point DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Suppliers Table

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  materials_supplied TEXT[],
  payment_terms TEXT,
  delivery_time TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  total_orders INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Data Flow

### Create Flow
```
User clicks "Add" button
  → Dialog opens
  → User fills form
  → handleAddPrinter()
  → POST /api/printers
  → Supabase INSERT
  → fetchPrinters() reload
  → UI updates with new data
  → Toast success
```

### Update Flow
```
User clicks "Edit" button
  → Dialog opens with current data
  → User modifies fields
  → handleUpdatePrinter()
  → PATCH /api/printers
  → Supabase UPDATE
  → fetchPrinters() reload
  → UI updates
  → Toast success
```

### Delete Flow
```
User clicks "Delete" button
  → Confirmation dialog opens
  → Shows printer details
  → User confirms
  → handleConfirmDelete()
  → DELETE /api/printers?id=X
  → Supabase DELETE
  → fetchPrinters() reload
  → UI updates (printer removed)
  → Toast success
```

## 🛡️ Error Handling

### API Level
```typescript
try {
  const response = await fetch(endpoint, options);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  
  return await response.json();
} catch (error) {
  console.error('Error:', error);
  toast.error(error.message);
  return null;
}
```

### Component Level
```typescript
const handleAction = async () => {
  try {
    // Action logic
    toast.success('Success!');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Erreur lors de l\'opération');
  }
};
```

## ✅ Prochaines Étapes

### AdminMaterials
- [ ] Intégrer fetchMaterials() au mount
- [ ] Connecter handleAdd/Update/Delete aux API
- [ ] Ajouter loading/empty states
- [ ] Tester CRUD complet

### AdminSuppliers
- [ ] Intégrer fetchSuppliers() au mount
- [ ] Connecter handleAdd/Update/Delete aux API
- [ ] Ajouter loading/empty states
- [ ] Tester CRUD complet

### Optimisations
- [ ] Implement React Query pour cache
- [ ] Ajouter pagination
- [ ] Ajouter filtres et recherche
- [ ] Optimistic UI updates
- [ ] Debounce sur search inputs

## 📝 Testing Checklist

- [x] API Printers - GET fonctionnel
- [x] API Printers - POST fonctionnel
- [x] API Printers - PATCH fonctionnel
- [x] API Printers - DELETE fonctionnel
- [x] AdminPrinters - CRUD complet intégré
- [x] AdminPrinters - Loading state
- [x] AdminPrinters - Empty state
- [x] AdminPrinters - Error handling
- [ ] API Materials - Tests
- [ ] API Suppliers - Tests
- [ ] AdminMaterials - Integration
- [ ] AdminSuppliers - Integration

## 🚀 Deployment

### Vercel Configuration

Les APIs serverless sont automatiquement déployées:
```
/api/printers/index.ts      → /api/printers
/api/materials/index.ts     → /api/materials
/api/suppliers/index.ts     → /api/suppliers
```

### Environment Variables

```env
VITE_API_URL=/api  # Frontend
SUPABASE_URL=...   # Backend
SUPABASE_KEY=...   # Backend
JWT_SECRET=...     # Backend
```

---

**Status:** ✅ AdminPrinters CRUD complet et opérationnel
**Prochaine priorité:** Intégrer Materials & Suppliers CRUD
