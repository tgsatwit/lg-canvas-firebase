#!/bin/bash

# Quick deploy script for web app only
set -e

echo "▲ Deploying web app to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm i -g vercel
fi

# Build the application
echo "🔨 Building application..."
yarn build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Web app deployed successfully!" 