import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('admin_token')?.value;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle logged-in admin visiting login page
  if (pathname === '/admin/login' && adminToken) {
    const isLogoutOrClear = request.nextUrl.searchParams.get('clear') || request.nextUrl.searchParams.get('logout');
    if (!isLogoutOrClear) {
      const redirectParam = request.nextUrl.searchParams.get('redirect');
      const destination = (redirectParam && redirectParam.startsWith('/admin') && redirectParam !== '/admin/login')
        ? redirectParam
        : '/admin/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
