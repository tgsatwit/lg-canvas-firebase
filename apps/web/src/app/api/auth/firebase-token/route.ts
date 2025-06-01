import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a custom token for the user
    const customToken = await admin.auth().createCustomToken(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Error creating Firebase custom token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
} 