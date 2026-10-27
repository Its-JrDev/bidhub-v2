import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/shared/utils/jwt';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/shared/utils/auth-cookies';

/**
 * Next.js 16 Auth Proxy / Edge Route Guard
 *
 * Enforces role-based access control and session verification:
 * - Unauthenticated requests to private or admin routes redirect to /login
 * - Authenticated requests lacking the "ADMIN" role redirect away from /admin
 * - Already authenticated users visiting /login or /register redirect to /dashboard
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  let session = accessToken ? await verifyAccessToken(accessToken) : null;

  // If accessToken expired but refreshToken is present, consider authenticated for proxy pass
  const hasValidSession = Boolean(session || refreshToken);
  const isAdmin = session ? session.role === 'ADMIN' : false;

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isPrivateRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auctions/new') ||
    pathname.includes('/edit');
  const isAdminRoute = pathname.startsWith('/admin');

  // 1. Unauthenticated users accessing protected routes -> redirect to /login
  if ((isPrivateRoute || isAdminRoute) && !hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Non-admin users accessing /admin -> redirect to /dashboard
  if (isAdminRoute && session && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Already authenticated users visiting login/register -> redirect to /dashboard
  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auctions/new',
    '/auctions/:id/edit',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
