#!/bin/bash

# Firebase deployment script for PBL Canvas (with API routes)
set -e

echo "🔥 Starting Firebase deployment with API routes..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Installing..."
    npm i -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Build the Next.js app
echo "🔨 Building Next.js app..."
cd apps/web
npm run build
cd ../..

# Install functions dependencies
echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

# Deploy Firestore rules and indexes
echo "📊 Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Functions (API routes)
echo "🚀 Deploying Firebase Functions (API routes)..."
firebase deploy --only functions

# Deploy to Firebase Hosting  
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Firebase deployment completed successfully!"
echo ""
echo "✨ Your full-stack app is now deployed:"
echo "   🎨 Frontend: Firebase Hosting"
echo "   🔗 API Routes: Firebase Cloud Functions" 
echo "   🗄️  Database: Firebase Firestore"
echo ""
echo "🔗 Your app should be available at: https://your-project-id.web.app"
echo ""
echo "Next steps:"
echo "1. Deploy agents to LangGraph Cloud: cd apps/agents && langgraph deploy"
echo "2. Update LANGGRAPH_API_URL in your environment variables" 