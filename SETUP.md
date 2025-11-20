# ProtoLab 3D Printing Service Platform

Un projet **fullstack** pour une plateforme de service d'impression 3D avec frontend React et backend Express.

## 📁 Structure du Projet

```
protolab-3d-poland-ui/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── pages/            # Pages React
│   │   ├── components/       # Composants réutilisables
│   │   ├── contexts/         # Context API
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Services API
│   │   ├── App.tsx           # Composant principal
│   │   └── main.tsx          # Point d'entrée
│   ├── vite.config.ts        # Config Vite
│   ├── tsconfig.json         # Config TypeScript
│   └── package.json
│
├── server/                    # Backend Express + Node.js
│   ├── src/
│   │   ├── routes/           # Routes API
│   │   ├── controllers/      # Logique métier
│   │   ├── models/           # Modèles Mongoose
│   │   ├── services/         # Services métier
│   │   ├── middleware/       # Middleware Express
│   │   ├── config/           # Configurations
│   │   ├── types/            # Types TypeScript
│   │   ├── express-app.ts    # Configuration Express
│   │   └── server.ts         # Point d'entrée
│   ├── tsconfig.json         # Config TypeScript
│   └── package.json
│
├── package.json              # Package.json racine (workspaces)
└── README.md
```

## 🚀 Démarrage Rapide

### Installation des dépendances
```bash
npm run install-all
```

### Lancer en mode développement
**Lance automatiquement frontend + backend en parallèle :**
```bash
npm run dev
```

Ou lancer individuellement :
```bash
# Terminal 1 - Frontend (port 8080)
npm run dev:client

# Terminal 2 - Backend (port 5000)
npm run dev:server
```

### Build pour la production
```bash
npm run build
```

### Lancer le serveur en production
```bash
npm start
```

## 🎯 Ports

- **Frontend** : http://localhost:8080
- **Backend API** : http://localhost:5000
  - Health check : http://localhost:5000/health
  - Proxy API : http://localhost:8080/api/* → http://localhost:5000/api/*

## 📚 Scripts Disponibles

### À la racine
- `npm run dev` - Lancer frontend + backend ensemble
- `npm run dev:client` - Lancer frontend uniquement
- `npm run dev:server` - Lancer backend uniquement
- `npm run build` - Build client + server
- `npm run build:client` - Build frontend uniquement
- `npm run build:server` - Build backend uniquement
- `npm run start` - Lancer le serveur en production
- `npm run install-all` - Installer toutes les dépendances

### Dans `client/` (frontend)
- `npm run dev` - Démarrer Vite dev server
- `npm run build` - Build avec Vite
- `npm run preview` - Aperçu du build

### Dans `server/` (backend)
- `npm run dev` - Démarrer avec nodemon
- `npm run build` - Compiler TypeScript
- `npm run start` - Lancer le serveur compilé

## 🛠️ Stack Technique

### Frontend
- **React 19** - UI library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router 7** - Routing
- **React Query 5** - Data fetching
- **Radix UI** - Composants unstyled
- **Lucide Icons** - Icônes

### Backend
- **Express 4** - Web framework
- **TypeScript** - Type safety
- **MongoDB 8** - Base de données
- **Mongoose 8** - ODM
- **JWT** - Authentification
- **Pino** - Logging
- **AWS S3 SDK** - Stockage fichiers
- **Zod** - Validation

## 📝 Variables d'environnement

### Backend (`.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/protolab
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:8080
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=eu-west-1
S3_BUCKET_NAME=your-bucket
```

## ✅ Compilation TypeScript

Le projet compile sans erreurs :
```bash
npm run build       # Build tout (client + server)
npm run build:client   # Frontend TypeScript + Vite bundle
npm run build:server   # Backend TypeScript → JavaScript
```

## 🔄 Proxy API en Développement

Le frontend Vite proxifie automatiquement les requêtes `/api/*` vers le backend Express.

## 📦 Workspaces npm

Ce projet utilise les [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) pour gérer les dépendances de frontend et backend.

- Dépendances partagées : installez à la racine
- Dépendances frontend : `npm install package --prefix client`
- Dépendances backend : `npm install package --prefix server`

## 🎯 Architecture

### Frontend Flow
1. User accède http://localhost:8080
2. Vite sert l'app React
3. Requêtes `/api/*` proxifiées → Backend
4. Backend répond avec JSON

### Backend Flow
1. Express écoute sur port 5000
2. Routes Express définies dans `routes/`
3. Controllers gèrent la logique métier
4. Mongoose intéragit avec MongoDB
5. Response JSON retournée au frontend

## ✨ Prochaines étapes

1. Installer les dépendances : `npm run install-all`
2. Lancer le développement : `npm run dev`
3. Ouvrir le navigateur : http://localhost:8080
4. Voir les logs backend dans le terminal

---

**Happy coding! 🚀**
