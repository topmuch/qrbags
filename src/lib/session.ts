import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = 'qrbag_session';

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
  } | null;
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
      lastActivity: new Date(),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

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
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.session.delete({ where: { id: sessionId } }).catch(() => {});
      }
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      agencyId: session.user.agencyId,
      agency: session.user.agency,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Ignore errors
  }
}
