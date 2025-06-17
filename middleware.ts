import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user is admin for admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token
      
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin?callbackUrl=/admin", req.url))
      }
      
      // Check if user has admin role
      if (token.role !== "admin" && !token.roles?.includes("ROLE_ADMIN")) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin login page without authentication
        if (req.nextUrl.pathname === "/admin/login") {
          return true
        }
        
        // For admin routes, require authentication
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/admin/:path*"]
}