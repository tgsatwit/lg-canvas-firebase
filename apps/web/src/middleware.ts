import { NextRequest, NextResponse } from "next/server";

// Define paths that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/signout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public paths
  if (
    PUBLIC_PATHS.some(path => pathname.startsWith(path)) || 
    pathname.startsWith("/_next") || 
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/) ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") || // Allow Firebase auth API routes
    pathname.startsWith("/api/youtube") || // Allow YouTube API routes (they handle their own auth)
    pathname.startsWith("/api/chat") || // Allow chat API route (handles its own auth)
    (pathname.startsWith("/api/debug") && process.env.NODE_ENV === 'development') || // Allow debug endpoints in development
    (pathname.startsWith("/debug") && process.env.NODE_ENV === 'development') // Allow debug pages in development
  ) {
    return NextResponse.next();
  }

  // Check for Firebase session cookie
  const sessionCookie = request.cookies.get('__session');

  // If session exists, continue, otherwise redirect to login
  if (sessionCookie?.value) {
    // Note: We're not verifying the session cookie here for performance
    // The verification happens in the actual API routes/pages that need it
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
