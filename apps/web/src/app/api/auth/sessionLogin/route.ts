import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

// Exchange a Firebase ID token for a session cookie
export async function POST(request: NextRequest) {
  const auth = adminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized." },
      { status: 500 }
    );
  }

  let idToken: string;
  try {
    const body = await request.json();
    idToken = body.idToken;
    if (!idToken) {
      throw new Error("ID token not provided.");
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Set session expiration to 5 days. Adapt as needed.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    // Verify the ID token first to ensure it's valid.
    // This step is implicitly done by createSessionCookie, but explicit verification
    // can catch issues earlier or allow adding custom claims.
    await auth.verifyIdToken(idToken);

    // Create the session cookie.
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    cookies().set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000, // maxAge is in seconds
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json(
      { error: "Failed to create session: " + error.message },
      { status: 401 }
    );
  }
} 