import { NextResponse } from 'next/server';
import { readJsonBody, clientAddress } from '@/lib/security/requests';
import { consumeRateLimit } from '@/lib/security/rate-limit';
export async function POST(request) {
  try {
    const metric = await readJsonBody(request, 4096);
    await consumeRateLimit('vitals', clientAddress(request), 120, 15 * 60 * 1000);
    if (!['CLS', 'LCP', 'INP', 'FCP', 'TTFB'].includes(metric.name) || !Number.isFinite(metric.value)) return NextResponse.json({ success: false }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false }, { status: error.status || 500 }); }
}
