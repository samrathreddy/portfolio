import { NextRequest, NextResponse } from 'next/server';
import { generateSessionId, parseUserAgent, getGeolocationData } from '@/lib/analytics-utils';
import { connectToDatabase } from '@/lib/db';
import { withCorsMiddleware } from '@/lib/cors';

async function resumeClickHandler(request: NextRequest) {
  try {
    // Get client IP address with proper forwarding header handling
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               '127.0.0.1';
    
    // Get user agent and referrer
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Measure page load time if provided
    const body = await request.json().catch(() => ({}));
    const pageLoadTime = body.pageLoadTime;
    
    try {
      // Connect to database
      await connectToDatabase();
      
      // Parse user agent for device info
      const deviceInfo = parseUserAgent(userAgent);
      
      // Get geolocation data
      const geoData = await getGeolocationData(ip);
      
      // For now, just return success with session tracking
      // You can implement actual database saving here if needed
      console.log('Resume view tracked:', {
        sessionId,
        ip,
        userAgent: userAgent.substring(0, 50) + '...',
        referrer,
        pageLoadTime,
        ...deviceInfo,
        ...geoData
      });
      
      return NextResponse.json({ 
        success: true, 
        sessionId,
        message: 'Resume view tracked successfully'
      });
    } catch (dbError) {
      console.error('Database error tracking resume view:', dbError);
      return NextResponse.json({ 
        success: false,
        sessionId,
        message: 'Failed to track resume view'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error tracking resume click:', error);
    return NextResponse.json({ 
      error: 'Failed to track resume click',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the handler with CORS middleware
export const POST = withCorsMiddleware(resumeClickHandler); 