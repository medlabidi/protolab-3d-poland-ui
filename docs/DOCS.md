# 📚 Index de la Documentation ProtoLab

Bienvenue ! Voici où trouver les informations selon votre besoin.

---

## 🚀 Je veux démarrer rapidement

**→ Lisez : [`START_HERE.md`](START_HERE.md)**

- ✅ Vue d'ensemble 2 minutes
- ✅ Commandes pour démarrer
- ✅ Ports et URLs
- ✅ Stack technologique

```bash
npm run dev    # C'est tout !
```

---

## 📋 Je veux comprendre la structure

**→ Lisez : [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)**

- Arborescence complète des fichiers
- Statut de chaque fichier (créé, modifié, etc.)
- Ports et variables d'env
- État de compilation

---

## 📖 Je veux des instructions détaillées

**→ Lisez : [`SETUP.md`](SETUP.md)**

- Structure du monorepo
- Démarrage complet (frontend + backend)
- Scripts npm disponibles
- Stack technique détaillé
- Variables d'environnement

---

## ⏭️ Je veux finaliser la migration

**→ Lisez : [`NEXT_STEPS.md`](NEXT_STEPS.md)**

- Prochaines étapes après la restructuration
- Quels fichiers copier où
- Comment finaliser la séparation frontend/backend

---

## ✅ Qu'est-ce qui a changé ?

**→ Lisez : [`SUMMARY.md`](SUMMARY.md)**

- 130 erreurs TypeScript → 0 erreurs
- Corrections appliquées
- Fichiers créés et modifiés
- Status de compilation

---

## 🎯 Commandes Rapides

### Installation
```bash
# Automatique (Windows)
install.bat

# Automatique (macOS/Linux)
bash install.sh

# Manuel
npm run install-all
```

### Développement
```bash
npm run dev             # Frontend + Backend
npm run dev:client     # Frontend uniquement
npm run dev:server     # Backend uniquement
```

### Build
```bash
npm run build          # Build tout
npm run build:client   # Build frontend
npm run build:server   # Build backend
```

### Production
```bash
npm start              # Lancer le backend compilé
```

---

## 📂 Fichiers de Documentation

| Fichier | Contenu | Pour Qui |
|---------|---------|----------|
| `START_HERE.md` | Vue rapide + commandes | Tout le monde |
| `PROJECT_STRUCTURE.md` | Arborescence complète | Architectes |
| `SETUP.md` | Instructions détaillées | Développeurs |
| `NEXT_STEPS.md` | Migration finale | Administrateurs |
| `SUMMARY.md` | Résumé corrections | Tech leads |
| `README.md` | Vue générale | Débutants |
| `package.json` | Workspaces config | DevOps |
| `install.bat` / `.sh` | Installation auto | Tout le monde |

---

## 🎯 Cas d'Usage

### Je suis nouveau sur le projet
1. Lisez `START_HERE.md` (2 min)
2. Exécutez `npm run dev` (1 min)
3. Explorez le code dans VS Code

### Je dois déployer
1. Lisez `SETUP.md` section "Production"
2. Exécutez `npm run build`
3. Configurez les variables d'env (`.env`)
4. Déployez `server/dist/`

### Je dois ajouter une feature frontend
1. Exécutez `npm run dev:client` (port 8080)
2. Créez un composant dans `src/components/`
3. Hot reload automatique ✨

### Je dois ajouter une API backend
1. Exécutez `npm run dev:server` (port 5000)
2. Créez une route dans `src/routes/`
3. Auto-restart avec nodemon ✨

### Je dois migrer les fichiers vers client/server
1. Lisez `NEXT_STEPS.md`
2. Copiez les fichiers frontend vers `client/src/`
3. Copiez les fichiers backend vers `server/src/`

---

## 🔗 Liens Rapides

### Frontend
- Vite : https://vitejs.dev
- React : https://react.dev
- TailwindCSS : https://tailwindcss.com
- Radix UI : https://www.radix-ui.com

### Backend
- Express : https://expressjs.com
- Mongoose : https://mongoosejs.com
- JWT : https://jwt.io
- Pino : https://getpino.io

### Tools
- TypeScript : https://www.typescriptlang.org
- npm workspaces : https://docs.npmjs.com/cli/v8/using-npm/workspaces
- Node.js : https://nodejs.org

---

## ❓ FAQ

**Q: Comment lancer frontend et backend ensemble ?**
```bash
npm run dev
```

**Q: Où sont les fichiers backend ?**
```
src/routes/
src/controllers/
src/models/
src/server.ts
```

**Q: Comment déployer en production ?**
1. `npm run build` - Compile tout
2. `.env` - Configurez les variables
3. Hébergement Node.js - Déployez `server/`

**Q: Puis-je modifier les fichiers en live ?**
Oui ! Frontend a hot reload, backend a auto-restart.

**Q: Quelle est la structure du monorepo ?**
Voir `PROJECT_STRUCTURE.md`

**Q: Comment ajouter une dépendance ?**
```bash
npm install package --prefix client   # Frontend
npm install package --prefix server   # Backend
npm install package                   # Partagée
```

---

## 🆘 Besoin d'Aide ?

1. **Installation** → `START_HERE.md`
2. **Structure** → `PROJECT_STRUCTURE.md`
3. **Détails** → `SETUP.md`
4. **Migration** → `NEXT_STEPS.md`
5. **Corrections** → `SUMMARY.md`

---

## ✨ Prêt ?

```bash
npm run install-all
npm run dev
```

Accédez à http://localhost:8080

**Bon développement ! 🚀**

---

**ProtoLab 3D Printing Service**  
Fullstack JavaScript/TypeScript  
Frontend React + Backend Express
