#!/bin/bash
# Installation et démarrage rapide du projet ProtoLab

set -e

echo "🚀 ProtoLab 3D Printing - Installation Rapide"
echo "=============================================="
echo ""

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

echo "📦 Étape 1 : Installation des dépendances racine..."
npm install

echo "📦 Étape 2 : Installation des dépendances client..."
npm install --prefix client

echo "📦 Étape 3 : Installation des dépendances server..."
npm install --prefix server

echo ""
echo "✅ Installation complète !"
echo ""
echo "🚀 Pour démarrer le développement :"
echo ""
echo "   npm run dev"
echo ""
echo "   Ou individuellement :"
echo "   - Frontend : npm run dev:client (port 8080)"
echo "   - Backend  : npm run dev:server (port 5000)"
echo ""
echo "📚 Documentation :"
echo "   - SETUP.md          : Structure complète"
echo "   - NEXT_STEPS.md     : Prochaines étapes"
echo "   - SUMMARY.md        : Résumé des corrections"
echo "   - PROJECT_STRUCTURE.md : Vue d'ensemble"
echo ""
echo "🎉 Ready to rock! 🚀"
