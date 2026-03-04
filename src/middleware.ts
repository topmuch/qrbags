import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Protect admin routes (both pages and API)
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
          // Must have a valid token with superadmin role for admin routes
          if (!token) {
            return false;
          }

          // For admin routes, require superadmin role
          if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
            return token.role === 'superadmin';
          }
        }

        // Protect agency dashboard routes
        if (pathname.startsWith('/dashboard/agency') || pathname.startsWith('/api/agency')) {
          if (!token) {
            return false;
          }
          // Agency dashboard accessible by both agency and superadmin
          return token.role === 'agency' || token.role === 'superadmin';
        }

        // Allow all other routes
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    // Admin pages
    '/admin/:path*',
    // Admin API routes
    '/api/admin/:path*',
    // Agency dashboard
    '/dashboard/agency/:path*',
    // Agency API routes
    '/api/agency/:path*',
  ],
};
