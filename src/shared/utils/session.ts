import type { NextRequest } from 'next/server';
import { verifyAccessToken, type TokenPayload } from './jwt';
import { ACCESS_COOKIE_NAME } from './auth-cookies';

export async function getSession(request: NextRequest): Promise<TokenPayload | null> {
  const token =
    request.cookies.get(ACCESS_COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return null;
  return await verifyAccessToken(token);
}
