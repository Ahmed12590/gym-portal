import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/error"];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if no token and trying to access protected route
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/dashboard/admin")) {
    if (token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard/unauthorized", request.url)
      );
    }
  }

  if (pathname.startsWith("/dashboard/owner")) {
    if (token.role !== "GYM_OWNER") {
      return NextResponse.redirect(
        new URL("/dashboard/unauthorized", request.url)
      );
    }
  }

  if (pathname.startsWith("/dashboard/staff")) {
    if (token.role !== "STAFF_MEMBER") {
      return NextResponse.redirect(
        new URL("/dashboard/unauthorized", request.url)
      );
    }
  }

  // Add user info to headers for API routes to access
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", token.id as string);
  requestHeaders.set("x-user-role", token.role as string);
  if ((token as any).primaryGymId) {
    requestHeaders.set("x-gym-id", (token as any).primaryGymId as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
