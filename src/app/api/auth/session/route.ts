import { NextResponse } from 'next/server';

// Simple session check - no NextAuth required
export async function GET() {
  try {
    // Return not authenticated - the login API handles authentication
    // The session is managed client-side after successful login
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
