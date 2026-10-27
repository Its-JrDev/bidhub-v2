import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken } from '@/shared/utils/jwt';
import { REFRESH_COOKIE_NAME, setAuthCookies, clearAuthCookies } from '@/shared/utils/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return jsonError('Refresh token no encontrado.', 401);
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload || !payload.userId) {
      const res = jsonError('Refresh token inválido o expirado.', 401);
      return clearAuthCookies(res);
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshTokenHash) {
      const res = jsonError('Sesión revocada o usuario inexistente.', 401);
      return clearAuthCookies(res);
    }

    // Verify hash matches
    const expectedHash = hashToken(refreshToken);
    if (user.refreshTokenHash !== expectedHash) {
      const res = jsonError('Token inválido o reemplazado.', 401);
      return clearAuthCookies(res);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const newAccessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);

    await db.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashToken(newRefreshToken) },
    });

    const res = jsonSuccess({ message: 'Token renovado con éxito.' });
    return setAuthCookies(res, newAccessToken, newRefreshToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al renovar sesión';
    return jsonError(message, 500);
  }
}
