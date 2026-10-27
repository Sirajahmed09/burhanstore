import { NextResponse } from 'next/server';
import { validEntryKey, createEntryCookie } from '@/lib/security/admin-gate';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  const { key } = await params;
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };
  if (!await validEntryKey(key)) return new NextResponse('Not Found', { status: 404, headers });
  try {
    const response = NextResponse.redirect(new URL('/admin/login', request.url), 303);
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    response.cookies.set('burhan_staff_gate', await createEntryCookie(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
    return response;
  } catch { return new NextResponse('Staff access is temporarily unavailable', { status: 503, headers }); }
}
