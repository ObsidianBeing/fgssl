// src/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define protected routes and their required roles
const protectedRoutes = {
  "/dashboard": ["admin", "manager", "member"],
  "/dashboard/admin": ["admin"],
  "/dashboard/manager": ["admin", "manager"],
  "/dashboard/users": ["admin"],
  "/dashboard/donations": ["admin", "manager"],
  "/dashboard/analytics": ["admin", "manager"],
  "/dashboard/settings": ["admin", "manager"],
  "/dashboard/reports": ["admin", "manager"],
  "/api/dashboard": ["admin", "manager", "member"],
  "/api/admin": ["admin"],
  "/api/users": ["admin"],
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/donate") ||
    pathname.startsWith("/unsubscribe") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = Object.keys(protectedRoutes).some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Get the token
    const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      // Redirect to login if not authenticated
      const url = new URL("/auth/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    // Check if the current path requires specific roles
    const matchedRoute = Object.keys(protectedRoutes).find(route => 
      pathname.startsWith(route)
    )

    if (matchedRoute) {
      const requiredRoles = protectedRoutes[matchedRoute as keyof typeof protectedRoutes]
      const userRole = token?.role as string

      // Check if user has required role
      if (!userRole || !requiredRoles.includes(userRole)) {
        console.log(`Access denied for user role: ${userRole} to path: ${pathname}`)
        
        // Redirect to unauthorized page
        const url = new URL("/auth/unauthorized", req.url)
        url.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
}
