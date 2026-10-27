import { NextResponse } from 'next/server';
import { validAdminSession, validEntryCookie } from '@/lib/security/admin-gate';
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_token')?.value || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const session = await validAdminSession(token);
  const entry = await validEntryCookie(request.cookies.get('burhan_staff_gate')?.value);
  if (!session && !entry) return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !session) return NextResponse.redirect(new URL('/admin/login', request.url));
  if (pathname === '/admin/login' && session && !request.nextUrl.searchParams.get('clear') && !request.nextUrl.searchParams.get('logout')) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
