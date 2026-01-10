# ✅ Dialog Unifié - Édition Imprimante + Maintenance

## 🎯 Modifications Effectuées

### 1. **Un Seul Bouton Edit**

**Avant:**
```
┌─────────────────────────────────────────┐
│ 🖨️ Prusa i3    [✏️ Edit] [🗑️ Delete]   │
│ ...                                      │
│ Coût: 75 PLN/mois [✏️]                  │ ← Bouton edit séparé
└─────────────────────────────────────────┘
```

**Après:**
```
┌─────────────────────────────────────────┐
│ 🖨️ Prusa i3    [✏️ Edit] [🗑️ Delete]   │ ← Un seul bouton
│ ...                                      │
│ Coût: 75 PLN/mois                       │ ← Pas de bouton séparé
└─────────────────────────────────────────┘
```

### 2. **Dialog Edit Unifié**

Le bouton **Edit** ouvre maintenant un dialog complet avec:

**Section 1: Informations Imprimante**
- ✅ Nom
- ✅ Statut (Online/Offline/Maintenance)
- ✅ Température buse
- ✅ Température plateau
- ✅ Job actuel

**Section 2: Paramètres de Maintenance**
- ✅ Coût mensuel (PLN)
- ✅ Intervalle de maintenance (jours)
- ✅ Calculs automatiques:
  - Coût annuel
  - Nombre d'interventions/an

### 3. **Dialog Add Printer Enrichi**

Le dialog **Add Printer** inclut maintenant les mêmes sections:

**Section 1: Informations de Base**
- Nom
- Statut initial
- Températures

**Section 2: Paramètres de Maintenance**
- Coût mensuel (défaut: 0)
- Intervalle (défaut: 90 jours)
- Calculs en temps réel

## 🔧 Changements Techniques

### States Modifiés

**Supprimé:**
```typescript
const [showEditMaintenanceDialog, setShowEditMaintenanceDialog] = useState(false);
```

**newPrinter étendu:**
```typescript
const [newPrinter, setNewPrinter] = useState({
  name: "",
  status: "offline",
  temperature: 25,
  bedTemp: 25,
  maintenanceCostMonthly: 0,        // ✅ Nouveau
  maintenanceIntervalDays: 90,       // ✅ Nouveau
});
```

### Handlers Modifiés

**handleEditPrinter()** - Inclut maintenant les données de maintenance:
```typescript
const handleEditPrinter = (printer: any) => {
  setEditingPrinter({ 
    ...printer,
    maintenanceCostMonthly: printer.maintenanceCostMonthly || 0,
    maintenanceIntervalDays: printer.maintenanceIntervalDays || 90,
  });
  setShowEditDialog(true);
};
```

**handleAddPrinter()** - Calcule nextMaintenance automatiquement:
```typescript
const nextMaintenanceDate = new Date();
nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + newPrinter.maintenanceIntervalDays);

const printer = {
  // ...autres champs
  maintenanceCostMonthly: newPrinter.maintenanceCostMonthly,
  maintenanceIntervalDays: newPrinter.maintenanceIntervalDays,
  nextMaintenance: nextMaintenanceDate.toISOString().split('T')[0],
};
```

**Supprimés:**
```typescript
❌ handleEditMaintenance()
❌ handleSaveMaintenance()
```

### Dialogs Modifiés

**1. Add Printer Dialog**
```tsx
{/* Nouvelle section ajoutée */}
<div className="pt-4 border-t border-gray-700">
  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
    <DollarSign className="w-4 h-4 text-blue-400" />
    Paramètres de Maintenance
  </h4>
  <div className="space-y-4">
    {/* Champs de maintenance */}
  </div>
</div>
```

**2. Edit Printer Dialog**
```tsx
{/* Section ajoutée après les champs de base */}
<div className="pt-4 border-t border-gray-700">
  <h4 className="text-sm font-semibold text-white mb-3">
    Paramètres de Maintenance
  </h4>
  <div className="space-y-4">
    {/* Champs de maintenance avec calculs */}
  </div>
</div>
```

**3. Edit Maintenance Dialog**
```
❌ Supprimé complètement
```

### Imports Nettoyés

**Supprimé:**
```typescript
❌ Pencil (icône non utilisée)
```

## 🎨 Interface Utilisateur

### Calculs Automatiques

Les deux dialogs affichent un panneau de calcul en temps réel:

```tsx
{maintenanceCostMonthly > 0 && (
  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
    <div className="space-y-1 text-xs">
      <div className="flex justify-between">
        <span>Coût Annuel:</span>
        <span>{(maintenanceCostMonthly * 12).toFixed(2)} PLN</span>
      </div>
      <div className="flex justify-between">
        <span>Maintenances/An:</span>
        <span>≈ {Math.floor(365 / maintenanceIntervalDays)} interventions</span>
      </div>
    </div>
  </div>
)}
```

### Affichage dans la Carte

La section maintenance est maintenant en lecture seule:

```tsx
<div className="pt-3 border-t border-gray-800">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-blue-400" />
      <span className="text-gray-400 text-xs">Coût Maintenance</span>
    </div>
    <span className="text-white font-semibold text-sm">
      {printer.maintenanceCostMonthly?.toFixed(2) || '0.00'} PLN/mois
    </span>
  </div>
  {/* Prochaine maintenance */}
</div>
```

**Plus de bouton edit séparé!** ✅

## 📊 Workflow Utilisateur

### Ajouter une Imprimante

1. Cliquer **Add Printer**
2. Remplir informations de base
3. ⬇️ Défiler vers **Paramètres de Maintenance**
4. Entrer coût mensuel et intervalle
5. Voir calculs en temps réel
6. Cliquer **Ajouter l'imprimante**

### Éditer une Imprimante

1. Cliquer **Edit** (✏️) sur la carte
2. Dialog unifié s'ouvre avec:
   - Section imprimante (haut)
   - Section maintenance (bas)
3. Modifier n'importe quel champ
4. Voir calculs automatiques
5. Cliquer **Mettre à jour**

### Avantages

- ✅ **Interface simplifiée:** Un seul bouton pour tout modifier
- ✅ **Cohérence:** Même structure pour Add et Edit
- ✅ **Moins de clics:** Pas besoin d'ouvrir 2 dialogs différents
- ✅ **Vue complète:** Toutes les infos dans un seul dialog
- ✅ **Calculs automatiques:** Coût annuel et fréquence visibles instantanément

## 🔍 Comparaison

### Avant

```
Actions disponibles:
1. Edit Printer → Dialog avec infos de base uniquement
2. Edit Maintenance (icône ✏️ dans section maintenance) → Dialog séparé
3. Delete Printer → Confirmation

Total: 3 boutons, 3 dialogs différents
```

### Après

```
Actions disponibles:
1. Edit Printer → Dialog unifié (infos + maintenance)
2. Delete Printer → Confirmation

Total: 2 boutons, 2 dialogs
```

## 📝 Résumé des Changements

### Supprimés ❌
- Dialog Edit Maintenance (séparé)
- Bouton Pencil dans section maintenance
- State `showEditMaintenanceDialog`
- Handlers `handleEditMaintenance` et `handleSaveMaintenance`
- Import `Pencil` de lucide-react

### Ajoutés ✅
- Section Maintenance dans Add Printer Dialog
- Section Maintenance dans Edit Printer Dialog
- Champs maintenance dans `newPrinter` state
- Calcul automatique de `nextMaintenance` dans `handleAddPrinter`
- Initialisation des valeurs maintenance dans `handleEditPrinter`

### Modifiés 🔄
- `newPrinter` state: +2 champs
- `handleEditPrinter()`: Inclut données maintenance
- `handleAddPrinter()`: Calcule nextMaintenance
- Add Printer Dialog: +section maintenance
- Edit Printer Dialog: +section maintenance
- Affichage carte: Suppression du bouton edit maintenance

## ✅ Validation

- **TypeScript:** ✅ Aucune erreur
- **Imports:** ✅ Nettoyés (Pencil supprimé)
- **States:** ✅ Simplifiés (1 dialog en moins)
- **Handlers:** ✅ Optimisés (2 handlers en moins)
- **UX:** ✅ Améliorée (moins de clics, interface unifiée)

## 🚀 Utilisation

```bash
cd client
npm run dev

# Tester:
# 1. Ajouter imprimante → Voir section maintenance avec calculs
# 2. Éditer imprimante → Voir toutes les infos + maintenance
# 3. Modifier coût → Calculs s'actualisent en temps réel
```

---

**Résultat:** Interface plus simple, plus intuitive, et plus cohérente! 🎉
