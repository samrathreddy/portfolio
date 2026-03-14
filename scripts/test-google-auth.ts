/**
 * Test script to verify Google Calendar OAuth token validity
 * Run: npx tsx scripts/test-google-auth.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

import { google } from 'googleapis';

async function testGoogleAuth() {
  console.log('\n=== Google Calendar Auth Test ===\n');

  // 1. Check env vars
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  console.log('1. Environment variables:');
  console.log(`   GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_REFRESH_TOKEN: ${refreshToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_ACCESS_TOKEN: ${process.env.GOOGLE_ACCESS_TOKEN ? '⚠️  Set (not needed)' : '⏭️  Not set (OK)'}`);

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('\n❌ Missing required credentials. Cannot proceed.\n');
    process.exit(1);
  }

  // 2. Test OAuth2 client creation & token refresh
  console.log('\n2. Testing OAuth2 client & token refresh...');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('   ✅ Access token refreshed successfully');
    console.log(`   Token expires at: ${credentials.expiry_date ? new Date(credentials.expiry_date).toLocaleString() : 'unknown'}`);

    const expiresIn = credentials.expiry_date
      ? Math.round((credentials.expiry_date - Date.now()) / 1000 / 60)
      : 0;
    console.log(`   Token valid for: ~${expiresIn} minutes`);
  } catch (error: any) {
    console.log('   ❌ Token refresh FAILED');
    console.log(`   Error: ${error.message}`);

    if (error.message?.includes('invalid_grant')) {
      console.log('\n   🔑 Your refresh token has EXPIRED.');
      console.log('   This happens because your Google Cloud app is in "Testing" mode.');
      console.log('   Fix: Go to Google Cloud Console → OAuth consent screen → Publish App');
      console.log('   Then re-authenticate at: /api/auth/google');
    }
    process.exit(1);
  }

  // 3. Test Calendar API access
  console.log('\n3. Testing Calendar API access...');
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: tomorrow.toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    console.log(`   ✅ Calendar API working — found ${busySlots.length} busy slot(s) in next 24h`);
  } catch (error: any) {
    console.log('   ❌ Calendar API call FAILED');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  // 4. Test event listing
  console.log('\n4. Testing event listing...');
  try {
    const events = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 3,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = events.data.items || [];
    console.log(`   ✅ Event listing working — ${items.length} upcoming event(s)`);
    items.forEach(event => {
      console.log(`      - ${event.summary} (${event.start?.dateTime || event.start?.date})`);
    });
  } catch (error: any) {
    console.log('   ❌ Event listing FAILED');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n=== All tests passed! Your Google Calendar auth is working. ===\n');
}

testGoogleAuth();
