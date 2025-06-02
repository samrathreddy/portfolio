/**
 * Google Calendar integration utilities
 * 
 * OAuth 2.0 implementation for personal Gmail calendar access
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Type for our auth return to handle different authentication methods
type GoogleAuthResult = 
  | string 
  | OAuth2Client 
  | null;

/**
 * Get authenticated Google Calendar client
 * @returns Google Auth client
 */
export async function getGoogleCalendarAuth(): Promise<GoogleAuthResult> {
  try {
    // Create OAuth2 client using environment variables
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
      );
      
      // If access token and refresh token are available in environment variables
      if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
        // Set credentials on the client
        oauth2Client.setCredentials({
          access_token: process.env.GOOGLE_ACCESS_TOKEN,
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
          expiry_date: process.env.GOOGLE_TOKEN_EXPIRY ? parseInt(process.env.GOOGLE_TOKEN_EXPIRY) : undefined
        });
        
        // Token refresh logic happens automatically if token is expired
        
        return oauth2Client;
      } else {
        console.warn('OAuth tokens not found. Complete OAuth flow at /api/auth/google first.');
      }
    }
    
    // For development without credentials, return null that will be handled by the fallback logic in API routes
    if (process.env.NODE_ENV === 'development') {
      console.warn('No Google Calendar credentials found, using fallback mock implementation');
      return null;
    }
    
    throw new Error('Google Calendar OAuth credentials not properly configured');
    
  } catch (error) {
    console.error('Error setting up Google Calendar auth:', error);
    throw new Error('Failed to set up Google Calendar authentication');
  }
}

/**
 * Get Google Calendar client
 * @returns Google Calendar API client
 */
async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const auth = await getGoogleCalendarAuth();
  return google.calendar({ version: 'v3', auth: auth || undefined });
}

/**
 * Create a Google Calendar event with Google Meet link
 * Automatically sends invitation emails to all attendees
 * @param eventDetails Event details
 * @returns Created event with Meet link
 */
export async function createGoogleCalendarEvent(eventDetails: {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: { email: string }[];
  id?: string;
  timezone?: string;
}) {
  try {
    const calendar = await getCalendarClient();
    
    // Default to IST timezone if not specified
    const timeZone = eventDetails.timezone || 'Asia/Kolkata';
    
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: timeZone,
      },
      attendees: eventDetails.attendees,
      conferenceData: {
        createRequest: {
          requestId: eventDetails.id || Date.now().toString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Automatically send invitation emails to all guests
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    
    throw error;
  }
}

/**
 * Update a Google Calendar event
 * Automatically sends notification emails to all attendees about the changes
 * @param eventId ID of the event to update
 * @param eventDetails Updated event details
 * @returns Updated event
 */
export async function updateGoogleCalendarEvent(eventId: string, eventDetails: {
  summary?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  attendees?: { email: string }[];
  timezone?: string;
}) {
  try {
    const calendar = await getCalendarClient();
    
    const requestBody: any = {};
    
    if (eventDetails.summary) requestBody.summary = eventDetails.summary;
    if (eventDetails.description) requestBody.description = eventDetails.description;
    
    // Default to IST timezone if not specified
    const timeZone = eventDetails.timezone || 'Asia/Kolkata';
    
    if (eventDetails.startTime) {
      requestBody.start = {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: timeZone,
      };
    }
    
    if (eventDetails.endTime) {
      requestBody.end = {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: timeZone,
      };
    }
    
    if (eventDetails.attendees) requestBody.attendees = eventDetails.attendees;
    
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody,
      sendUpdates: 'all', // Send notifications to all attendees
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    
    
    throw error;
  }
}

/**
 * Delete a Google Calendar event
 * Automatically sends cancellation emails to all attendees
 * @param eventId ID of the event to delete
 */
export async function deleteGoogleCalendarEvent(eventId: string) {
  try {
    const calendar = await getCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Send notifications to all attendees
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    
    
    throw error;
  }
}

/**
 * Get free/busy information from Google Calendar
 * @param timeMin Start time
 * @param timeMax End time
 * @returns Array of busy time slots
 */
export async function getGoogleCalendarFreeBusy(timeMin: Date, timeMax: Date) {
  try {
    const calendar = await getCalendarClient();
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: 'primary' }],
      },
    });
    
    // Ensure we're getting busy slots from primary calendar
    const busySlots = response.data.calendars?.primary?.busy || [];
    console.log('Busy slots from calendar:', busySlots);
    
    return busySlots;
  } catch (error) {
    console.error('Error getting free/busy information:', error);
    
    // For development, return empty array
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    throw error;
  }
}

/**
 * Generate a Google Calendar add event link
 * @param title Event title
 * @param description Event description
 * @param startTime Start time (ISO string)
 * @param endTime End time (ISO string)
 * @param location Optional location (or Meet link)
 * @returns URL to add event to Google Calendar
 */
export function generateGoogleCalendarLink(
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  location: string = ''
) {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${formatCalendarTime(startTime)}/${formatCalendarTime(endTime)}`,
    ...(location && { location }),
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Format a date for Google Calendar URL
 * @param isoString ISO date string
 * @returns Formatted date string for Google Calendar URL
 */
function formatCalendarTime(isoString: string) {
  const date = new Date(isoString);
  return date.toISOString().replace(/-|:|\.\d+/g, '');
} 