import { NextResponse } from 'next/server';

/**
 * Web Vitals Analytics Endpoint
 * Receives and logs Core Web Vitals metrics
 */
export async function POST(request) {
  try {
    const metric = await request.json();
    
    // In production, send to analytics service (Google Analytics, Vercel Analytics, etc.)
    if (process.env.NODE_ENV === 'production') {
      console.log('Web Vital:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      });

      // TODO: Send to analytics service
      // Example: Google Analytics 4
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', metric.name, {
      //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      //     event_category: 'Web Vitals',
      //     event_label: metric.id,
      //     non_interaction: true,
      //   });
      // }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
