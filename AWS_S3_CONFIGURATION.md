# Configuration AWS S3 pour les fichiers 3D

## Vue d'ensemble

Le système utilise maintenant **Amazon S3** pour stocker les fichiers 3D envoyés par l'admin aux utilisateurs dans la section "Design Assistance". Cela offre :

✅ **Meilleure accessibilité** - Les utilisateurs peuvent voir les modèles 3D de n'importe où  
✅ **Sécurité** - URLs signées temporaires avec expiration automatique  
✅ **Performance** - Chargement plus rapide via CDN AWS  
✅ **Scalabilité** - Pas de limite de stockage local  

---

## Configuration AWS S3

### 1. Créer un bucket S3

1. Connectez-vous à la console AWS
2. Allez dans **S3** > **Create bucket**
3. Nom du bucket : `protolab-3d-files` (ou autre nom unique)
4. Région : `us-east-1` (ou votre région préférée)
5. **Block Public Access** : Activé (pour sécurité)
6. **Versioning** : Optionnel
7. Créez le bucket

### 2. Créer un utilisateur IAM

1. Allez dans **IAM** > **Users** > **Create user**
2. Nom : `protolab-s3-user`
3. Attachez la politique suivante :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::protolab-3d-files/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::protolab-3d-files"
    }
  ]
}
```

4. Créez des **Access Keys** pour cet utilisateur
5. Copiez `Access Key ID` et `Secret Access Key`

### 3. Configurer les variables d'environnement

Modifiez le fichier `server/.env` :

```env
# AWS S3 Configuration for 3D Files
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=VOTRE_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=VOTRE_SECRET_ACCESS_KEY
S3_BUCKET_NAME=protolab-3d-files
```

⚠️ **Important** : Remplacez les valeurs par vos vraies clés AWS

---

## Fonctionnement

### Upload de fichier 3D par l'admin

1. L'admin envoie un fichier 3D (.stl, .obj, .gltf, etc.) via le chat
2. Le serveur détecte automatiquement que c'est un fichier 3D
3. Le fichier est uploadé sur S3 au lieu du stockage local
4. L'URL stockée dans la base de données : `s3://3d-designs/timestamp-uuid-fichier.stl`

### Visualisation par l'utilisateur

1. L'utilisateur charge la page Design Assistance
2. Le frontend détecte les URLs avec préfixe `s3://`
3. Une requête est envoyée à `/api/files/signed-url` pour obtenir une URL temporaire
4. Le serveur génère une URL signée valide 7 jours
5. Le ModelViewer utilise cette URL pour afficher le modèle 3D

---

## Endpoints API

### GET `/api/files/signed-url`

Génère une URL signée pour accéder à un fichier S3.

**Query Parameters:**
- `fileUrl` (string) - L'URL du fichier (format `s3://...`)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "signedUrl": "https://protolab-3d-files.s3.amazonaws.com/3d-designs/...?X-Amz-Signature=..."
}
```

**Durée de validité:**
- URLs fichiers 3D : 7 jours
- URLs fichiers normaux : 1 heure

---

## Structure des dossiers S3

```
protolab-3d-files/
├── 3d-designs/          # Fichiers 3D envoyés par l'admin
│   ├── 1709411234567-uuid-model.stl
│   ├── 1709411235678-uuid-design.obj
│   └── ...
└── uploads/             # Autres fichiers (images, docs)
    ├── 1709411236789-uuid-reference.jpg
    └── ...
```

---

## Sécurité

✅ **URLs signées temporaires** - Les URLs expirent automatiquement  
✅ **Pas d'accès public** - Seuls les utilisateurs authentifiés peuvent demander des URLs  
✅ **Permissions limitées** - L'utilisateur IAM a uniquement les permissions nécessaires  
✅ **HTTPS obligatoire** - Toutes les communications sont chiffrées  

---

## Fallback

Si l'upload S3 échoue (AWS inaccessible, credentials invalides), le système :

1. Log l'erreur dans les logs serveur
2. Utilise le stockage local comme fallback
3. L'application continue de fonctionner normalement

---

## Migration des fichiers existants

Les fichiers locaux existants restent accessibles. Le système détecte automatiquement :
- URLs S3 → Génère une URL signée
- URLs locales (`/uploads/...`) → Sert depuis le serveur local

---

## Tests

### Test 1: Upload fichier 3D

1. Connectez-vous comme admin
2. Allez dans `/admin/orders/design-assistance`
3. Sélectionnez une conversation
4. Uploadez un fichier `.stl` ou `.obj`
5. Vérifiez les logs serveur : `✅ Uploaded 3D file to S3`

### Test 2: Visualisation utilisateur

1. Connectez-vous comme utilisateur
2. Allez dans `/design-assistance`
3. Sélectionnez la demande correspondante
4. Le modèle 3D devrait s'afficher avec `☁️ File hosted on AWS S3`

---

## Dépannage

### Erreur: "Failed to upload to S3"

**Causes possibles:**
- Credentials AWS invalides → Vérifiez `S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY`
- Bucket inexistant → Vérifiez `S3_BUCKET_NAME`
- Permissions IAM insuffisantes → Vérifiez la politique IAM
- Région incorrecte → Vérifiez `S3_REGION`

**Solution:** Vérifiez les logs serveur pour plus de détails

### Erreur: "Failed to load file URL"

**Causes possibles:**
- Token expiré → Reconnectez-vous
- Fichier supprimé du S3
- URL signée expirée (> 7 jours)

**Solution:** Rechargez la page ou contactez l'admin

---

## Coûts AWS

**Estimation mensuelle** (basée sur usage moyen) :

- Stockage : $0.023 par GB/mois
- Requêtes GET : $0.0004 par 1000 requêtes
- Transfert de données : $0.09 par GB

**Exemple:** 50 fichiers 3D (20MB chacun) = 1GB = ~$0.03/mois

💡 **Conseil:** Activez S3 Lifecycle pour supprimer automatiquement les fichiers > 90 jours

---

## Support

Pour toute question ou problème :
1. Vérifiez les logs serveur
2. Consultez la documentation AWS S3
3. Contactez l'équipe de développement
