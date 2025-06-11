# Firebase Functions + LangGraph Deployment Guide

Perfect! This setup gives you the best of both worlds:

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │    Firebase     │    │   LangGraph     │
│   Hosting       │◄──►│  Cloud Functions│◄──►│    Cloud        │
│   (Frontend)    │    │  (API Routes)   │    │   (Agents)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         └───────────────────────┼───────────────────────
                                 ▼
                    ┌─────────────────┐
                    │    Firebase     │
                    │   Firestore     │
                    │   (Database)    │
                    └─────────────────┘
```

## ✅ What's Deployed Where

### Firebase Hosting
- ✅ React frontend 
- ✅ Static assets
- ✅ Client-side routing

### Firebase Cloud Functions  
- ✅ All API routes (`/api/*`)
- ✅ Server-side rendering
- ✅ Authentication endpoints
- ✅ Video processing APIs
- ✅ Social media integration

### LangGraph Cloud
- ✅ AI agents
- ✅ Chat processing
- ✅ Content generation

### Firebase Firestore
- ✅ Database
- ✅ User data
- ✅ Application state

## 🚀 Quick Deployment

### Prerequisites
```bash
# Install required tools
npm install -g firebase-tools
pip install langgraph-cli

# Login to services
firebase login
```

### 1. Deploy Agents First
```bash
yarn deploy:agents
```
📝 **Important**: Note the LangGraph deployment URL for next step

### 2. Configure Environment
```bash
# Set Firebase Functions environment variables
firebase functions:config:set \
  langgraph.api_url=https://your-deployment.langchain.app \
  langgraph.api_key=your-api-key \
  openai.api_key=your-openai-key \
  anthropic.api_key=your-anthropic-key
```

### 3. Deploy Firebase (Frontend + API)
```bash
yarn deploy:firebase
```

## 🔧 Configuration Details

### Firebase Functions Setup
- **Runtime**: Node.js 20
- **Memory**: 2GB (for AI workloads)
- **Timeout**: 540 seconds (for long-running operations)
- **Auto-scaling**: 0-10 instances

### Environment Variables

#### Firebase Functions Environment
```bash
# Set via Firebase CLI
firebase functions:config:set app.env="production"
firebase functions:config:set langgraph.api_url="https://your-deployment.langchain.app"
firebase functions:config:set langgraph.api_key="your-key"
firebase functions:config:set openai.api_key="your-key"
firebase functions:config:set anthropic.api_key="your-key"
firebase functions:config:set google.client_id="your-oauth-id"
firebase functions:config:set google.client_secret="your-oauth-secret"
```

#### Client-side Environment (Build time)
```bash
# In your .env file
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_REGION=us-central1
```

## 📊 Monitoring & Debugging

### Firebase Functions Logs
```bash
# Watch logs in real-time
firebase functions:log

# Get specific function logs
firebase functions:log --only nextjsFunc
```

### LangGraph Monitoring
- Monitor agents in LangSmith dashboard
- Check agent performance and usage

### Firebase Console
- Monitor hosting bandwidth
- Check function invocations and errors
- Monitor Firestore operations

## 💰 Cost Optimization

### Firebase Functions
- **Free tier**: 2M invocations/month
- **Pricing**: $0.40 per million invocations + compute time
- **Optimization**: Use minInstances: 0 for auto-scaling

### Firebase Hosting
- **Free tier**: 10GB/month
- **CDN**: Global edge caching included

### LangGraph Cloud
- Pay per agent execution
- Monitor usage in LangSmith

### Firestore
- **Free tier**: 50k reads, 20k writes/day
- **Optimization**: Implement proper indexing

## 🔍 Troubleshooting

### Function Cold Starts
```javascript
// In functions/src/index.ts - already configured
exports.nextjsFunc = functions
  .runWith({
    memory: '2GB',
    timeoutSeconds: 540,
    minInstances: 1, // Keep warm instance
  })
```

### Build Issues
```bash
# Check Next.js build
cd apps/web && npm run build

# Check Functions build  
cd functions && npm run build

# Manual deploy
firebase deploy --only functions:nextjsFunc
```

### Environment Variables Not Loading
```bash
# Check current config
firebase functions:config:get

# Deploy config
firebase functions:config:set key=value
firebase deploy --only functions
```

### API Route Errors
```bash
# Check function logs
firebase functions:log --only nextjsFunc

# Test function locally
cd functions && npm run serve
```

## 🔄 Development Workflow

### Local Development
```bash
# Start Next.js dev server
cd apps/web && npm run dev

# Start Firebase emulators
firebase emulators:start

# Start LangGraph agents locally
cd apps/agents && npm run dev
```

### Staging Deployment
```bash
# Deploy to staging project
firebase use staging-project-id
yarn deploy:firebase
```

### Production Deployment
```bash
# Deploy to production
firebase use production-project-id
yarn deploy:agents  # Deploy agents first
yarn deploy:firebase  # Then deploy Firebase
```

## 📈 Scaling Considerations

### High Traffic
- Increase Firebase Functions concurrency
- Use Firebase Hosting CDN
- Implement caching strategies

### Large AI Workloads
- Monitor LangGraph Cloud usage
- Implement request queuing
- Use appropriate memory allocation

## 🔐 Security

### API Keys
- Never expose server-side keys to client
- Use Firebase Functions environment config
- Rotate keys regularly

### Authentication
- Implement proper Firebase Auth
- Secure API routes with middleware
- Use CORS appropriately

This setup gives you enterprise-grade deployment with automatic scaling, global CDN, and specialized AI infrastructure! 