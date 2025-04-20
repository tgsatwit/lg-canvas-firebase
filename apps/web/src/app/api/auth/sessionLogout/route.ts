import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(_request: NextRequest) {
  const auth = adminAuth();
  if (!auth) {
    // Even if admin SDK isn't init, we can still clear the cookie
    cookies().delete("__session");
    return NextResponse.json({ status: "success - admin sdk inactive" }, { status: 200 });
  }

  const sessionCookie = cookies().get("__session")?.value;

  // Clear the cookie immediately
  cookies().delete("__session");

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

  return NextResponse.json({ status: "success" }, { status: 200 });
} 