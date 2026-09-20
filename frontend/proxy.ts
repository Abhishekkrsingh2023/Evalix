import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js proxy (edge middleware).
 *
 * NOTE: The access_token cookie is HttpOnly and set by the backend API
 * (a different origin in dev), so this proxy typically cannot read it.
 * All authentication & role-based guards are handled client-side by
 * the layout components (admin/layout.tsx, judge/layout.tsx) which call
 * /auth/me with credentials.  The proxy only handles lightweight routing
 * concerns that don't depend on auth state.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // If user is on /login but already has a valid cookie (e.g. same-origin
  // deployment), redirect them away from the login page.
  if (pathname.startsWith('/login') && accessToken) {
    return NextResponse.redirect(new URL('/judge', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
