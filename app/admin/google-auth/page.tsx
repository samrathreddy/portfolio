'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GoogleAuthPage() {
  const [hasOAuth, setHasOAuth] = useState(false);
  const [envChecked, setEnvChecked] = useState(false);
  const [redirectUri, setRedirectUri] = useState('[Your site URL]/api/auth/google/callback');
  
  // Client-side check if environment variables exist
  // This is just for UI display, the actual values are not accessible
  useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/auth/google/callback`);
    
    const checkEnvVars = async () => {
      try {
        const response = await fetch('/api/admin/check-google-auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasOAuth(data.isConfigured);
        }
      } catch (error) {
        console.error('Error checking OAuth status:', error);
      } finally {
        setEnvChecked(true);
      }
    };
    
    checkEnvVars();
  }, []);
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Google Calendar OAuth Setup</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Current Status</h2>
        
        {!envChecked ? (
          <p className="text-gray-600">Checking OAuth configuration...</p>
        ) : hasOAuth ? (
          <div className="mb-4">
            <p className="text-green-600 font-medium mb-2">✅ Google Calendar OAuth is configured</p>
            <p className="text-gray-600">
              Your application is authorized to access your Google Calendar. You can now use the booking system.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-amber-600 font-medium mb-2">⚠️ Google Calendar OAuth is not configured</p>
            <p className="text-gray-600">
              Follow the steps below to authorize your application to access your Google Calendar.
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Setup Instructions</h2>
        
        <ol className="list-decimal pl-5 space-y-3 mb-6 text-gray-700">
          <li>
            <p>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></p>
          </li>
          <li>
            <p>Create a new project or select an existing one</p>
          </li>
          <li>
            <p>Enable the Google Calendar API for your project</p>
          </li>
          <li>
            <p>Create OAuth 2.0 Client ID credentials</p>
          </li>
          <li>
            <p>Add the following redirect URI: <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-300">{redirectUri}</code></p>
          </li>
          <li>
            <p>Add the client ID and client secret to your environment variables:</p>
            <pre className="bg-gray-100 p-3 rounded my-2 overflow-x-auto text-gray-800 border border-gray-300">
              GOOGLE_CLIENT_ID=your_client_id_here<br/>
              GOOGLE_CLIENT_SECRET=your_client_secret_here<br/>
              GOOGLE_REDIRECT_URI={redirectUri}
            </pre>
          </li>
          <li>
            <p>Restart your application after adding the environment variables</p>
          </li>
          <li>
            <p>Click the button below to start the OAuth flow</p>
          </li>
        </ol>
        
        <div className="flex justify-center">
          <Link 
            href="/api/auth/google"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition"
          >
            Authorize Google Calendar Access
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">After Authorization</h2>
        <p className="text-gray-600 mb-4">
          After completing the OAuth flow, you will receive a refresh token and an access token.
          Add these tokens to your environment variables:
        </p>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-gray-800 border border-gray-300">
          GOOGLE_ACCESS_TOKEN=your_access_token_here<br/>
          GOOGLE_REFRESH_TOKEN=your_refresh_token_here<br/>
          GOOGLE_TOKEN_EXPIRY=expiry_timestamp_here
        </pre>
        <p className="text-gray-600 mt-4">
          The refresh token is long-lived and can be used to obtain new access tokens when they expire.
          Store it securely in your environment variables.
        </p>
      </div>
    </div>
  );
} 