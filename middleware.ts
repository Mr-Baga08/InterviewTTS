// middleware.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthenticated = !!sessionCookie;

  console.log(`🛣️ Middleware: ${pathname}, Auth: ${isAuthenticated}`);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/sign-in',
    '/sign-up', 
    '/api',           // Keep existing API routes
    '/vapi',          // ADD THIS - Your VAPI routes
    '/_next',
    '/favicon.ico',
    '/logo.svg',
    '/covers',
    '/apple-',
    '/og-image',
    '/manifest.json'
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('🏠 Root: Redirecting authenticated user to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log('🏠 Root: Redirecting unauthenticated user to sign-in');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/sign-in' || pathname === '/sign-up')) {
    console.log('🔐 Auth page: Redirecting authenticated user to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to sign-in (except for public routes)
  if (!isAuthenticated && !isPublicRoute) {
    console.log('🚫 Protected route: Redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Continue to the requested page
  console.log('✅ Middleware: Proceeding to', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - vapi routes (your custom API routes) - UPDATED
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|vapi|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};