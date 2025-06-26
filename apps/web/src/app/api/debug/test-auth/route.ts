import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/client';

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if Firebase auth is available
    const authStatus = {
      authExists: !!auth,
      authType: typeof auth,
      hasCurrentUser: !!auth?.currentUser,
      currentUserUid: auth?.currentUser?.uid || null,
    };

    console.log('🔍 API Auth Debug:', authStatus);

    if (!auth) {
      return NextResponse.json({ 
        error: 'Firebase auth is not initialized',
        authStatus 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Firebase auth is available',
      authStatus,
      note: 'This endpoint only checks auth availability, not actual login'
    });

  } catch (error) {
    console.error('❌ Auth test API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const authStatus = {
    authExists: !!auth,
    authType: typeof auth,
    hasCurrentUser: !!auth?.currentUser,
    currentUserUid: auth?.currentUser?.uid || null,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Auth status check',
    authStatus
  });
} 