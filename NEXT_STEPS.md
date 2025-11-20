# 🚀 Prochaines Étapes : Séparation Frontend/Backend

Vous avez créé une structure **monorepo** avec workspaces npm. Voici comment finaliser la séparation.

## ✅ Déjà Fait

- [x] Dossiers `client/` et `server/` créés
- [x] Config Vite pour le client
- [x] Config TypeScript pour client + server
- [x] Package.json pour client + server
- [x] Package.json racine avec workspaces
- [x] Scripts npm pour lancer frontend + backend

## 📋 À Faire

### 1️⃣ Copier les fichiers frontend vers `client/src/`

Les fichiers suivants du dossier `src/` original doivent aller dans `client/src/` :
```
src/
├── App.tsx                    → client/src/
├── App.css                    → client/src/
├── main.tsx                   → client/src/
├── index.css                  → client/src/
├── pages/                     → client/src/pages/
├── components/                → client/src/components/
├── contexts/                  → client/src/contexts/
├── hooks/                     → client/src/hooks/
├── lib/                       → client/src/lib/
├── vite-env.d.ts             → client/src/
├── index.html                 → client/ (à la racine du client)
└── [autres fichiers UI]
```

### 2️⃣ Copier les fichiers backend vers `server/src/`

```
src/
├── server.ts                  → server/src/
├── express-app.ts            → server/src/
├── routes/                    → server/src/routes/
├── controllers/               → server/src/controllers/
├── models/                    → server/src/models/
├── services/                  → server/src/services/
├── middleware/                → server/src/middleware/
├── config/                    → server/src/config/
├── types/                     → server/src/types/
├── utils/                     → server/src/utils/
└── .env                       → server/ (à la racine du server)
```

### 3️⃣ Copier les fichiers de configuration

```
À la racine :
├── .gitignore                 ✓ (déjà là)
├── vite.config.ts             → client/ (déjà créé avec correction)
├── tsconfig.json              → client/ ET server/ (déjà créés)
├── tailwind.config.ts         → client/ (déjà créé)
├── postcss.config.js          → client/ (déjà créé)
└── index.html                 → client/
```

### 4️⃣ Installer les dépendances

```bash
npm run install-all

# Ou manuellement :
npm install              # Dépendances partagées (concurrently)
npm install --prefix client
npm install --prefix server
```

### 5️⃣ Tester le build

```bash
npm run build          # Build tout
npm run build:client   # Build frontend uniquement
npm run build:server   # Build backend uniquement
```

### 6️⃣ Lancer en développement

**Lancer les deux ensemble :**
```bash
npm run dev
```

**Ou séparément :**
```bash
# Terminal 1
npm run dev:client

# Terminal 2
npm run dev:server
```

## 📝 Commandes Rapides

```bash
# Installation
npm run install-all

# Développement
npm run dev                # Frontend + Backend
npm run dev:client         # Frontend uniquement
npm run dev:server         # Backend uniquement

# Build
npm run build              # Build tout
npm run build:client       # Build frontend
npm run build:server       # Build backend

# Production
npm start                  # Lancer le backend compilé
```

## 🎯 Résultat Final

Après ces étapes, vous aurez :

```
protolab-3d-poland-ui/
├── client/                # Frontend React (port 8080)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── server/                # Backend Express (port 5000)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── server.ts
│   │   └── express-app.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── package.json           # Workspaces racine
```

## 🚨 Points Importants

1. **Proxy API** : Le frontend Vite proxifie `/api/*` → Backend
2. **CORS** : Backend doit accepter `http://localhost:8080`
3. **Variables d'env** : Backend a `.env`, frontend non
4. **Build séparé** : Client = Vite bundle, Server = TypeScript compilé

## 💡 Aide

Si vous avez besoin de copier les fichiers automatiquement, je peux créer des scripts pour vous aider. Dites-moi !

---

**À bientôt ! 🎉**
