import { NextRequest, NextResponse } from "next/server";

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  "/login", 
  "/auth/login", 
  "/auth/signup", 
  "/auth/confirm", 
  "/auth/signout"
]; // Add other public paths if needed

// Define paths related to authentication flow itself
const AUTH_PATHS = [
  "/login",
  "/auth/login", 
  "/auth/signup", 
  "/auth/confirm", 
  "/auth/callback", 
  "/auth/signout"
]; // Add others like password reset if they exist

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

// Verify auth by calling the API route
async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  response: NextResponse;
}> {
  const response = NextResponse.next({ request });
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, response };
  }

  try {
    // Call the verify API route
    const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
      method: 'POST',
      headers: {
        Cookie: `__session=${sessionCookie}`,
      },
    });

    if (!verifyResponse.ok) {
      response.cookies.delete("__session");
      return { isAuthenticated: false, response };
    }

    const { isAuthenticated, userId } = await verifyResponse.json();
    
    if (isAuthenticated && userId) {
      response.headers.set("X-User-ID", userId);
      return { isAuthenticated: true, userId, response };
    }
  } catch (error) {
    console.warn("[Middleware] Auth verification failed:", error);
    response.cookies.delete("__session");
  }

  return { isAuthenticated: false, response };
}

export async function middleware(request: NextRequest) {
  const requestedPath = request.nextUrl.pathname;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response);
  }

  // Add CORS headers to API routes and return immediately
  if (isApiRoute(requestedPath)) {
    const response = NextResponse.next();
    return addCorsHeaders(response);
  }

  // Skip auth verification for public paths if they're being accessed directly
  if (isPublicPath(requestedPath)) {
    return NextResponse.next();
  }
  
  const { isAuthenticated, response } = await verifyAuth(request);

  // If user is authenticated
  if (isAuthenticated) {    
    // If accessing an auth page (like login/signup) while logged in, redirect to dashboard
    if (isAuthPath(requestedPath)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If accessing root, redirect to dashboard
    if (requestedPath === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Otherwise, allow access to the requested page
    return response;
  }

  // If user is NOT authenticated
  
  // If accessing a public path, allow access
  if (isPublicPath(requestedPath)) {
    return response;
  }
  
  // If accessing any other path (protected), redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
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
