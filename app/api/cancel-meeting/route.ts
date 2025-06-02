import { NextResponse } from 'next/server';
import { getMeetingById, updateMeeting } from '@/lib/db';
import { getGoogleCalendarAuth, deleteGoogleCalendarEvent } from '@/lib/google';
import { sendMeetingCancelledEmail } from '@/lib/email';

// Admin timezone - to be consistent with other APIs
const ADMIN_TIMEZONE = 'Asia/Kolkata'; // IST

// This is a placeholder for the actual implementation
// In a real app, you would:
// 1. Validate the meeting ID and cancellation token
// 2. Delete the event from Google Calendar
// 3. Update the booking status in your database
// 4. Send cancellation emails to all participants

export async function DELETE(request: Request) {
  try {
    return NextResponse.json({
      error: 'Under Development',
    }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    const cancelToken = searchParams.get('token');
    
    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate the meeting exists and the token is correct
    const meeting = await getMeetingById(meetingId!);
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }
    
    if (cancelToken && meeting!.cancelToken !== cancelToken) {
      return NextResponse.json(
        { error: 'Invalid cancellation token' },
        { status: 403 }
      );
    }
    
    // Get the user's timezone from the original booking
    const userTimezone = meeting!.timezone || ADMIN_TIMEZONE;
    
    // Delete the event from Google Calendar
    try {
      await deleteGoogleCalendarEvent(meeting!.eventId);
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      // Continue with cancellation even if Google Calendar deletion fails
    }
    
    // Update the meeting status in the database
    await updateMeeting(meetingId!, { 
      status: 'canceled', 
      canceledAt: new Date().toISOString() 
    });
    
    // Send cancellation email
    try {
      await sendMeetingCancelledEmail(meeting!.email, {
        name: meeting!.name,
        dateTime: meeting!.dateTime,
        duration: meeting!.duration,
        timezone: userTimezone // Include the user's timezone
      });
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      // Continue with response even if email fails
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Meeting successfully canceled',
      timezone: userTimezone
    });
    
  } catch (error) {
    console.error('Error canceling meeting:', error);
    return NextResponse.json(
      { error: 'Failed to cancel meeting' }, 
      { status: 500 }
    );
  }
} 