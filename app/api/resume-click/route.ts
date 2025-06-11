import { NextRequest, NextResponse } from 'next/server';
import { generateSessionId, parseUserAgent, getGeolocationData } from '@/lib/analytics-utils';
import { connectToDatabase } from '@/lib/db';
import { withCorsMiddleware } from '@/lib/cors';
import ResumeViewModel from '@/lib/models/ResumeView';

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
    const referrer = request.headers.get('referer') || null;
    
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
      
      // Create the resume view record
      const resumeViewData = {
        ip,
        userAgent,
        referrer,
        createdAt: new Date(),
        downloaded: false, // Initially not downloaded
        sessionId,
        
        // Enhanced user agent data
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        device: deviceInfo.device,
        deviceType: deviceInfo.deviceType,
        
        // Geolocation data (if available)
        ...(geoData && {
          country: geoData.country,
          city: geoData.city,
          region: geoData.region,
          timezone: geoData.timezone,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          org: geoData.org,
          postal: geoData.postal,
          countryCode: geoData.countryCode
        })
      };
      
      // Save to database
      const savedView = await ResumeViewModel.create(resumeViewData);
      
      console.log('Resume view tracked and saved:', {
        id: savedView._id,
        sessionId,
        ip,
        userAgent: userAgent.substring(0, 50) + '...',
        referrer,
        pageLoadTime,
        ...deviceInfo,
        ...(geoData && { location: `${geoData.city || 'Unknown'}, ${geoData.country || 'Unknown'}` })
      });
      
      return NextResponse.json({ 
        success: true, 
        sessionId,
        recordId: savedView._id,
        message: 'Resume view tracked successfully'
      });
    } catch (dbError) {
      console.error('Database error tracking resume view:', dbError);
      return NextResponse.json({ 
        success: false,
        sessionId,
        message: 'Failed to track resume view',
        error: dbError instanceof Error ? dbError.message : 'Database error'
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