import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, verifyIdToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const user = await verifyIdToken(idToken);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 401 }
      );
    }

    // Create session cookie (5 days)
    const sessionCookie = await createSessionCookie(idToken, 60 * 60 * 24 * 5 * 1000);

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: 60 * 60 * 24 * 5, // 5 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('__session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
} 