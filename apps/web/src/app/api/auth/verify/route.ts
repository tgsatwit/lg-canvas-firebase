import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    const auth = adminAuth();
    if (!auth) {
      console.error('[Auth API] Firebase Admin SDK not initialized');
      return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ 
      isAuthenticated: true, 
      userId: decodedClaims.uid 
    });
  } catch (error) {
    console.error('[Auth API] Session verification failed:', error);
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
} 