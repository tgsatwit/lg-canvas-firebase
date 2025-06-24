#!/bin/bash

# LangGraph agents deployment script
set -e

echo "🤖 Starting LangGraph agents deployment..."

# Check if LangGraph CLI is installed
if ! command -v langgraph &> /dev/null; then
    echo "❌ LangGraph CLI is not installed. Installing..."
    pip install langgraph-cli
fi

# Check if we're in the right directory
if [ ! -f "langgraph.json" ]; then
    echo "❌ langgraph.json not found. Please run this from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one with your API keys."
    exit 1
fi

# Build the agents
echo "🔨 Building agents..."
cd apps/agents
npm run build
cd ../..

# Deploy to LangGraph Cloud
echo "🚀 Deploying agents to LangGraph Cloud..."
langgraph deploy

echo "✅ LangGraph agents deployed successfully!"
echo ""
echo "📝 Important next steps:"
echo "1. Note your LangGraph deployment URL"
echo "2. Update LANGGRAPH_API_URL in your environment variables"
echo "3. Update the same variable in your Firebase Functions environment"
echo ""
echo "🔧 To set Firebase Functions environment variables:"
echo "   firebase functions:config:set langgraph.api_url=https://your-deployment.langchain.app"
echo "   firebase functions:config:set langgraph.api_key=your-api-key" 