// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle root path redirect to dashboard for authenticated users
  if (pathname === '/') {
    const sessionCookie = request.cookies.get('session');
    
    if (sessionCookie) {
      // User is likely authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      // User is not authenticated, redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Continue to the requested page
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any files with extensions (js, css, png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};