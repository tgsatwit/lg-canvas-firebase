import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Verifies the user's session cookie on the server-side.
 * Should be called within API routes, Server Actions, or Route Handlers.
 * @returns The decoded user token if authenticated, otherwise null.
 */
export async function verifyUserAuthenticated(): Promise<DecodedIdToken | null> {
  // Get the session cookie
  const sessionCookie = cookies().get("__session")?.value;
  if (!sessionCookie) {
    return null;
  }

  // Get Firebase Auth instance
  const auth = adminAuth();
  if (!auth) {
    console.error("Firebase Admin SDK not initialized");
    return null;
  }

  try {
    // Verify the session cookie with revocation check
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    // Log error type but avoid exposing sensitive details
    if (error instanceof Error) {
      console.warn(`Session verification failed: ${error.name}`);
    }
    // Invalid or expired session
    return null;
  }
}

/**
 * Gets the user ID from the verified session cookie.
 * @returns User ID string if authenticated, otherwise null.
 */
export async function getUserIdFromSession(): Promise<string | null> {
  const decodedToken = await verifyUserAuthenticated();
  return decodedToken?.uid ?? null;
} 