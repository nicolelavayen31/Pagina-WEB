import { NextResponse, type NextRequest } from 'next/server';

/**
 * First line of defence for the admin UI: no session cookie -> login page.
 * The API still validates the session and permissions on every request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has('session_token')) {
    return NextResponse.next();
  }
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)'],
};
