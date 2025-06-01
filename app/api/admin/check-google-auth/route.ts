import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Check if OAuth environment variables are set
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasAccessToken = !!process.env.GOOGLE_ACCESS_TOKEN;
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;
    
    // OAuth is configured if we have client credentials AND tokens
    const isConfigured = 
      hasClientId && 
      hasClientSecret && 
      hasAccessToken && 
      hasRefreshToken;
    
    return NextResponse.json({
      isConfigured,
      details: {
        hasClientCredentials: hasClientId && hasClientSecret,
        hasTokens: hasAccessToken && hasRefreshToken
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