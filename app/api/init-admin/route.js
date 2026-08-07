import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/scripts/init-admin';

/**
 * Initialize Admin User Endpoint
 * ONE-TIME USE ONLY - Remove after first admin is created
 * GET /api/init-admin
 */
export async function GET(request) {
  try {
    // Security: Only allow in development or with special key
    const isDev = process.env.NODE_ENV === 'development';
    const initKey = request.nextUrl.searchParams.get('key');
    const validKey = process.env.INIT_KEY || 'burhan-init-2024';

    if (!isDev && initKey !== validKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
