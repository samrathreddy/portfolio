import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ResumeViewModel from '@/lib/models/ResumeView';
import { parseUserAgent, getGeolocationData, generateSessionId } from '@/lib/analytics-utils';
import { withCorsMiddleware } from '@/lib/cors';

async function resumeDownloadHandler(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get request body for additional data
    const body = await request.json().catch(() => ({}));
    const { sessionId, downloadMethod = 'button' } = body;
    
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    
    const cleanIP = ip.trim();
    
    // Get user agent and referrer for fallback record
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer');
    
    console.log('Download tracking attempt:', { 
      sessionId, 
      cleanIP, 
      downloadMethod,
      userAgent: userAgent.substring(0, 50) + '...'
    });
    
    // Try to find and update existing view record
    let updatedView = null;
    
    // First try with sessionId if provided
    if (sessionId) {
      updatedView = await ResumeViewModel.findOneAndUpdate(
        { sessionId },
        { 
          downloaded: true,
          downloadedAt: new Date(),
          downloadMethod
        },
        { 
          sort: { createdAt: -1 },
          new: true
        }
      );
      console.log('SessionID match result:', !!updatedView);
    }
    
    // If no sessionId match, try IP-based matching (with multiple IP formats for localhost)
    if (!updatedView) {
      const ipVariations = [
        cleanIP,
        cleanIP === '::1' ? '127.0.0.1' : '::1', // Handle localhost variations
        'localhost'
      ];
      
      for (const ipVar of ipVariations) {
        updatedView = await ResumeViewModel.findOneAndUpdate(
          { 
            ip: ipVar,
            downloaded: false // Only update records that haven't been downloaded yet
          },
          { 
            downloaded: true,
            downloadedAt: new Date(),
            downloadMethod
          },
          { 
            sort: { createdAt: -1 },
            new: true
          }
        );
        
        if (updatedView) {
          console.log(`IP match found with variation: ${ipVar}`);
          break;
        }
      }
    }
    
    // If still no match found, create a new download record as fallback
    if (!updatedView) {
      console.log('No existing view found, creating new download record');
      
      // Parse user agent for enhanced data
      const parsedUA = parseUserAgent(userAgent);
      
      // Get geolocation data
      const geoData = await getGeolocationData(cleanIP);
      
      // Create new download record
      const downloadRecord = {
        ip: cleanIP,
        userAgent,
        referrer,
        createdAt: new Date(),
        downloaded: true,
        downloadedAt: new Date(),
        downloadMethod,
        sessionId: sessionId || generateSessionId(),
        
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
      
      updatedView = await ResumeViewModel.create(downloadRecord);
      console.log('Created new download record:', updatedView._id);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Download tracked successfully',
      downloadTracked: !!updatedView,
      recordId: updatedView?._id,
      method: updatedView ? (updatedView.sessionId === sessionId ? 'sessionUpdate' : 'ipUpdate') : 'newRecord'
    });
  } catch (error) {
    console.error('Error tracking resume download:', error);
    return NextResponse.json({ 
      error: 'Failed to track resume download',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 

export const POST = withCorsMiddleware(resumeDownloadHandler);