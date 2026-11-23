import { NextResponse } from 'next/server';
import { validAdminSession } from '@/lib/security/admin-gate';

const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get('admin_token')?.value || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const session = await validAdminSession(token);
  let response;

  if (pathname === '/admin/login') {
    response = session && !searchParams.get('clear') && !searchParams.get('logout')
      ? NextResponse.redirect(new URL('/admin/dashboard', request.url))
      : NextResponse.next();
  } else if (!session && pathname.startsWith('/api/admin')) {
    if (pathname !== '/api/admin/auth/login' || request.method !== 'POST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    response = NextResponse.next();
  } else if (!session) {
    response = NextResponse.redirect(new URL('/admin/login', request.url));
  } else {
    response = NextResponse.next();
  }

  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
