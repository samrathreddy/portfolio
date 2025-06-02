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

// Handle OAuth callback
export async function GET(request: Request) {
  try {
    // Get the URL object from the request
    const { searchParams } = new URL(request.url);
    
    // Get the authorization code from the URL
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      );
    }
    
    // Create OAuth client
    const oauth2Client = getOAuthClient();
    
    // Exchange authorization code for access tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('Tokens received:', JSON.stringify(tokens, null, 2));
    
    // Check if we have all the required tokens
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'No access token received from Google' },
        { status: 400 }
      );
    }
    
    // Show a page with tokens that need to be saved to environment variables
    return new NextResponse(`
      <html>
        <head>
          <title>OAuth Success</title>
          <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
          <meta http-equiv="Pragma" content="no-cache">
          <meta http-equiv="Expires" content="0">
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
            .token-section { margin-bottom: 20px; }
            .debug { background: #ffe; padding: 10px; margin: 20px 0; border: 1px solid #ddd; }
            .warning { background: #ffebee; border: 1px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <h3>⚠️ Security Warning</h3>
            <p>This page contains sensitive authentication tokens. Do not share this URL or leave this page open in a public environment.</p>
          </div>
          <h1>OAuth Authentication Successful!</h1>
          <p>Add these tokens to your environment variables:</p>
          
          <div class="token-section">
            <h2>Access Token (expires in ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'unknown'}):</h2>
            <pre>${tokens.access_token}</pre>
          </div>
          
          <div class="token-section">
            <h2>Refresh Token (save permanently):</h2>
            <pre>${tokens.refresh_token || 'No refresh token received. Try revoking access at https://myaccount.google.com/permissions and starting again with prompt=consent'}</pre>
          </div>
          
          <h2>Environment Variables to Add:</h2>
          <p>Add these to your .env file or hosting platform:</p>
          <pre>
GOOGLE_ACCESS_TOKEN=${tokens.access_token}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || ''}
GOOGLE_TOKEN_EXPIRY=${tokens.expiry_date || ''}
          </pre>
          
          <div class="debug">
            <h3>Debug Information (All Tokens):</h3>
            <pre>${JSON.stringify(tokens, null, 2)}</pre>
          </div>
          
          <p><strong>Important:</strong> The refresh token is needed to maintain long-term access to the calendar. 
          Store it securely and never expose it publicly.</p>
          
          <p><strong>Note:</strong> If you don't see a refresh token, you need to:</p>
          <ol>
            <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
            <li>Find this app and click "Remove Access"</li>
            <li>Start the authorization process again</li>
          </ol>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
    
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to handle Google OAuth callback', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 