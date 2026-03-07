# Implémentation S3 pour Fichiers 3D - Design Assistance

## ✅ Travail Accompli

### 1. Configuration Backend

#### Fichiers modifiés/créés :
- ✅ `server/.env` - Ajout des variables AWS S3
- ✅ `server/src/services/s3.service.ts` - Ajout méthodes upload 3D et signed URLs
- ✅ `server/src/controllers/conversations.controller.ts` - Détection auto et upload S3 fichiers 3D
- ✅ `server/src/routes/files.routes.ts` - Route pour génération URLs signées
- ✅ `server/src/controllers/files.controller.ts` - Contrôleur pour fichiers S3
- ✅ `server/src/express-app.ts` - Enregistrement route `/api/files`

### 2. Configuration Frontend

#### Fichiers modifiés/créés :
- ✅ `client/src/pages/DesignAssistance.tsx` - Support URLs S3 et affichage sécurisé
- ✅ `client/src/components/S3FileViewer.tsx` - Composant viewer avec chargement async

### 3. Documentation

- ✅ `AWS_S3_CONFIGURATION.md` - Guide complet configuration AWS S3

---

## 📋 Comment ça fonctionne

### Flux de travail Admin → User

```mermaid
sequenceDiagram
    Admin->>+Backend: Upload fichier 3D (chat)
    Backend->>Backend: Détection extension .stl/.obj
    Backend->>+S3: Upload fichier
    S3-->>-Backend: Retourne clé S3
    Backend->>Database: Stocke "s3://3d-designs/file.stl"
    Backend-->>-Admin: Confirmation

    User->>+Backend: Charge conversations
    Backend-->>-User: Messages avec URLs "s3://..."
    User->>+Backend: GET /api/files/signed-url
    Backend->>+S3: Génère URL signée (7 jours)
    S3-->>-Backend: URL temporaire
    Backend-->>-User: URL signée
    User->>ModelViewer: Charge modèle 3D
```

### Détection automatique

Le système détecte automatiquement si un fichier est 3D basé sur l'extension :
- `.stl`, `.obj`, `.3mf`, `.step`, `.stp`, `.iges`, `.igs`, `.gltf`, `.glb`

**Si admin + fichier 3D** → Upload vers S3  
**Sinon** → Stockage local

---

## 🔧 Configuration Requise

### Variables d'environnement

Ajoutez dans `server/.env` :

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET_NAME=protolab-3d-files
```

### Bucket S3 requis

1. Créer bucket `protolab-3d-files` dans AWS
2. Activer **Block Public Access** (sécurité)
3. Créer utilisateur IAM avec permissions :
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`

Voir [AWS_S3_CONFIGURATION.md](AWS_S3_CONFIGURATION.md) pour guide détaillé.

---

## 📦 Ce qui est stocké où

| Type de fichier | Stockage | Format URL |
|----------------|----------|------------|
| Fichiers 3D (admin) | AWS S3 | `s3://3d-designs/...` |
| Images, PDFs | Local | `/uploads/...` |
| Fichiers user | Local | `/uploads/...` |

---

## 🧪 Tests

### Test 1: Upload admin

```bash
# 1. Connectez-vous comme admin
# 2. Allez dans /admin/orders/design-assistance
# 3. Sélectionnez conversation
# 4. Uploadez fichier .stl
# 5. Vérifiez logs serveur :
#    ✅ "Uploaded 3D file to S3"
```

### Test 2: Vue utilisateur

```bash
# 1. Connectez-vous comme user
# 2. Allez dans /design-assistance
# 3. Sélectionnez demande
# 4. Le modèle 3D devrait afficher avec loader
# 5. Badge "☁️ File hosted on AWS S3" visible
```

---

## 🔒 Sécurité

✅ **URLs signées temporaires** - Expiration automatique après 7 jours  
✅ **Authentification requise** - Seuls users connectés peuvent accéder  
✅ **Pas d'accès public S3** - Block Public Access activé  
✅ **Permissions IAM minimales** - Utilisateur limité au bucket  

---

## ⚡ Performance

**Avant (stockage local):**
- ❌ Fichiers limités par espace disque serveur
- ❌ Bande passante serveur consommée
- ❌ Pas de CDN

**Après (AWS S3):**
- ✅ Stockage illimité scalable
- ✅ CDN CloudFront (optionnel)
- ✅ Accès rapide mondial
- ✅ Backup automatique

---

## 🚨 Fallback

Si AWS S3 échoue (credentials invalides, réseau down) :
1. Le système log l'erreur
2. Utilise le stockage local automatiquement
3. L'application continue de fonctionner

**Log exemple:**
```
Failed to upload to S3, using local storage: { error: 'Invalid credentials' }
```

---

## 📊 Monitoring

### Vérifier uploads S3

1. Console AWS S3
2. Bucket `protolab-3d-files`
3. Dossier `3d-designs/`
4. Vérifiez taille/date fichiers

### Vérifier logs serveur

```bash
# Rechercher uploads S3
grep "Uploaded 3D file to S3" logs/app.log

# Rechercher erreurs S3
grep "Failed to upload to S3" logs/app.log
```

---

## 🛠️ Maintenance

### Nettoyer vieux fichiers S3

Option 1: **Lifecycle Policy** (automatique)
```json
{
  "Rules": [{
    "Id": "DeleteOld3DFiles",
    "Status": "Enabled",
    "Expiration": {
      "Days": 90
    },
    "Filter": {
      "Prefix": "3d-designs/"
    }
  }]
}
```

Option 2: **Script manuel**
```javascript
// delete-old-files.js
const { s3Service } = require('./server/src/services/s3.service');
// Implémenter logique suppression fichiers > 90 jours
```

---

## 💰 Coût estimé

**Scénario:** 100 fichiers 3D/mois, 20MB chacun

- Stockage: 2GB × $0.023 = **$0.05/mois**
- Requêtes: 1000 × $0.0004 = **$0.40/mois**
- Transfert: 2GB × $0.09 = **$0.18/mois**

**Total: ~$0.63/mois**

---

## 📝 Prochaines étapes (Optionnel)

- [ ] Activer CloudFront CDN pour performance
- [ ] Implémenter compression fichiers avant upload
- [ ] Ajouter watermark sur previews pour sécurité
- [ ] Créer dashboard admin pour gérer fichiers S3
- [ ] Implémenter versioning fichiers 3D
- [ ] Ajouter support formats additionnels (.fbx, .dae)

---

## 🆘 Support

**Problèmes courants:**

| Symptôme | Cause | Solution |
|----------|-------|----------|
| "Failed to upload to S3" | Credentials invalides | Vérifier `.env` |
| Modèle 3D ne charge pas | URL expirée | Recharger page |
| "Access Denied" | Permissions IAM | Vérifier politique IAM |
| Fichier upload lent | Fichier trop gros | Compresser avant upload |

---

## ✅ Checklist déploiement

Avant déployer en production :

- [ ] Créer bucket S3 production
- [ ] Créer utilisateur IAM production 
- [ ] Configurer variables d'environnement production
- [ ] Tester upload/download en staging
- [ ] Activer lifecycle policy
- [ ] Config CloudFront (optionnel)
- [ ] Mettre à jour documentation équipe
- [ ] Former admins sur nouveau système

---

**Date:** 2026-03-02  
**Version:** 1.0.0  
**Auteur:** GitHub Copilot
