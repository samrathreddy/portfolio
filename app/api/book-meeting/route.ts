import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import { getGoogleCalendarAuth, createGoogleCalendarEvent } from '@/lib/google';
import { createMeeting, addMeetingMetadata } from '@/lib/db';
import { sendMeetingConfirmationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import type { Meeting } from '@/lib/db';
import { toZonedTime } from 'date-fns-tz';

// Admin timezone - to be consistent with available-slots API
const ADMIN_TIMEZONE = 'Asia/Kolkata'; // IST

// Generate secure tokens for rescheduling and cancellation
function generateSecureToken() {
  return crypto.randomBytes(16).toString('hex');
}

// This is a placeholder for the actual implementation
// 1. Connect to Google Calendar API
// 2. Create a new event with conferenceData for Google Meet
// 3. Save booking to database
// 4. Send confirmation emails

// Important: When booking from the UI, the dateTime parameter is already
// the adminStart time from the available slots API, so we don't need to convert
// it to admin timezone. It's already in admin timezone (IST).

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, purpose, dateTime, duration, timezone = ADMIN_TIMEZONE } = body;
    
    // Validate required fields
    if (!name || !email || !dateTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if(duration!=15 && duration != 30 && duration != 60) {
      return NextResponse.json(
        { error: 'Duration must be 15, 30 or 60 minutes' }, 
        { status: 400 }
      );
    }
    
    // Generate unique booking ID and security tokens
    const bookingId = uuidv4();
    const rescheduleToken = generateSecureToken();
    const cancelToken = generateSecureToken();
    
    // Collect metadata
    const IPaddress = request.headers.get('x-forwarded-for') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Unknown';
    
    // Parse start time from user's timezone - this is already in admin timezone
    // because we're using the adminStart value from the available slots API
    const userStartTime = new Date(dateTime);
    
    // Calculate end time in user's timezone
    const userEndTime = addMinutes(userStartTime, duration);
    
    // Store original timezone info for reference
    const userTimezone = timezone;
    
    try {
      // Create a Google Calendar event with Meet link
      // When using adminStart from available slots, we're already in admin timezone
      const createdEvent = await createGoogleCalendarEvent({
        summary: `Discussion: ${name} & ${process.env.OWNER_NAME}`,
        description: purpose 
          ? `Purpose: ${purpose}\nBooked in timezone: ${userTimezone}` 
          : `Scheduled meeting\nBooked in timezone: ${userTimezone}`,
        startTime: userStartTime, 
        endTime: userEndTime,
        attendees: [{ email }, { email: process.env.EMAIL_ADDRESS }],
        id: bookingId,
        timezone: ADMIN_TIMEZONE // Always use admin timezone for Google Calendar
      });
      
      const meetLink = createdEvent.hangoutLink || '';
      const eventId = createdEvent.id || '';
      
      // Generate calendar add link
      const calendarLink = `https://calendar.google.com/calendar/event?eid=${eventId}`;
      
      // Create base URL for the application
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      
      // Create links for rescheduling and cancellation
      const rescheduleLink = `${baseUrl}/meet/reschedule?id=${bookingId}&token=${rescheduleToken}`;
      const cancelLink = `${baseUrl}/meet/cancel?id=${bookingId}&token=${cancelToken}`;
      
      // Store meeting in database - keep user's original time and timezone
      const meeting: Meeting = {
        id: bookingId,
        name,
        email,
        purpose,
        dateTime: userStartTime.toISOString(),
        duration,
        eventId,
        meetLink,
        rescheduleToken,
        cancelToken,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        timezone: userTimezone, // Store user's timezone
        adminDateTime: userStartTime.toISOString() // adminStart is already in admin timezone
      };
      
      // Create the meeting in the database
      await createMeeting(meeting);
      
      // Add metadata separately to avoid cluttering the main meeting object
      await addMeetingMetadata(bookingId, {
        ipAddress: IPaddress,
        userAgent,
        referer,
        bookingSource: 'website',
        bookingTimestamp: new Date().toISOString()
      });
      
      // Send confirmation email with time in user's timezone
      await sendMeetingConfirmationEmail(email, {
        id: bookingId,
        name,
        dateTime: userStartTime.toISOString(),
        duration,
        purpose,
        meetLink,
        calendarLink,
        rescheduleLink,
        cancelLink,
        timezone: userTimezone // Include user's timezone
      });
      
      // Return success response with meeting details
      return NextResponse.json({
        success: true,
        meetingId: bookingId,
        meetLink,
        calendarLink,
        rescheduleLink,
        cancelLink,
        timezone: userTimezone,
        dateTime: userStartTime.toISOString() // Return user time
      });
      
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      
      throw new Error('Failed to create event in Google Calendar');
    }
    
  } catch (error) {
    console.error('Error booking meeting:', error);
    return NextResponse.json(
      { error: 'Failed to schedule meet. Please reach out to ' + process.env.EMAIL_ADDRESS }, 
      { status: 500 }
    );
  }
} 