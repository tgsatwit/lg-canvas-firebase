import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = adminAuth();
  if (!auth) {
    return NextResponse.json({ isAuthenticated: false }, { status: 500 });
  }

  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({
      isAuthenticated: true,
      userId: decodedToken.uid,
    });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
} 