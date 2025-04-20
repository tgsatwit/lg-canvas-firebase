import { NextRequest, NextResponse } from "next/server";

// Define paths that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/confirm"]; // Add other public paths if needed

// Define paths related to authentication flow itself
const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/confirm", "/auth/callback"]; // Add others like password reset if they exist

async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  response: NextResponse;
}> {
  const response = NextResponse.next({ request }); // Start with a pass-through response
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, response }; // No cookie, not authenticated
  }

  try {
    // Call the auth verification API route
    const verifyResponse = await fetch(new URL("/api/auth/verify", request.url), {
      method: "POST",
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

    response.cookies.delete("__session");
    return { isAuthenticated: false, response };
  } catch (error) {
    console.warn("Auth verification failed:", error);
    response.cookies.delete("__session");
    return { isAuthenticated: false, response };
  }
}

export async function middleware(request: NextRequest) {
  // Skip middleware for static files, images, etc. (already handled by config.matcher)
  // Skip middleware for API routes (authentication should be handled within the route)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { isAuthenticated, response } = await verifyAuth(request);
  const requestedPath = request.nextUrl.pathname;

  // --- Routing Logic ---

  // If user is authenticated
  if (isAuthenticated) {
    // If accessing an auth page (like login/signup) while logged in, redirect to home
    if (AUTH_PATHS.includes(requestedPath)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      response.headers.set("Location", homeUrl.toString());
      return new NextResponse(null, { status: 307, headers: response.headers });
    }
    // Otherwise, allow access to the requested page
    return response;
  }

  // If user is NOT authenticated
  // If accessing a public path, allow access
  if (PUBLIC_PATHS.includes(requestedPath)) {
    return response;
  }
  // If accessing any other path (protected), redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  response.headers.set("Location", loginUrl.toString());
  return new NextResponse(null, { status: 307, headers: response.headers });
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
