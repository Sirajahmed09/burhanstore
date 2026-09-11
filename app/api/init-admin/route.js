import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/scripts/init-admin';

/**
 * Initialize Admin User Endpoint
 * ONE-TIME USE ONLY - Remove after first admin is created
 * GET /api/init-admin
 */
export async function GET(request) {
  try {
    // Security: Only allow in development or with explicitly configured secret key
    const isDev = process.env.NODE_ENV === 'development';
    const initKey = request.nextUrl.searchParams.get('key');
    const validKey = process.env.INIT_KEY;

    if (!isDev) {
      if (!validKey) {
        return NextResponse.json(
          { error: 'Endpoint disabled in production unless INIT_KEY is configured' },
          { status: 403 }
        );
      }
      if (initKey !== validKey) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const result = await initializeAdmin();

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Admin initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
