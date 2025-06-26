import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const firebaseConfig = {
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    
    // Safe partial values for debugging
    apiKeyPreview: process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
      ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + '...' 
      : 'NOT_SET',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
    
    // Environment info
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
  };

  return NextResponse.json({
    message: 'Firebase Config Debug',
    config: firebaseConfig,
    allValid: firebaseConfig.hasApiKey && 
              firebaseConfig.hasAuthDomain && 
              firebaseConfig.hasProjectId &&
              firebaseConfig.hasStorageBucket &&
              firebaseConfig.hasMessagingSenderId &&
              firebaseConfig.hasAppId
  });
} 