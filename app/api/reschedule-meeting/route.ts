import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import { getMeetingById, updateMeeting } from '@/lib/db';
import { getGoogleCalendarAuth, updateGoogleCalendarEvent } from '@/lib/google';
import { sendMeetingRescheduledEmail } from '@/lib/email';
import { toZonedTime } from 'date-fns-tz';

// Admin timezone - to be consistent with available-slots API
const ADMIN_TIMEZONE = 'Asia/Kolkata'; // IST

// This is a placeholder for the actual implementation
// In a real app, you would:
// 1. Validate the meeting ID and reschedule token
// 2. Update the event in Google Calendar
// 3. Update the booking in your database
// 4. Send updated confirmation emails

// Important: When rescheduling from the UI, the newDateTime parameter is already
// the adminStart time from the available slots API, so we don't need to convert
// it to admin timezone. It's already in admin timezone (IST).

export async function PATCH(request: Request) {
  try {
    return NextResponse.json({
      error: 'Under Development',
    }, { status: 500 });
    const body = await request.json();
    const { meetingId, newDateTime, token } = body;
    
    if (!meetingId || !newDateTime) {
      return NextResponse.json(
        { error: 'Meeting ID and new date/time are required' }, 
        { status: 400 }
      );
    }
    
    // Validate the meeting exists and the token is correct
    const meeting = await getMeetingById(meetingId);
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }
    
    if (token && meeting!.rescheduleToken !== token) {
      return NextResponse.json(
        { error: 'Invalid reschedule token' },
        { status: 403 }
      );
    }
    
    // Parse the new date time - this is already the adminStart time from available slots
    const userStartTime = new Date(newDateTime);
    const userEndTime = addMinutes(userStartTime, meeting!.duration);
    
    // Get the user's timezone from the original booking
    const userTimezone = meeting!.timezone || ADMIN_TIMEZONE;
    
    // Update the event in Google Calendar (already in admin timezone)
    try {
      const updatedEvent = await updateGoogleCalendarEvent(meeting!.eventId, {
        startTime: userStartTime,
        endTime: userEndTime,
        timezone: ADMIN_TIMEZONE // Always use admin timezone for Google Calendar
      });
      
      // Update the meeting in the database
      const updatedMeeting = await updateMeeting(meetingId, {
        dateTime: userStartTime.toISOString(), // Store user time
        adminDateTime: userStartTime.toISOString(), // Already admin time
        status: 'rescheduled',
        updatedAt: new Date().toISOString()
      });
      
      // Send rescheduled email notification (with user's timezone)
      await sendMeetingRescheduledEmail(meeting!.email, {
        id: meeting!.id,
        name: meeting!.name,
        dateTime: userStartTime.toISOString(), // Send in user's timezone
        duration: meeting!.duration,
        purpose: meeting!.purpose,
        meetLink: meeting!.meetLink,
        calendarLink: `https://calendar.google.com/calendar/event?eid=${meeting!.eventId}`,
        rescheduleLink: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/meet/reschedule?id=${meeting!.id}&token=${meeting!.rescheduleToken}`,
        cancelLink: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/meet/cancel?id=${meeting!.id}&token=${meeting!.cancelToken}`,
        timezone: userTimezone // Include user's timezone
      });
      
      // Return success response
      return NextResponse.json({
        success: true,
        meetingId,
        newDateTime: userStartTime.toISOString(),
        meetLink: meeting!.meetLink,
        message: 'Meeting successfully rescheduled',
        timezone: userTimezone
      });
      
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      
      // For development, provide a fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data in development mode due to Google Calendar API error');
        
        return NextResponse.json({
          success: true,
          meetingId,
          newDateTime,
          meetLink: meeting!.meetLink,
          message: 'Meeting successfully rescheduled (mock response)',
          note: 'Using mock data due to Google Calendar API error',
          timezone: userTimezone
        });
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('Error rescheduling meeting:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule meeting' }, 
      { status: 500 }
    );
  }
} 