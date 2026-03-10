import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = '__volteryde_session';
const isProd = process.env.NODE_ENV === 'production';

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
    ...(isProd && { domain: '.volteryde.org' }),
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, error: 'No session' }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ authenticated: false, error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    return NextResponse.json({
      authenticated: true,
      token,
      user: {
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: (payload.roles as string[]) ?? [],
        organizationId: (payload.organizationId as string) ?? null,
        emailVerified: (payload.emailVerified as boolean) ?? true,
      },
    });
  } catch {
    // Signature invalid or token expired — clear the cookie
    const res = NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 });
    res.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
    return res;
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
  return res;
}
