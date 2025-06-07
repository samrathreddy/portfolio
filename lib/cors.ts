import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Configuration and Utilities
 * Provides origin validation and CORS headers for API endpoints
 */

export interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken'
  ],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Get allowed origins from environment variables
 */
function getAllowedOrigins(): string[] {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];

  // Add production frontend URL if set
  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!allowedOrigins.includes(frontendUrl)) {
      allowedOrigins.push(frontendUrl);
    }
  }

  // Add app URL if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!allowedOrigins.includes(appUrl)) {
      allowedOrigins.push(appUrl);
    }
  }
  return allowedOrigins;
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow requests with no origin (like from Postman, curl, etc.) in development
    return process.env.NODE_ENV === 'development';
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a given request
 */
export function getCorsHeaders(request: NextRequest, options: CorsOptions = {}): Record<string, string> {
  const mergedOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
  const origin = request.headers.get('origin');
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': mergedOptions.allowedMethods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': mergedOptions.allowedHeaders?.join(', ') || 'Content-Type, Authorization',
    'Access-Control-Max-Age': String(mergedOptions.maxAge || 86400),
  };

  // Set credentials header
  if (mergedOptions.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Set origin header if origin is allowed
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (!origin && process.env.NODE_ENV === 'development') {
    // Allow no-origin requests in development
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Apply CORS headers to a NextResponse
 */
export function withCors(
  response: NextResponse, 
  request: NextRequest, 
  options: CorsOptions = {}
): NextResponse {
  const corsHeaders = getCorsHeaders(request, options);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflightRequest(request: NextRequest, options: CorsOptions = {}): NextResponse {
  const corsHeaders = getCorsHeaders(request, options);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

/**
 * Validate CORS origin and return appropriate response
 */
export function validateCorsOrigin(request: NextRequest): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get('origin');
  const allowed = isOriginAllowed(origin);
  
  if (!allowed && origin) {
    console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
  }

  return { allowed, origin };
}

/**
 * Create a CORS error response
 */
export function createCorsErrorResponse(origin: string | null): NextResponse {
  const response = NextResponse.json(
    { 
      error: 'CORS Error', 
      message: 'Request blocked by CORS policy',
      origin: origin || 'no-origin'
    },
    { status: 403 }
  );

  // Still add some basic headers for the error response
  response.headers.set('Access-Control-Allow-Origin', 'null');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  return response;
}

/**
 * Middleware wrapper that applies CORS to any API route
 */
export function withCorsMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options: CorsOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request, options);
    }

    // Validate origin
    const { allowed } = validateCorsOrigin(request);
    if (!allowed) {
      return createCorsErrorResponse(request.headers.get('origin'));
    }

    // Call the original handler
    const response = await handler(request);
    
    // Apply CORS headers to the response
    return withCors(response, request, options);
  };
} 