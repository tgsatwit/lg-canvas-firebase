# Firebase Deployment Guide

## Overview

Yes, you can deploy to Firebase! However, due to the complexity of your application (Next.js with API routes + LangGraph agents), there are two approaches:

### Approach 1: Frontend-only on Firebase (Recommended)
- **Frontend** → Firebase Hosting (static export)
- **API Routes** → Vercel/Railway/other platform
- **Agents** → LangGraph Cloud
- **Database** → Firebase Firestore

### Approach 2: Full-stack on Firebase (Advanced)
- Everything on Firebase using Cloud Functions
- More complex setup, higher costs

## Quick Firebase Deployment (Approach 1)

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### 1. Setup Firebase Project
```bash
# Initialize or use existing project
firebase init

# Or set existing project
firebase use your-project-id
```

### 2. Deploy Frontend to Firebase
```bash
# Quick deploy
yarn deploy:firebase
```

### 3. Deploy API Routes Separately
```bash
# Deploy API routes to Vercel
yarn deploy:web
```

## What Gets Deployed to Firebase

✅ **Frontend (React/Next.js)**
- Static HTML, CSS, JS files
- Client-side routing
- Static assets

✅ **Firestore Database**
- Database rules
- Indexes
- Data

❌ **API Routes** (deployed separately)
- Authentication endpoints
- Chat APIs
- Video processing
- Social media integration

## Configuration Details

### Firebase Hosting Setup
The `firebase.json` is configured for:
- Static file hosting from `apps/web/out`
- SPA routing with fallback to `index.html`
- Optimized caching for static assets

### Next.js Configuration
Updated `next.config.mjs` with:
- `output: 'export'` for static generation
- `trailingSlash: true` for Firebase compatibility
- `distDir: 'out'` for output directory

## Environment Variables

For Firebase hosting, you'll need to:
1. Set client-side environment variables in your build
2. Deploy API routes to a platform that supports server environment variables

### Client-side (Firebase)
```bash
# These get bundled into your static files
NEXT_PUBLIC_FIREBASE_CONFIG=...
NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app
```

### Server-side (Vercel/other platform)
```bash
# These stay secure on the server
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
DATABASE_URL=...
```

## Deployment Commands

```bash
# Firebase frontend only
yarn deploy:firebase

# API routes to Vercel
yarn deploy:web

# Full deployment (hybrid)
yarn deploy
```

## Benefits of Firebase Hosting

✅ **Fast Global CDN**
✅ **Free SSL certificates**
✅ **Automatic scaling**
✅ **Integration with Firestore**
✅ **Custom domains**
✅ **Preview channels**

## Limitations

❌ **No server-side API routes**
❌ **No server-side rendering (SSR)**
❌ **Static export only**

## Hybrid Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │     Vercel      │    │  LangGraph      │
│   Hosting       │◄──►│   API Routes    │◄──►│    Cloud        │
│   (Frontend)    │    │   (Backend)     │    │   (Agents)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │    Firebase     │
                    │   Firestore     │
                    │   (Database)    │
                    └─────────────────┘
```

## Troubleshooting

### Build Issues
```bash
# If static export fails
cd apps/web
npm run build
# Check for dynamic features that need server-side runtime
```

### API Connection Issues
```bash
# Make sure NEXT_PUBLIC_API_URL points to your API deployment
# Update CORS settings on your API platform
```

### Firebase Project Issues
```bash
# Check active project
firebase projects:list

# Switch project
firebase use your-project-id
```

## Costs

- **Firebase Hosting**: Free tier generous, then $0.026/GB
- **Firestore**: Pay per operation
- **API Platform**: Varies (Vercel has generous free tier)

This hybrid approach gives you the best of both worlds: fast static hosting on Firebase with full API capabilities on specialized platforms. 