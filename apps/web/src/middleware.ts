import { NextRequest, NextResponse } from "next/server";

// Define paths that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/confirm", "/auth/signout"]; // Add other public paths if needed

// Define paths related to authentication flow itself
const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/confirm", "/auth/callback", "/auth/signout"]; // Add others like password reset if they exist

// Helper function to add CORS headers to a response
function addCorsHeaders(response: NextResponse) {
  // Allow requests from both port 3000 and 3002
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3002');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Helper function to check if a path is an API route
function isApiRoute(path: string): boolean {
  return path.startsWith('/api/');
}

// Helper function to check if a path is a public path
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(`${publicPath}/`));
}

// Helper function to check if a path is an auth path
function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some(authPath => path === authPath || path.startsWith(`${authPath}/`));
}

async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  response: NextResponse;
}> {
  console.log(`[Middleware] Verifying auth for: ${request.nextUrl.pathname}`);
  const response = NextResponse.next({ request }); // Start with a pass-through response
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    console.log('[Middleware] No session cookie found');
    return { isAuthenticated: false, response }; // No cookie, not authenticated
  }

  try {
    // Call the auth verification API route
    console.log('[Middleware] Verifying session cookie with /api/auth/verify');
    const verifyResponse = await fetch(new URL("/api/auth/verify", request.url), {
      method: "POST",
      headers: {
        Cookie: `__session=${sessionCookie}`,
      },
    });

    if (!verifyResponse.ok) {
      console.log('[Middleware] Session verification failed with status:', verifyResponse.status);
      response.cookies.delete("__session");
      return { isAuthenticated: false, response };
    }

    const { isAuthenticated, userId } = await verifyResponse.json();
    console.log(`[Middleware] Auth verification result: ${isAuthenticated}, userId: ${userId || 'not present'}`);
    
    if (isAuthenticated && userId) {
      response.headers.set("X-User-ID", userId);
      return { isAuthenticated: true, userId, response };
    }

    console.log('[Middleware] Invalid session - deleting cookie');
    response.cookies.delete("__session");
    return { isAuthenticated: false, response };
  } catch (error) {
    console.warn("[Middleware] Auth verification failed:", error);
    response.cookies.delete("__session");
    return { isAuthenticated: false, response };
  }
}

export async function middleware(request: NextRequest) {
  const requestedPath = request.nextUrl.pathname;
  console.log(`[Middleware] Processing request for: ${requestedPath}`);
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('[Middleware] Handling OPTIONS request');
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response);
  }

  // Add CORS headers to API routes and return immediately
  if (isApiRoute(requestedPath)) {
    console.log('[Middleware] Processing API route');
    const response = NextResponse.next();
    return addCorsHeaders(response);
  }

  // Skip middleware for static files, images, etc. (already handled by config.matcher)
  
  // Skip auth verification for public paths if they're being accessed directly
  if (isPublicPath(requestedPath)) {
    console.log(`[Middleware] Skipping auth for public path: ${requestedPath}`);
    return NextResponse.next();
  }
  
  const { isAuthenticated, response } = await verifyAuth(request);

  // --- Routing Logic ---

  // If user is authenticated
  if (isAuthenticated) {
    console.log(`[Middleware] User is authenticated, requested path: ${requestedPath}`);
    
    // If accessing an auth page (like login/signup) while logged in, redirect to home
    if (isAuthPath(requestedPath)) {
      console.log('[Middleware] Authenticated user trying to access auth path, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Otherwise, allow access to the requested page
    return response;
  }

  // If user is NOT authenticated
  console.log(`[Middleware] User is NOT authenticated, requested path: ${requestedPath}`);
  
  // If accessing a public path, allow access
  if (isPublicPath(requestedPath)) {
    console.log('[Middleware] Allowing access to public path');
    return response;
  }
  
  // If accessing any other path (protected), redirect to login
  console.log('[Middleware] Redirecting unauthenticated user to login');
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
