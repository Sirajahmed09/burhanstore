import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';

/**
 * Error Logging API Endpoint
 * Receives and stores client-side errors for monitoring
 */
export async function POST(request) {
  try {
    const error = await request.json();
    
    // Store in database for monitoring
    if (process.env.NODE_ENV === 'production') {
      try {
        const errorsCol = await getCollection('errors');
        await errorsCol.insertOne({
          ...error,
          serverTimestamp: new Date(),
        });

        // Optional: Implement error alerting logic
        // if (error.message.includes('critical')) {
        //   sendAlert(error);
        // }
      } catch (dbError) {
        console.error('Failed to store error:', dbError);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging endpoint failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
