import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

// Exchange a Firebase ID token for a session cookie
export async function POST(request: NextRequest) {
  console.log("Session login API route called");
  
  const auth = adminAuth();
  if (!auth) {
    console.error("Firebase Admin SDK not initialized");
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
      console.error("ID token not provided in request body");
      throw new Error("ID token not provided.");
    }
    console.log("ID token received");
  } catch (error) {
    console.error("Invalid request body or missing ID token", error);
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Set session expiration to 5 days. Adapt as needed.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    // Verify the ID token first to ensure it's valid.
    // This step is implicitly done by createSessionCookie, but explicit verification
    // can catch issues earlier or allow adding custom claims.
    console.log("Verifying ID token");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("ID token verified successfully for user:", decodedToken.uid);

    // Create the session cookie.
    console.log("Creating session cookie");
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log("Session cookie created successfully");

    // Set cookie policy for session cookie.
    console.log("Setting cookie in response");
    const response = NextResponse.json({ status: "success", userId: decodedToken.uid }, { status: 200 });
    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000, // maxAge is in seconds
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Error creating session cookie:", error);
    // Return more specific error message for debugging
    return NextResponse.json(
      { 
        error: "Failed to create session: " + error.message,
        code: error.code || "unknown",
        details: process.env.NODE_ENV !== "production" ? error.toString() : undefined
      },
      { status: 401 }
    );
  }
} 