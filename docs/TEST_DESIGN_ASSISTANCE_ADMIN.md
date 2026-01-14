# Test Design Assistance - Guide Rapide

## 1. Créer la table design_requests (si nécessaire)

Dans Supabase SQL Editor, exécute :
```sql
-- Voir: SQL/verify-design-requests-table.sql
```

## 2. Insérer des données de test

Dans Supabase SQL Editor, exécute :
```sql
-- Voir: SQL/insert-test-design-requests.sql
```

## 3. Vérifier la connexion

### Backend (Port 5001)
```bash
# Health check
curl http://localhost:5001/health

# Test endpoint admin (besoin d'un token valide)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/admin/design-requests
```

### Frontend (Port 8081)
1. Ouvre http://localhost:8081/admin/design-assistance
2. Connecte-toi en tant qu'admin
3. Tu devrais voir les design requests dans le kanban board

## 4. Structure de la page Admin

La page affiche un **Kanban Board** avec 5 colonnes :
- 🟡 **Pending** - Nouvelles demandes
- 🟠 **In Review** - En cours de révision  
- 🔵 **In Progress** - Travail en cours
- 🟢 **Completed** - Terminées
- 🔴 **Cancelled** - Annulées

## 5. Données affichées

Pour chaque design request :
- ✅ `project_name` - Nom du projet
- ✅ `idea_description` - Description
- ✅ `design_status` - Statut (pending, in_review, in_progress, completed, cancelled)
- ✅ `estimated_price` - Prix estimé
- ✅ `usage_type` - Type d'usage (mechanical, decorative, functional, prototype, other)
- ✅ `desired_material` - Matériel désiré
- ✅ `approximate_dimensions` - Dimensions approximatives
- ✅ `users.name` - Nom du client (first_name + last_name)
- ✅ `users.email` - Email du client

## 6. API Endpoints utilisés

### Admin Routes (nécessite authentification admin)
```
GET    /api/admin/design-requests          - Liste toutes les demandes
GET    /api/admin/design-requests/:id      - Détails d'une demande
PATCH  /api/admin/design-requests/:id/status - Mettre à jour le statut
```

### User Routes (nécessite authentification user)
```
POST   /api/design-requests                - Créer une nouvelle demande
GET    /api/design-requests/my            - Mes demandes
GET    /api/design-requests/:id           - Détails d'une demande
```

## 7. Troubleshooting

### Erreur "Failed to fetch design assistance orders"
- ✅ Vérifie que le serveur tourne sur port 5001
- ✅ Vérifie que tu es connecté en tant qu'admin
- ✅ Vérifie la console browser (F12) pour voir les logs
- ✅ Vérifie que la table `design_requests` existe dans Supabase

### Aucune donnée affichée
- ✅ Exécute le script SQL de test (insert-test-design-requests.sql)
- ✅ Vérifie dans Supabase : `SELECT * FROM design_requests;`
- ✅ Vérifie que `deleted_at IS NULL` pour les données

### Erreur d'authentification
- ✅ Vérifie que le token est présent : `localStorage.getItem('accessToken')`
- ✅ Vérifie le rôle : `localStorage.getItem('userRole')` doit être "admin"
- ✅ Reconnecte-toi si le token a expiré

## 8. Test complet

1. **Soumission utilisateur**
   - Va sur http://localhost:8081/design-assistance
   - Remplis le formulaire avec une idée
   - Soumets
   - Tu devrais voir un message de succès

2. **Vérification admin**
   - Va sur http://localhost:8081/admin/design-assistance
   - La nouvelle demande devrait apparaître dans la colonne "Pending"
   - Clique sur l'icône 👁️ pour voir les détails
   - Change le statut avec le dropdown

3. **Vérification base de données**
   ```sql
   SELECT 
     project_name, 
     design_status, 
     estimated_price,
     created_at
   FROM design_requests
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## 9. Console Logs (Debug)

Ouvre la console browser (F12) pour voir :
```
Fetching design requests from: http://localhost:5001/api/admin/design-requests
Token: Present
Response status: 200
Design requests data: {designRequests: Array(5), count: 5}
```

Si tu vois des erreurs, copie le message pour debugging.
