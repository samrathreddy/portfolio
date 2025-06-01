import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Create OAuth client
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );
}

// Start OAuth flow
export async function GET(request: Request) {
  try {
    const oauth2Client = getOAuthClient();
    
    // Generate URL for Google's OAuth 2.0 server
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // This will return a refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent', // Force to get refresh token every time
      include_granted_scopes: true // Include any previously granted scopes
    });
    
    console.log('Redirecting to Google OAuth URL:', authUrl);
    
    // Redirect to Google's OAuth 2.0 server
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth flow', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 