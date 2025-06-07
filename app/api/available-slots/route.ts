import { NextResponse } from 'next/server';
import { addMinutes, format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { getGoogleCalendarAuth } from '@/lib/google';
import { google } from 'googleapis';
import { withCorsMiddleware } from '@/lib/cors';

// Admin timezone - all slots are calculated in this timezone first
const ADMIN_TIMEZONE = 'Asia/Kolkata'; // IST

async function availableSlotsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const durationParam = searchParams.get('duration');
    const timezone = searchParams.get('timezone') || ADMIN_TIMEZONE;
    
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' }, 
        { status: 400 }
      );
    }
    
    const date = new Date(dateParam);
    const duration = durationParam ? parseInt(durationParam, 10) : 30;
    
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' }, 
        { status: 400 }
      );
    }

    // Get Google Calendar auth
    const auth = await getGoogleCalendarAuth();
    const calendar = google.calendar({ 
      version: 'v3', 
      auth: auth || undefined 
    });
    
    // Get the day in IST timezone - but be explicit about IST regardless of server timezone
    const dateInIST = toZonedTime(date, ADMIN_TIMEZONE);
    const year = dateInIST.getFullYear();
    const month = String(dateInIST.getMonth() + 1).padStart(2, '0');
    const day = String(dateInIST.getDate()).padStart(2, '0');
    
    // Query range: full day in IST - use explicit IST offset
    const istDayStart = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
    const istDayEnd = new Date(`${year}-${month}-${day}T23:59:59+05:30`);
    
    try {
      // Query Google Calendar for busy periods
      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeMin: istDayStart.toISOString(),
          timeMax: istDayEnd.toISOString(),
          items: [{ id: 'primary' }]
        }
      });
      
      // Get busy slots from the response
      const busySlots = freeBusyResponse.data.calendars?.primary?.busy || [];
      
      // Generate 8PM-12AM IST slots for the given date (returned as UTC)
      const allSlots = generateISTTimeSlots(year, month, day, duration);
      
      // Filter out busy slots
      const availableSlots = allSlots.filter(slot => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        
        // Check if this slot overlaps with any busy period
        const isOverlapping = busySlots.some(busySlot => {
          const busyStart = parseISO(busySlot.start || '');
          const busyEnd = parseISO(busySlot.end || '');
          
          return (
            (slotStart.getTime() >= busyStart.getTime() && slotStart.getTime() < busyEnd.getTime()) ||
            (slotEnd.getTime() > busyStart.getTime() && slotEnd.getTime() <= busyEnd.getTime()) ||
            (slotStart.getTime() <= busyStart.getTime() && slotEnd.getTime() >= busyEnd.getTime())
          );
        });
        
        return !isOverlapping;
      });
      
      // Convert slots to user's timezone for display
      const slotsForDisplay = availableSlots.map(slot => {
        const utcStart = new Date(slot.start);
        const utcEnd = new Date(slot.end);
        
        // Convert UTC times to user's timezone for display
        // Don't use toZonedTime - it doesn't convert, it interprets
        // Instead, use the UTC time and format it in the target timezone
        
        return {
          start: utcStart.toISOString(), // Keep UTC time but frontend will display in user timezone
          end: utcEnd.toISOString(),
          adminStart: utcStart.toISOString(), // Keep UTC time for booking
          adminEnd: utcEnd.toISOString(),
          available: true,
          displayTimezone: timezone,
          adminTimezone: ADMIN_TIMEZONE
        };
      });
      
      return NextResponse.json({
        date: format(date, 'yyyy-MM-dd'),
        duration,
        timezone,
        adminTimezone: ADMIN_TIMEZONE,
        availableSlots: slotsForDisplay
      });
      
    } catch (error) {
      console.error('Error querying Google Calendar:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' }, 
      { status: 500 }
    );
  }
}

// Generate time slots for 8PM-12AM IST on a specific date
function generateISTTimeSlots(year: number, month: string, day: string, slotDuration: number) {
  const slots = [];
  
  // Create IST times properly - don't rely on server timezone
  // We need to create a Date that represents 8PM IST, regardless of server timezone
  
  // Method: Create a date string with IST offset and parse it properly
  const istDate = `${year}-${month}-${day}`;
  
  // Create 8PM IST by specifying the time and then converting from IST timezone
  const istStart8PM = new Date(`${istDate}T20:00:00+05:30`); // 8PM IST explicitly
  const istEnd12AM = new Date(`${istDate}T23:59:59+05:30`); // 11:59:59 PM IST explicitly
  
  // Calculate the end of availability window (12AM IST = 4 hours from 8PM)
  const windowEnd = new Date(istStart8PM.getTime() + (4 * 60 * 60 * 1000)); // 4 hours later
  
  const now = new Date(); // Current UTC time
  let current = new Date(istStart8PM.getTime());
  
  while (current.getTime() < windowEnd.getTime()) {
    // Only include future slots
    if (current.getTime() > now.getTime()) {
      const slotEnd = addMinutes(current, slotDuration);
      
      // Only add if slot ends within the window
      if (slotEnd.getTime() <= windowEnd.getTime()) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          available: true
        });
      }
    }
    
    current = addMinutes(current, slotDuration);
  }
  
  return slots;
}

export const GET = withCorsMiddleware(availableSlotsHandler);