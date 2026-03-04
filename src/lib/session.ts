import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { User } from '@prisma/client';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = 'qrbag_session';

// User with agency info for the session
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

/**
 * Create a new session for a user
 * Sets an HTTP-only cookie with the session ID
 */
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  // Create session in database
  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
    },
  });
  
  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return session.id;
}

/**
 * Get the current session from the cookie
 * Returns the user if session is valid, null otherwise
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionId) {
      return null;
    }
    
    // Find session with user data
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            agency: {
              select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                address: true,
              },
            },
          },
        },
      },
    });
    
    // Session not found
    if (!session) {
      // Clear invalid cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
    
    // Session expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.session.delete({ where: { id: sessionId } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
    
    // Return user data
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      agencyId: session.user.agencyId,
      agency: session.user.agency,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete the current session
 * Removes the session from database and clears the cookie
 */
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionId) {
      // Delete from database
      await db.session.delete({ where: { id: sessionId } }).catch(() => {
        // Ignore if session doesn't exist
      });
    }
    
    // Clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Extend the current session expiration
 */
export async function extendSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionId) {
      return false;
    }
    
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    
    // Update session expiration
    await db.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiresAt },
    });
    
    // Update cookie expiration
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newExpiresAt,
      path: '/',
    });
    
    return true;
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
}

/**
 * Clean up expired sessions (can be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Server-side function to require authentication
 * Redirects to login if not authenticated
 * Returns the user if authenticated
 */
export async function requireAuth(allowedRole?: 'superadmin' | 'agency'): Promise<SessionUser> {
  const user = await getSession();
  
  if (!user) {
    const loginPath = allowedRole === 'superadmin' ? '/admin/connexion' : '/agence/connexion';
    throw new Error(`REDIRECT:${loginPath}`);
  }
  
  if (allowedRole && user.role !== allowedRole) {
    // User has wrong role, redirect to their correct area
    if (user.role === 'superadmin') {
      throw new Error('REDIRECT:/admin/tableau-de-bord');
    } else {
      throw new Error('REDIRECT:/agence/tableau-de-bord');
    }
  }
  
  return user;
}
