import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or for debugging
  if (process.env.NODE_ENV === 'production') {
    // In production, only show if Firebase vars exist
    const hasFirebaseVars = !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    
    if (!hasFirebaseVars) {
      return NextResponse.json({
        error: 'Firebase environment variables not detected',
        debug: {
          nodeEnv: process.env.NODE_ENV,
          hasFirebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          hasFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          hasFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          allNextPublicVars: Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC_'))
            .map(key => ({ key, hasValue: !!process.env[key] }))
        }
      }, { status: 500 });
    }
  }

  // Safe environment variable check (only show if they exist, don't expose values)
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    firebaseVars: {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    allNextPublicVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .sort()
  };

  return NextResponse.json({
    message: 'Environment variables status',
    status: envStatus
  });
}