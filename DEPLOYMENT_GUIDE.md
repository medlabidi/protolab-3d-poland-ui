# 🚀 Guide de Déploiement Vercel - ProtoLab

## 📋 Prérequis

1. Compte Vercel (gratuit) : https://vercel.com
2. Git installé localement
3. Le code poussé sur GitHub/GitLab/Bitbucket

## 🔧 Préparation

### 1. Vérifier la configuration locale

Assurez-vous que votre build fonctionne localement :

```bash
cd client
npm install
npm run build
```

### 2. Variables d'environnement

Créez les variables d'environnement suivantes dans Vercel :

**Frontend (optionnel si vous utilisez un backend) :**
- `VITE_API_URL` : URL de votre API backend (si hébergée séparément)

**Si vous déployez le backend aussi :**
- `NODE_ENV=production`
- `JWT_ACCESS_SECRET` : Votre secret JWT
- `JWT_REFRESH_SECRET` : Votre secret refresh token
- `DATABASE_URL` : URL de votre base de données MongoDB/PostgreSQL
- `CORS_ORIGIN` : URL de votre frontend Vercel

## 📦 Méthode 1 : Déploiement via Vercel Dashboard (Recommandé)

### Étape 1 : Pousser sur GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Étape 2 : Connecter à Vercel

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre repository GitHub
4. Sélectionnez le repository `protolab-3d-poland-ui`

### Étape 3 : Configuration du projet

**Framework Preset:** Vite
**Root Directory:** `./` (racine)
**Build Command:** `npm run vercel-build`
**Output Directory:** `client/dist`

### Étape 4 : Variables d'environnement

Dans l'onglet "Environment Variables", ajoutez :

```
VITE_API_URL=https://your-api-url.com/api
NODE_ENV=production
```

### Étape 5 : Déployer

Cliquez sur **"Deploy"** et attendez que le build se termine (~2-3 minutes).

## 🖥️ Méthode 2 : Déploiement via CLI Vercel

### Installation

```bash
npm install -g vercel
```

### Connexion

```bash
vercel login
```

### Déploiement

```bash
# Depuis la racine du projet
vercel

# Pour la production
vercel --prod
```

Suivez les instructions interactives.

## 🔍 Vérifications Post-Déploiement

### 1. Tester le déploiement

Visitez l'URL fournie par Vercel (ex: `https://protolab-3d-poland-ui.vercel.app`)

### 2. Vérifier les routes

- `/` - Page d'accueil ✅
- `/about` - Page About Us ✅
- `/login` - Page de connexion ✅
- `/new-print` - Nouvelle impression ✅
- `/dashboard` - Tableau de bord ✅

### 3. Vérifier les fonctionnalités

- [ ] Navigation entre les pages
- [ ] Changement de langue (EN/PL)
- [ ] Formulaire de contact
- [ ] Carte Google Maps
- [ ] Animations et effets visuels
- [ ] Design responsive (mobile/tablet/desktop)

## 🔄 Redéploiement Automatique

Une fois configuré, Vercel redéploiera automatiquement à chaque push sur la branche principale :

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 🐛 Résolution des Problèmes

### Erreur : "Build failed"

**Solution :**
```bash
# Vérifier localement
cd client
npm install
npm run build

# Si ça fonctionne, vérifier les logs Vercel
```

### Erreur : "Page 404 on refresh"

La configuration dans `vercel.json` devrait résoudre ce problème. Vérifiez que le fichier contient :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/client/dist/$1"
    }
  ]
}
```

### Erreur : "Environment variables not working"

1. Allez dans **Project Settings** → **Environment Variables**
2. Ajoutez les variables manquantes
3. Redéployez le projet

### Routes API ne fonctionnent pas

Si vous avez un backend séparé :
1. Déployez le backend sur un service comme Render, Railway ou Vercel Serverless
2. Mettez à jour `VITE_API_URL` dans les variables d'environnement

## 📊 Monitoring

### Logs en temps réel

```bash
vercel logs [deployment-url]
```

### Analytics Vercel

- Allez dans **Project** → **Analytics**
- Consultez les performances et les visiteurs

## 🌐 Domaine Personnalisé

### Ajouter un domaine

1. **Project Settings** → **Domains**
2. Cliquez sur **"Add"**
3. Entrez votre domaine (ex: `protolab.pl`)
4. Suivez les instructions DNS

### Configuration DNS

Ajoutez ces enregistrements chez votre registrar :

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

## 🔒 Sécurité

### En Production

1. **Changez tous les secrets** dans `.env.production`
2. **Activez HTTPS** (automatique avec Vercel)
3. **Configurez CORS** correctement
4. **Limitez les rate limits**

## 📱 URLs de Déploiement

Après déploiement, vous aurez :

- **Production:** `https://protolab-3d-poland-ui.vercel.app`
- **Preview (par branche):** `https://protolab-3d-poland-ui-git-[branch].vercel.app`
- **Domaine personnalisé:** `https://votre-domaine.com`

## ✅ Checklist Finale

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées
- [ ] Build réussi localement
- [ ] Projet connecté à Vercel
- [ ] Premier déploiement réussi
- [ ] Routes testées
- [ ] Design responsive vérifié
- [ ] Domaine personnalisé configuré (optionnel)

## 🆘 Support

- Documentation Vercel : https://vercel.com/docs
- Community Discord : https://vercel.com/discord
- GitHub Issues : Créez une issue sur votre repo

---

**Prêt à déployer ?** Lancez la commande :

```bash
vercel --prod
```

Ou suivez la méthode via Dashboard pour un déploiement guidé ! 🎉
