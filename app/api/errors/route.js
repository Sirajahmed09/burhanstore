import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { readJsonBody, clientAddress } from '@/lib/security/requests';
import { consumeRateLimit } from '@/lib/security/rate-limit';
export async function POST(request) {
  try {
    await readJsonBody(request, 16384);
    await consumeRateLimit('client-errors', clientAddress(request), 20, 60 * 60 * 1000);
    // Never persist arbitrary client stacks, context, query strings or credentials.
    const col = await getCollection('errors');
    await col.insertOne({ type: 'client_error', serverTimestamp: new Date() });
    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) { return NextResponse.json({ success: false }, { status: error.status || 500 }); }
}
