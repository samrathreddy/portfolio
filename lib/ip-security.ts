// IP Security function
export function isAllowedIP(request: Request): boolean {
    // Get allowed IPs from environment variables
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
    
    if (allowedIPs.length === 0) {
      console.warn('No admin IPs configured. Access denied.');
      return false;
    }
    
    // Get client IP from various possible headers (works with Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    // Try to get the most accurate client IP
    let clientIP = forwarded?.split(',')[0].trim() || realIP || cfConnectingIP;
    
    // For local development, fallback to localhost variants
    if (!clientIP || clientIP === '::1' || clientIP === '127.0.0.1') {
      clientIP = '127.0.0.1'; // Normalize localhost
    }
    
    console.log(`Admin API access attempt from IP: ${clientIP}`);
    console.log(`Allowed IPs: ${allowedIPs.join(', ')}`);
    
    // Check if client IP matches any allowed IP
    const isAllowed = allowedIPs.some(allowedIP => {
      // Support for CIDR notation could be added here
      return allowedIP === clientIP || 
             (allowedIP === 'localhost' && (clientIP === '127.0.0.1' || clientIP === '::1'));
    });
    
    if (!isAllowed) {
      console.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
    }
    
    return isAllowed;
  }