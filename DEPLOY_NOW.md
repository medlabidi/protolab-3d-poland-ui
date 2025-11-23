# 🚀 Déploiement Rapide sur Vercel

## ✅ Build Réussi !

Votre projet est maintenant prêt pour le déploiement sur Vercel.

## 📝 Étapes de Déploiement

### Option 1: Via Vercel CLI (Recommandé - Plus Rapide)

```bash
# 1. Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# 2. Lancer le déploiement depuis la racine du projet
vercel

# 3. Suivre les instructions interactives
# - Login/Signup sur Vercel
# - Confirmer le nom du projet
# - Confirmer les paramètres

# 4. Pour déployer en production
vercel --prod
```

### Option 2: Via Dashboard Vercel (Interface Graphique)

1. **Pousser sur GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connecter à Vercel**
   - Aller sur https://vercel.com/dashboard
   - Cliquer "Add New..." → "Project"
   - Importer votre repo GitHub `protolab-3d-poland-ui`

3. **Configuration Automatique**
   Vercel détectera automatiquement votre configuration !
   - Framework: Vite
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/dist`

4. **Déployer**
   - Cliquer "Deploy"
   - Attendre 2-3 minutes

## 🌍 Accès après Déploiement

Vous recevrez une URL comme:
- `https://protolab-3d-poland-ui.vercel.app`
- `https://protolab-3d-poland-ui-git-main-[username].vercel.app`

## 📋 Configuration Vercel (vercel.json)

✅ Déjà configuré dans votre projet !

## 🔧 Variables d'Environnement (Si nécessaire)

Si vous avez une API backend séparée:

1. Dans Vercel Dashboard → Settings → Environment Variables
2. Ajouter:
   ```
   VITE_API_URL=https://votre-api.com/api
   ```

## 🎯 Test Local du Build

```bash
cd client
npm run build
npm run preview
```

Visitez http://localhost:4173 pour tester

## 🚦 Commandes Utiles

```bash
# Déploiement preview (branche de test)
vercel

# Déploiement production
vercel --prod

# Voir les logs
vercel logs

# Lister les déploiements
vercel ls

# Ouvrir le projet dans le browser
vercel open
```

## 💡 Redéploiement Automatique

Après configuration initiale:
```bash
git push origin main  # Vercel redéploie automatiquement !
```

## ✨ URL du Projet

Après déploiement, votre site sera accessible via:
- **Production:** `https://protolab-3d-poland-ui.vercel.app`
- Vous pouvez ensuite ajouter un domaine personnalisé dans les settings

---

**Prêt ? Lancez:**
```bash
vercel --prod
```

🎉 Votre site ProtoLab sera en ligne en quelques minutes !
