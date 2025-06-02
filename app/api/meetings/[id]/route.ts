import { NextResponse } from 'next/server';
import { getMeetingById } from '@/lib/db';
import { isAllowedIP } from '@/lib/ip-security';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check IP authorization first
  if (!isAllowedIP(request)) {
    return NextResponse.json(
      { error: 'Access denied: IP not authorized' },
      { status: 403 }
    );
  }
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }
    
    const meeting = await getMeetingById(id);
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }
    
    // For security, remove tokens from the public response
    const { rescheduleToken, cancelToken, ...securedMeeting } = meeting;
    
    return NextResponse.json({
      success: true,
      meeting: securedMeeting
    });
    
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check IP authorization first
  if (!isAllowedIP(request)) {
    return NextResponse.json(
      { error: 'Access denied: IP not authorized' },
      { status: 403 }
    );
  }

  try {
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 403 }
      );
    }
    
    const meeting = await getMeetingById(id);
    
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }
    
    // Verify the cancellation token
    if (meeting.cancelToken !== token) {
      return NextResponse.json(
        { error: 'Invalid cancellation token' },
        { status: 403 }
      );
    }
    
    // In a real implementation, you would:
    // 1. Cancel the Google Calendar event
    // 2. Update the meeting status in the database
    // 3. Send a cancellation email
    
    return NextResponse.json({
      success: true,
      message: 'Meeting cancellation initiated'
    });
    
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { error: 'Failed to cancel meeting' },
      { status: 500 }
    );
  }
} 