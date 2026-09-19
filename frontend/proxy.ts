import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessible without auth
const PUBLIC_ROUTES = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    // If already authenticated, redirect to judge dashboard (layouts handle role-based routing)
    if (accessToken) {
      return NextResponse.redirect(new URL('/judge', request.url));
    }
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: Role-based redirect is handled in layouts/pages via the /api/v1/auth/me check
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
