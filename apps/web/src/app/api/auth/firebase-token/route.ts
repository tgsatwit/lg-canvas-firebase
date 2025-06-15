import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Firebase Auth
    const user = await getServerUser();
    
    if (!user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Generate a custom token for the user
    const customToken = await auth.createCustomToken(user.uid, {
      email: user.email,
      name: user.displayName,
    });

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Error creating Firebase custom token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
} 