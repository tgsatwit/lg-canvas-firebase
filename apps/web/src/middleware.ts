import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define paths that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/signout", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public paths
  if (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) || 
    pathname.startsWith("/_next") || 
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/) ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check session with NextAuth
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET || "tUXL/gKjz3Q67p4YA8kjlhsDUeXeYSrAcYLTbDUsEpo="
  });

  // If session exists, continue, otherwise redirect to login
  if (token) {
    return NextResponse.next();
  }
  
  // Redirect to login page if no session
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("callbackUrl", encodeURI(request.url));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except static files and images (more explicit pattern)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
