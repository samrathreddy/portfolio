import { NextResponse } from 'next/server';
import { listMeetings } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter options
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    
    // Build filter object
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (email) filter.email = email;
    
    // Authorize this endpoint (in a real app, you'd check authentication)
    // For a production app, this endpoint should be protected
    // This is just for demo purposes
    
    // Get all meetings with applied filters
    const meetings = await listMeetings(filter);
    
    // Remove sensitive information from meetings
    const secureMeetings = meetings.map(meeting => {
      const { rescheduleToken, cancelToken, ...securedMeeting } = meeting;
      return securedMeeting;
    });
    
    return NextResponse.json({
      success: true,
      count: secureMeetings.length,
      meetings: secureMeetings
    });
    
  } catch (error) {
    console.error('Error listing meetings:', error);
    return NextResponse.json(
      { error: 'Failed to list meetings' },
      { status: 500 }
    );
  }
} 