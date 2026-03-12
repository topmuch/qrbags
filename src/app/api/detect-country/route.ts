import { NextRequest, NextResponse } from 'next/server';

interface IPApiResponse {
  country_code?: string;
  country?: string;
  error?: boolean;
  reason?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers (works behind proxies)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    // Extract the first IP if there are multiple
    let clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || '';

    // For localhost development, use a test IP
    if (!clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.')) {
      // Return a default country for development
      return NextResponse.json({
        countryCode: 'FR',
        country: 'France',
        ip: 'localhost',
        isDevelopment: true
      });
    }

    // Use ipapi.co for geolocation (free tier: 1000 requests/month)
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('IP API request failed');
    }

    const data: IPApiResponse = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP API error');
    }

    return NextResponse.json({
      countryCode: data.country_code || 'FR',
      country: data.country || 'Unknown',
      ip: clientIp
    });

  } catch (error) {
    console.error('Country detection error:', error);

    // Return default French on error
    return NextResponse.json({
      countryCode: 'FR',
      country: 'France',
      ip: 'unknown',
      error: true
    });
  }
}
