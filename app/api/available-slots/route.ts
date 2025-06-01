import { NextResponse } from 'next/server';
import { startOfDay, endOfDay, addMinutes, format, isAfter, parseISO, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getGoogleCalendarAuth } from '@/lib/google';
import { google } from 'googleapis';

// Admin timezone - all slots are calculated in this timezone first
const ADMIN_TIMEZONE = process.env.ADMIN_TIMEZONE || 'Asia/Kolkata'; // IST

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const durationParam = searchParams.get('duration');
    const timezone = searchParams.get('timezone') || ADMIN_TIMEZONE; // Default to IST if not provided
    
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
    
    // Set up time boundaries for the query (start and end of the selected day)
    // Convert the requested date to admin timezone for calendar query
    const timeMin = startOfDay(toZonedTime(date, ADMIN_TIMEZONE));
    const timeMax = endOfDay(toZonedTime(date, ADMIN_TIMEZONE));
    
    try {
      // Query Google Calendar for busy periods (in admin timezone)
      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }]
        }
      });
      
      // Get busy slots from the response
      const busySlots = freeBusyResponse.data.calendars?.primary?.busy || [];
      
      // Generate all possible time slots for the day in ADMIN TIMEZONE
      const allSlotsInAdminTz = generateTimeSlots(toZonedTime(date, ADMIN_TIMEZONE), duration);
      
      // Filter out busy slots (still in admin timezone)
      const availableSlotsInAdminTz = allSlotsInAdminTz.filter(slot => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        
        // Check if this slot overlaps with any busy period
        const isOverlapping = busySlots.some(busySlot => {
          const busyStart = parseISO(busySlot.start || '');
          const busyEnd = parseISO(busySlot.end || '');
          
          // Check for overlap - a slot overlaps with a busy period if:
          // 1. The slot starts during the busy period, OR
          // 2. The slot ends during the busy period, OR
          // 3. The slot completely contains the busy period
          return (
            // Slot start is within busy period
            (isAfter(slotStart, busyStart) && isBefore(slotStart, busyEnd)) ||
            // Slot start is exactly at busy start
            slotStart.getTime() === busyStart.getTime() ||
            // Slot end is within busy period
            (isAfter(slotEnd, busyStart) && isBefore(slotEnd, busyEnd)) ||
            // Slot end is exactly at busy end
            slotEnd.getTime() === busyEnd.getTime() ||
            // Slot completely contains the busy period
            (isBefore(slotStart, busyStart) && isAfter(slotEnd, busyEnd))
          );
        });
        
        // Only include non-overlapping slots
        return !isOverlapping;
      });
      
      // Convert available slots to requested timezone for display
      // BUT keep the original IST times for actual booking
      const slotsForDisplay = availableSlotsInAdminTz.map(slot => {
        const adminStartTime = new Date(slot.start);
        const adminEndTime = new Date(slot.end);
        
        // Only convert times if requested timezone is different from admin timezone
        if (timezone !== ADMIN_TIMEZONE) {
          const displayStartTime = toZonedTime(adminStartTime, timezone);
          const displayEndTime = toZonedTime(adminEndTime, timezone);
          
          return {
            // Display times in requested timezone
            start: displayStartTime.toISOString(),
            end: displayEndTime.toISOString(),
            // Original admin timezone times for booking - keep as ISO strings
            adminStart: adminStartTime.toISOString(),
            adminEnd: adminEndTime.toISOString(),
            adminStartIST: adminStartTime.toLocaleString('en-US', { timeZone: process.env.ADMIN_TIMEZONE }),
            adminEndIST: adminEndTime.toLocaleString('en-US', { timeZone: process.env.ADMIN_TIMEZONE }),
            available: true,
            displayTimezone: timezone,
            adminTimezone: ADMIN_TIMEZONE
          };
        }
        
        // If admin timezone is requested, just use the original times
        return {
          start: adminStartTime.toISOString(),
          end: adminEndTime.toISOString(),
          adminStart: adminStartTime.toISOString(),
          adminEnd: adminEndTime.toISOString(),
          available: true,
          displayTimezone: ADMIN_TIMEZONE,
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
      
      // Fall back to fake data if there's an error (for development)
        
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

// Helper function to generate all possible time slots for a day
function generateTimeSlots(date: Date, slotDuration: number) {
  const slots = [];
  const now = new Date();
  
  // Ensure we're working with IST timezone for the availability window
  const istDate = toZonedTime(date, ADMIN_TIMEZONE);
  const dayStart = startOfDay(istDate);
  
  // Availability window: 8PM to 12AM IST
  const windowStart = new Date(dayStart);
  windowStart.setHours(20, 0, 0, 0); // Start at 8 PM IST
  
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(0, 0, 0, 0); // End at 12 AM (midnight) IST
  windowEnd.setDate(windowEnd.getDate() + 1); // Move to next day
  
  // Convert current time to IST for comparison
  const nowInIST = toZonedTime(now, ADMIN_TIMEZONE);
  
  // Use the provided duration as the increment
  const slotIncrement = slotDuration; // minutes
  
  // Generate slots for the window (8PM to 12AM IST)
  let current = new Date(windowStart);
  while (current < windowEnd) {
    // Only include future slots (compare in IST)
    if (isAfter(current, nowInIST)) {
      const slotEnd = addMinutes(current, slotDuration);
      
      // Only add slot if it ends before or at the end time
      if (slotEnd <= windowEnd) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          available: true
        });
      }
    }
    
    // Move to next slot using the provided duration
    current = addMinutes(current, slotIncrement);
  }
  
  return slots;
}

// Fallback function for development/testing
function generateFakeAvailableSlots(date: Date, duration: number) {
  const slots = [];
  const now = new Date();
  
  // Ensure we're working with IST timezone for the availability window
  const istDate = toZonedTime(date, ADMIN_TIMEZONE);
  const dayStart = startOfDay(istDate);
  
  // Availability window: 8PM to 12AM IST
  const windowStart = new Date(dayStart);
  windowStart.setHours(20, 0, 0, 0); // Start at 8 PM IST
  
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(0, 0, 0, 0); // End at 12 AM (midnight) IST
  windowEnd.setDate(windowEnd.getDate() + 1); // Move to next day
  
  // Convert current time to IST for comparison
  const nowInIST = toZonedTime(now, ADMIN_TIMEZONE);
  
  // Generate slots for the window (8PM to 12AM IST)
  let current = new Date(windowStart);
  while (current < windowEnd) {
    // Only include future slots (compare in IST)
    if (isAfter(current, nowInIST)) {
      // Randomly mark some slots as unavailable (for demo purposes)
      const available = Math.random() > 0.3;
      
      if (available) {
        const slotEnd = addMinutes(current, duration);
        
        // Only add slot if it ends before or at the end time
        if (slotEnd <= windowEnd) {
          slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            available: true
          });
        }
      }
    }
    
    // Add the selected duration to current time
    current = addMinutes(current, duration);
  }
  
  return slots;
}