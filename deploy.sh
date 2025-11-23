#!/bin/bash

# 🚀 Script de Déploiement Rapide Vercel

echo "🎨 ProtoLab - Déploiement Vercel"
echo "================================"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null
then
    echo "⚠️  Vercel CLI n'est pas installé"
    echo "📦 Installation en cours..."
    npm install -g vercel
fi

# Nettoyer les anciens builds
echo "🧹 Nettoyage des anciens builds..."
rm -rf client/dist

# Build local pour test
echo "🔨 Build du projet..."
cd client
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi!"
    cd ..
    
    # Déploiement
    echo ""
    echo "🚀 Déploiement sur Vercel..."
    echo ""
    
    # Demander le type de déploiement
    read -p "Déployer en production ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        vercel --prod
    else
        vercel
    fi
    
    echo ""
    echo "✨ Déploiement terminé!"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
