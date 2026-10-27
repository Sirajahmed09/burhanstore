import { NextResponse } from 'next/server';
// Bootstrap must be performed through an explicit owner-controlled server workflow.
export async function GET() { return NextResponse.json({ error: 'Not Found' }, { status: 404 }); }
