#!/bin/bash

# Deploy script for PBL Canvas
set -e

echo "🚀 Starting deployment process..."

# Check if required CLIs are installed
check_cli() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

# Check required tools
echo "📋 Checking prerequisites..."
check_cli "node"
check_cli "yarn"
check_cli "vercel"
check_cli "firebase"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Build the application locally first
echo "🔨 Building application..."
yarn install
yarn build

# Deploy LangGraph agents
echo "🤖 Deploying LangGraph agents..."
cd apps/agents
if command -v langgraph &> /dev/null; then
    langgraph deploy
    echo "✅ LangGraph agents deployed successfully"
else
    echo "⚠️  LangGraph CLI not found. Please deploy agents manually:"
    echo "   pip install langgraph-cli"
    echo "   cd apps/agents && langgraph deploy"
fi
cd ../..

# Deploy Firebase rules and indexes
echo "🔥 Deploying Firebase configuration..."
firebase deploy --only firestore:rules,firestore:indexes
echo "✅ Firebase configuration deployed"

# Deploy to Vercel
echo "▲ Deploying to Vercel..."
vercel --prod
echo "✅ Application deployed to Vercel"

echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update NEXTAUTH_URL in Vercel environment variables"
echo "2. Update LANGGRAPH_API_URL with your LangGraph deployment URL"
echo "3. Configure OAuth redirect URLs in Google Cloud Console"
echo "4. Test your deployment at your Vercel URL" 