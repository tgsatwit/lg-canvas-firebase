# Deployment Guide for PBL Canvas

This application consists of multiple services that need to be deployed separately:

1. **Next.js Web Application** (Frontend + API Routes)
2. **LangGraph Agents** (AI Backend)
3. **Firebase Services** (Database)

## Prerequisites

- Node.js 20+
- Yarn package manager
- Vercel CLI (`npm i -g vercel`)
- LangGraph CLI (`pip install langgraph-cli`)
- Firebase CLI (`npm i -g firebase-tools`)

## Environment Variables

Copy `env.example` to `.env` and fill in all required values:

```bash
cp env.example .env
```

### Required API Keys:
- **OpenAI API Key**: For GPT models
- **Anthropic API Key**: For Claude models  
- **Google GenAI API Key**: For Gemini models
- **Groq API Key**: For fast inference
- **LangChain API Key**: For LangSmith tracing
- **Firebase Project Configuration**: For database
- **Google OAuth Credentials**: For YouTube integration
- **Firecrawl API Key**: For web scraping

## Deployment Steps

### 1. Deploy LangGraph Agents to LangGraph Cloud

```bash
# Install LangGraph CLI
pip install langgraph-cli

# Deploy the agents
cd apps/agents
langgraph deploy

# Note the deployment URL for LANGGRAPH_API_URL
```

### 2. Setup Firebase

```bash
# Login to Firebase
firebase login

# Set your project ID in firebase.json
firebase use your-project-id

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI:
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
# ... add all other environment variables
```

### 4. Configure Domain and Environment Variables

1. **Set NEXTAUTH_URL** to your Vercel deployment URL
2. **Set LANGGRAPH_API_URL** to your LangGraph Cloud deployment URL
3. **Configure OAuth redirect URLs** in Google Cloud Console

## Alternative Deployment Options

### Option 1: Firebase Hosting + Cloud Functions

```bash
# Build for Firebase hosting
cd apps/web
npm run build
npm run export

# Deploy to Firebase
firebase deploy
```

### Option 2: Docker Deployment

```bash
# Build the application
docker build -t pbl-canvas .

# Run with environment variables
docker run -p 3000:3000 --env-file .env pbl-canvas
```

### Option 3: Self-hosted with PM2

```bash
# Install PM2
npm install -g pm2

# Build the application
yarn build

# Start with PM2
pm2 start apps/web/package.json --name "pbl-canvas-web"
pm2 start apps/agents/package.json --name "pbl-canvas-agents"
```

## Environment-Specific Configuration

### Development
```bash
yarn dev
```

### Production
```bash
yarn build
yarn start
```

## Monitoring and Logs

- **Vercel**: Check function logs in Vercel dashboard
- **LangGraph Cloud**: Monitor agents in LangSmith
- **Firebase**: Check Firestore usage in Firebase console

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check Node.js version (requires 20+)
2. **API Rate Limits**: Monitor usage of OpenAI/Anthropic APIs
3. **Firebase Permissions**: Ensure Firestore rules allow your operations
4. **LangGraph Connection**: Verify LANGGRAPH_API_URL and API key

### Debug Commands:

```bash
# Check build locally
yarn build

# Test API routes
curl https://your-domain.vercel.app/api/health

# Check LangGraph agents
langgraph dev --port 54367
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **Firebase Rules**: Ensure proper access controls
4. **CORS**: Configure allowed origins for APIs

## Scaling Considerations

1. **Vercel Functions**: Monitor execution time and memory usage
2. **LangGraph Cloud**: Scale based on agent usage
3. **Firebase**: Monitor read/write operations
4. **Rate Limiting**: Implement rate limiting for API endpoints

## Backup and Recovery

1. **Firebase**: Enable automatic backups
2. **Environment Variables**: Keep secure backup of all keys
3. **Code**: Ensure all code is version controlled

For support, check the project documentation or create an issue in the repository.

# Containerized Deployment (Docker Compose)

The application is now fully containerized. Both the web frontend and the LangGraph agent run as separate services using Docker Compose.

## Starting the Application

1. Ensure Docker and Docker Compose are installed.
2. Copy `.env.example` to `.env` and configure your environment variables.
3. Run:

```sh
docker-compose up --build
```

- The web app will be available at http://localhost:3000
- The agent will be available at http://localhost:54367

## Services

- **web**: Next.js frontend (port 3000)
- **agent**: LangGraph agent (port 54367)
- **redis**: (optional) for caching (port 6379)

## Notes
- The `functions/` folder and Firebase Functions are no longer used.
- The Firebase Emulator is not required for local development. 
