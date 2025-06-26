# Deployment Guide

## Environment Variables Required for Production

### Firebase Client Configuration
Add these to your hosting platform (Render, Vercel, etc.):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### Server-side Configuration
```bash
FIREBASE_VIDEOS_DB=your-database
FIREBASE_VIDEOS_COLLECTION=videos-master
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### AI Configuration
```bash
LANGCHAIN_API_KEY=your_key
ANTHROPIC_API_KEY=your_key  
OPENAI_API_KEY=your_key
```

## Setup Instructions

1. **Render Dashboard** → Your Service → Environment Tab
2. **Add Variables** - Copy from your local `.env` file
3. **Deploy** - Save and redeploy

## Troubleshooting

**Firebase Auth Error**: Ensure `NEXT_PUBLIC_FIREBASE_*` variables are set
**Build Fails**: Check TypeScript errors in build logs
**Login Fails**: Verify Firebase Auth domain in Firebase console