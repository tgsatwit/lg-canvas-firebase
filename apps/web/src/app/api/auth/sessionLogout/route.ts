import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const auth = adminAuth();
  if (!auth) {
    // Even if admin SDK isn't init, we can still clear the cookie
    const response = NextResponse.json(
      { status: "success - admin sdk inactive" },
      { status: 200 }
    );
    response.cookies.set("__session", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    return response;
  }

  const sessionCookie = request.cookies.get("__session")?.value;

  // Create response early to set cookies
  const response = NextResponse.json({ status: "success" }, { status: 200 });
  
  // Clear the cookie immediately
  response.cookies.set("__session", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  // If there was a session cookie, try to revoke the refresh tokens
  if (sessionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie);
      await auth.revokeRefreshTokens(decodedClaims.sub); // Revoke tokens for the user ID
    } catch (error: any) {
      // Ignore errors if the cookie is invalid or expired
      if (error.code !== 'auth/invalid-session-cookie' && error.code !== 'auth/session-cookie-expired') {
        console.error("Error revoking refresh tokens:", error);
        // Optionally return an error, but typically logout should succeed visually
        // return NextResponse.json({ error: "Failed to revoke tokens." }, { status: 500 });
      }
    }
  }

  return response;
} 