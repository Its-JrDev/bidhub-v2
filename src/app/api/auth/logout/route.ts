import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { clearAuthCookies, REFRESH_COOKIE_NAME } from '@/shared/utils/auth-cookies';
import { verifyRefreshToken } from '@/shared/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    let userId = session?.userId;

    if (!userId) {
      const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
      if (refreshToken) {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload) userId = payload.userId;
      }
    }

    if (userId) {
      await db.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }).catch(() => null);
    }

    const res = jsonSuccess({ message: 'Sesión cerrada con éxito.' });
    return clearAuthCookies(res);
  } catch {
    const res = jsonSuccess({ message: 'Sesión cerrada.' });
    return clearAuthCookies(res);
  }
}
