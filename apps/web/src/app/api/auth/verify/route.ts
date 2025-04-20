import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("[Verify API] Session verification request received");
  
  const auth = adminAuth();
  if (!auth) {
    console.error("[Verify API] Firebase Admin SDK not initialized");
    return NextResponse.json({ isAuthenticated: false, error: "Firebase Admin SDK not initialized" }, { status: 500 });
  }

  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    console.log("[Verify API] No session cookie found");
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    console.log("[Verify API] Verifying session cookie");
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    console.log(`[Verify API] Session verified successfully for user: ${decodedToken.uid}`);
    
    return NextResponse.json({
      isAuthenticated: true,
      userId: decodedToken.uid,
    });
  } catch (error: any) {
    console.error("[Verify API] Session verification failed:", error?.message || error);
    
    // Return more detailed error for debugging
    return NextResponse.json({ 
      isAuthenticated: false, 
      error: error?.message || "Unknown error",
      code: error?.code
    }, { status: 401 });
  }
} 