import { NextRequest, NextResponse } from 'next/server';
import { isOriginAllowed, getCorsHeaders, createCorsErrorResponse } from '@/lib/cors';

export function middleware(request: NextRequest) {
  // Only apply CORS to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const corsHeaders = getCorsHeaders(request);
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }
    
    // Allow no-origin requests (direct browser navigation, e.g. OAuth redirects)
    // These are safe because they can't be CSRF — browsers always send Origin on cross-origin fetches
    if (!origin) {
      return NextResponse.next();
    }

    // Validate origin for cross-origin requests
    if (!isOriginAllowed(origin)) {
      console.warn(`CORS Middleware: Blocked request from unauthorized origin: ${origin || 'no-origin'}`);
      return createCorsErrorResponse(origin);
    }
    
    // For allowed origins, continue with the request
    // The individual API routes will add their own CORS headers
    console.log(`CORS Middleware: Allowed request from origin: ${origin || 'no-origin'}`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - Static files (_next/static, images, favicon.ico, etc.)
     * - API routes that should be publicly accessible (add exceptions here if needed)
     */
    '/api/:path*',
  ],
}; 