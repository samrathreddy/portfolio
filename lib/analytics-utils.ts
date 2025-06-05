// Analytics utility functions

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface GeolocationData {
  country: string;
  city: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  org: string;
  postal: string;
  countryCode: string;
}

/**
 * Parse user agent string to extract browser, OS, and device information
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edge')) {
    browser = 'Edge';
    const match = ua.match(/edge\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  }
  
  // OS detection
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android (\d+\.\d+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  }
  
  // Device detection
  let device = 'Unknown';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'mobile';
    device = ua.includes('iphone') ? 'iPhone' : 
             ua.includes('android') ? 'Android Device' : 'Mobile Device';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
    device = ua.includes('ipad') ? 'iPad' : 'Tablet';
  } else {
    deviceType = 'desktop';
    device = 'Desktop';
  }
  
  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    deviceType
  };
}

/**
 * Get geolocation data from ipinfo.io API
 */
export async function getGeolocationData(ip: string): Promise<GeolocationData | null> {
  try {
    // Skip localhost/private IPs
    if (ip === '127.0.0.1' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null;
    }
    
    const response = await fetch(`https://ipinfo.io/${ip}/json`);
    
    if (!response.ok) {
      console.error('Failed to fetch geolocation data:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Parse location string (e.g., "37.7749,-122.4194")
    const [latitude, longitude] = data.loc ? data.loc.split(',').map(Number) : [0, 0];
    
    return {
      country: data.country || '',
      city: data.city || '',
      region: data.region || '',
      timezone: data.timezone || '',
      latitude: latitude || 0,
      longitude: longitude || 0,
      org: data.org || '',
      postal: data.postal || '',
      countryCode: data.country || ''
    };
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    return null;
  }
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 