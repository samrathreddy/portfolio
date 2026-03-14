import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Check if OAuth environment variables are set
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;

    // OAuth is configured if we have client credentials AND refresh token
    // Access token is auto-generated from refresh token, no need to store it
    const isConfigured =
      hasClientId &&
      hasClientSecret &&
      hasRefreshToken;
    
    return NextResponse.json({
      isConfigured,
      details: {
        hasClientCredentials: hasClientId && hasClientSecret,
        hasRefreshToken
      }
    });
  } catch (error) {
    console.error('Error checking Google OAuth configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check Google OAuth configuration' },
      { status: 500 }
    );
  }
} 