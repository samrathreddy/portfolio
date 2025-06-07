import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import MeetViewModel from '@/lib/models/MeetView';
import { parseUserAgent, getGeolocationData, generateSessionId } from '@/lib/analytics-utils';
import { withCorsMiddleware } from '@/lib/cors';

async function meetTrackingHandler(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get request body
    const body = await request.json().catch(() => ({}));
    const { 
      sessionId, 
      action, 
      step, 
      duration, 
      timezone, 
      meetingScheduled = false,
      selectedDuration,
      selectedTimezone 
    } = body;
    
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';
    
    const cleanIP = ip.trim();
    
    // Get user agent and referrer
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer');
    
    console.log('Meet tracking attempt:', { 
      sessionId, 
      action,
      step,
      cleanIP, 
      userAgent: userAgent.substring(0, 50) + '...'
    });
    
    // Handle different tracking actions
    if (action === 'page_view') {
      // Create or update page view record
      let existingView = null;
      
      // Try to find existing view by sessionId first
      if (sessionId) {
        existingView = await MeetViewModel.findOne({ sessionId }).sort({ createdAt: -1 });
      }
      
      // If no sessionId or no existing view found, try to find by IP and recent timestamp
      if (!existingView) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existingView = await MeetViewModel.findOne({
          ip: cleanIP,
          createdAt: { $gte: fiveMinutesAgo }
        }).sort({ createdAt: -1 });
      }
      
      if (existingView) {
        // Update existing view
        await MeetViewModel.findByIdAndUpdate(existingView._id, {
          sessionId: sessionId || existingView.sessionId,
          viewDuration: duration || existingView.viewDuration
        });
        
        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          viewId: existingView._id 
        });
      } else {
        // Create new view record
        const newSessionId = sessionId || generateSessionId();
        
        // Parse user agent for device info
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get geolocation data
        const geoData = await getGeolocationData(cleanIP);
        
        const newView = new MeetViewModel({
          ip: cleanIP,
          userAgent,
          referrer,
          sessionId: newSessionId,
          viewDuration: duration || 0,
          meetingScheduled: false,
          ...deviceInfo,
          ...geoData
        });
        
        await newView.save();
        
        return NextResponse.json({ 
          success: true, 
          action: 'created',
          viewId: newView._id,
          sessionId: newSessionId
        });
      }
    }
    
    if (action === 'step_completion') {
      // Update step completion tracking
      let existingView = null;
      
      if (sessionId) {
        existingView = await MeetViewModel.findOne({ sessionId }).sort({ createdAt: -1 });
      }
      
      if (!existingView) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existingView = await MeetViewModel.findOne({
          ip: cleanIP,
          createdAt: { $gte: fiveMinutesAgo }
        }).sort({ createdAt: -1 });
      }
      
      if (existingView) {
        const updateData: any = {};
        
        if (step === 1) {
          updateData.step1Completed = true;
          updateData.$inc = { timeSlotClicks: 1 };
          if (selectedDuration) updateData.selectedDuration = selectedDuration;
          if (selectedTimezone) updateData.selectedTimezone = selectedTimezone;
        } else if (step === 2) {
          updateData.step2Completed = true;
        } else if (step === 3) {
          updateData.step3Reached = true;
          updateData.meetingScheduled = meetingScheduled;
          if (meetingScheduled) {
            updateData.scheduledAt = new Date();
            updateData.scheduleMethod = 'form';
          }
        }
        
        await MeetViewModel.findByIdAndUpdate(existingView._id, updateData);
        
        return NextResponse.json({ 
          success: true, 
          action: 'step_updated',
          step,
          viewId: existingView._id 
        });
      }
    }
    
    if (action === 'interaction') {
      // Track specific interactions like timezone changes, date changes, etc.
      let existingView = null;
      
      if (sessionId) {
        existingView = await MeetViewModel.findOne({ sessionId }).sort({ createdAt: -1 });
      }
      
      if (!existingView) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existingView = await MeetViewModel.findOne({
          ip: cleanIP,
          createdAt: { $gte: fiveMinutesAgo }
        }).sort({ createdAt: -1 });
      }
      
      if (existingView) {
        const updateData: any = {};
        
        if (body.interactionType === 'timezone_change') {
          updateData.$inc = { timezoneChanges: 1 };
          updateData.selectedTimezone = selectedTimezone;
        } else if (body.interactionType === 'date_change') {
          updateData.$inc = { dateChanges: 1 };
        } else if (body.interactionType === 'duration_change') {
          updateData.$inc = { durationChanges: 1 };
          updateData.selectedDuration = selectedDuration;
        } else if (body.interactionType === 'time_slot_click') {
          updateData.$inc = { timeSlotClicks: 1 };
        }
        
        await MeetViewModel.findByIdAndUpdate(existingView._id, updateData);
        
        return NextResponse.json({ 
          success: true, 
          action: 'interaction_tracked',
          interactionType: body.interactionType,
          viewId: existingView._id 
        });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action or no matching view found' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error tracking meet analytics:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to track analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the handler with CORS middleware
export const POST = withCorsMiddleware(meetTrackingHandler);