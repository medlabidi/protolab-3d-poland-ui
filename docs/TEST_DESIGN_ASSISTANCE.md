# Test Design Assistance - Guide Complet

## 🎯 Objectif
Tester la soumission de design assistance avec des données du tableau existant.

## ✅ Modifications apportées

### 1. Suppression de la validation stricte côté client
**Fichier:** [client/src/pages/DesignAssistance.tsx](../client/src/pages/DesignAssistance.tsx#L63-L100)

**Avant:**
```typescript
if (!formData.ideaDescription || !formData.usageDetails) {
  // Erreur si manquant
}
```

**Après:**
```typescript
if (!formData.ideaDescription) {
  // Seulement ideaDescription est requis
}
// usageDetails est optionnel avec valeur par défaut "Not specified"
```

### 2. Valeurs par défaut ajoutées
- `usageDetails`: "Not specified" si vide
- `approximateDimensions`: "Not specified" si vide
- `desiredMaterial`: "Not specified" si vide

### 3. Scripts de test créés

#### SQL: [SQL/test-design-requests-data.sql](../SQL/test-design-requests-data.sql)
Insère 4 exemples de design requests dans la base de données :
- ✅ Mechanical Part (pending)
- ✅ Decorative Vase (in_review)
- ✅ Phone Stand (in_progress)
- ✅ Gaming Accessory (completed)

#### PowerShell: [test-design-request.ps1](../test-design-request.ps1)
Script de test automatisé pour l'API

## 🚀 Instructions de test

### Option 1: Test via Interface Web

1. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

2. **Se connecter**
   - Aller sur http://localhost:8080/login
   - Se connecter avec vos identifiants

3. **Accéder à Design Assistance**
   - Cliquer sur "Design Assistance" dans le menu
   - OU aller directement sur http://localhost:8080/design-assistance

4. **Remplir le formulaire minimal**
   ```
   ✓ Idea Description: "Je veux un support pour mon téléphone"
   ✓ Usage: mechanical (par défaut)
   ✗ Usage Details: (OPTIONNEL maintenant)
   ✗ Dimensions: (OPTIONNEL)
   ✗ Material: (OPTIONNEL)
   ✗ Files: (OPTIONNEL)
   ```

5. **Soumettre**
   - Cliquer sur "Submit Request"
   - Vous devriez voir "Request Submitted"
   - Redirection automatique vers /orders

6. **Vérifier la création**
   - Aller dans votre dashboard
   - Section "Recent Design Requests" devrait afficher votre demande

### Option 2: Test via Script PowerShell

1. **Éditer le script**
   Ouvrir [test-design-request.ps1](../test-design-request.ps1) et modifier:
   ```powershell
   $loginData = @{
       email = "votre-email@gmail.com"  # Votre email
       password = "votre-mot-de-passe"  # Votre mot de passe
   }
   ```

2. **Exécuter le script**
   ```powershell
   cd C:\proto\landing_page\protolab-3d-poland-ui
   .\test-design-request.ps1
   ```

3. **Résultat attendu**
   ```
   ✓ Authenticated successfully
   ✓ Design request submitted successfully
   ✓ Retrieved design requests successfully
   Total: X request(s)
   ```

### Option 3: Insérer des données de test en base

1. **Ouvrir Supabase SQL Editor**
   - Aller sur votre projet Supabase
   - Cliquer sur "SQL Editor"

2. **Exécuter le script SQL**
   - Copier le contenu de [SQL/test-design-requests-data.sql](../SQL/test-design-requests-data.sql)
   - Coller dans l'éditeur
   - Cliquer sur "Run"

3. **Vérifier les résultats**
   - Vous devriez voir 4 nouvelles lignes insérées
   - Le résumé affiche le nombre par statut

4. **Voir dans l'interface admin**
   - Se connecter en tant qu'admin
   - Aller sur /admin/design-requests
   - Les 4 demandes de test devraient être visibles

## 📋 Données de test disponibles

### Test 1: Mechanical Part
```json
{
  "name": "Custom Mechanical Part",
  "description": "I need a custom gear mechanism for my robotics project...",
  "status": "pending",
  "price": null
}
```

### Test 2: Decorative Vase
```json
{
  "name": "Decorative Vase Design",
  "description": "I want a decorative vase with geometric patterns...",
  "status": "in_review",
  "price": 150.00
}
```

### Test 3: Phone Stand
```json
{
  "name": "Functional Phone Stand",
  "description": "Need a phone stand that can hold my phone...",
  "status": "in_progress",
  "price": 80.00
}
```

### Test 4: Gaming Accessory
```json
{
  "name": "Custom Gaming Accessory",
  "description": "Custom controller holder for my gaming setup...",
  "status": "completed",
  "price": 200.00
}
```

## 🔍 Vérifications à faire

### Côté Backend
```bash
# Logs du serveur devraient montrer:
[INFO] POST /api/design-requests - 201 Created
[INFO] Design request created for user: xxxxx
```

### Côté Base de données
```sql
-- Vérifier les design requests créés
SELECT 
  id,
  name,
  email,
  status,
  price,
  created_at
FROM public.design_requests
ORDER BY created_at DESC
LIMIT 10;
```

### Côté Frontend
1. ✅ Formulaire accepte seulement ideaDescription comme requis
2. ✅ Pas d'erreur si usageDetails est vide
3. ✅ Soumission réussie affiche toast de succès
4. ✅ Redirection vers /orders après 1.5 secondes
5. ✅ Dashboard affiche les nouvelles demandes

## 🐛 Dépannage

### Erreur: "Authentication required"
- Vérifier que vous êtes connecté
- Vérifier que le token est valide dans localStorage
- Réessayer après reconnexion

### Erreur: "Missing required field"
- Vérifier que ideaDescription est rempli
- Vérifier que le formulaire est bien soumis (pas de preventDefault manquant)

### Pas de données affichées
- Exécuter le script SQL de test
- Vérifier la table design_requests dans Supabase
- Vérifier les logs du serveur

### Erreur 500 côté serveur
- Vérifier que la table design_requests existe
- Vérifier les colonnes de la table
- Vérifier les logs détaillés du serveur

## 📊 Statuts possibles

| Statut | Description |
|--------|-------------|
| `pending` | Nouvelle demande, en attente de revue |
| `in_review` | En cours de revue par l'équipe |
| `in_progress` | Design en cours de création |
| `completed` | Design terminé et livré |
| `cancelled` | Demande annulée |

## 🎯 Checklist de test complet

- [ ] Formulaire se charge correctement
- [ ] Validation minimale fonctionne (ideaDescription seulement)
- [ ] Soumission avec données minimales réussit
- [ ] Soumission avec tous les champs réussit
- [ ] Upload de fichiers fonctionne
- [ ] Toast de succès s'affiche
- [ ] Redirection vers /orders fonctionne
- [ ] Données apparaissent dans le dashboard
- [ ] Données visibles dans l'interface admin
- [ ] Données correctes en base de données
- [ ] Script PowerShell fonctionne
- [ ] Script SQL insère les données de test

## ✨ Résumé des changements

**Avant:** Validation stricte, `usageDetails` obligatoire
**Après:** Validation minimale, seulement `ideaDescription` obligatoire

Cela permet de tester rapidement le flux de soumission sans remplir tous les champs !
