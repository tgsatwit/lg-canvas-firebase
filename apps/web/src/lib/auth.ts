import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { createScopedLogger } from '@/utils/logger';

const logger = createScopedLogger('auth');

export interface ServerUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Get the current user from Firebase Auth on the server side
 * This replaces getServerSession from NextAuth
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    console.log('🔍 Starting server-side authentication check...');
    console.log('🌍 Environment check - FIREBASE_SERVICE_ACCOUNT_JSON exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    const cookieStore = await cookies();
    console.log('🍪 Cookie store created successfully');
    
    const sessionCookie = cookieStore.get('__session');
    
    console.log('🍪 Session cookie exists:', !!sessionCookie?.value);
    if (sessionCookie?.value) {
      console.log('🍪 Cookie value preview:', sessionCookie.value.substring(0, 50) + '...');
    }
    
    // Also check for other potential cookie names
    const allCookies = Array.from(cookieStore.getAll()).map(c => ({ name: c.name, hasValue: !!c.value }));
    console.log('🍪 All cookies available:', allCookies);
    
    if (!sessionCookie?.value) {
      console.log('❌ No session cookie found');
      return null;
    }

    const auth = adminAuth();
    console.log('🔥 Firebase Admin Auth initialized:', !!auth);
    
    if (!auth) {
      console.log('❌ Firebase Admin Auth is null - initialization failed');
      logger.error('Firebase Admin Auth not initialized');
      return null;
    }

    console.log('🔐 Attempting to verify session cookie...');
    
    try {
      // Verify the session cookie
      const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
      
      console.log('✅ Session verified successfully for user:', decodedClaims.uid);
      console.log('📧 User email:', decodedClaims.email);
    
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        displayName: decodedClaims.name,
        photoURL: decodedClaims.picture,
      };
    } catch (verifyError) {
      console.error('❌ Session cookie verification failed:', verifyError);
      return null;
    }
  } catch (error) {
    console.error('❌ Overall authentication error:', error);
    logger.error('Error verifying session:', { error });
    return null;
  }
}

/**
 * Verify Firebase ID token on the server side
 * Use this when you have an ID token from the client
 */
export async function verifyIdToken(idToken: string): Promise<ServerUser | null> {
  try {
    const auth = adminAuth();
    if (!auth) {
      logger.error('Firebase Admin Auth not initialized');
      return null;
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };
  } catch (error) {
    logger.error('Error verifying ID token:', { error });
    return null;
  }
}

/**
 * Create a session cookie for the user
 * Call this from an API route after successful authentication
 */
export async function createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 5 * 1000): Promise<string> {
  try {
    const auth = adminAuth();
    if (!auth) {
      throw new Error('Firebase Admin Auth not initialized');
    }

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
  } catch (error) {
    logger.error('Error creating session cookie:', { error });
    throw error;
  }
}

/**
 * Revoke all refresh tokens for a user
 * Call this when signing out
 */
export async function revokeAllSessions(uid: string): Promise<void> {
  try {
    const auth = adminAuth();
    if (!auth) {
      throw new Error('Firebase Admin Auth not initialized');
    }

    await auth.revokeRefreshTokens(uid);
  } catch (error) {
    logger.error('Error revoking sessions:', { error });
    throw error;
  }
}

 