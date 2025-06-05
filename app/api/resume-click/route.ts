import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ResumeViewModel from '@/lib/models/ResumeView';
import { parseUserAgent, getGeolocationData, generateSessionId } from '@/lib/analytics-utils';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Get referrer
    const referrer = request.headers.get('referer');
    
    // Parse user agent for detailed analytics
    const parsedUA = parseUserAgent(userAgent);
    
    // Get geolocation data
    const geoData = await getGeolocationData(ip.trim());
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Prepare data for storage
    const resumeViewData = {
      ip: ip.trim(),
      userAgent,
      referrer,
      createdAt: new Date(),
      downloaded: false,
      sessionId,
      
      // Enhanced user agent data
      browser: parsedUA.browser,
      browserVersion: parsedUA.browserVersion,
      os: parsedUA.os,
      osVersion: parsedUA.osVersion,
      device: parsedUA.device,
      deviceType: parsedUA.deviceType,
      
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
    
    // Save the click data
    const resumeView = await ResumeViewModel.create(resumeViewData);
    
    return NextResponse.json({ 
      success: true, 
      sessionId,
      message: 'Resume view tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking resume click:', error);
    return NextResponse.json({ 
      error: 'Failed to track resume click',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 