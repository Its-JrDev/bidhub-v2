import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { signAccessToken, signRefreshToken, hashToken } from '@/shared/utils/jwt';
import { setAuthCookies } from '@/shared/utils/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError('Debe proporcionar correo y contraseña.', 400);
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return jsonError('Credenciales incorrectas.', 401);
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      return jsonError('Credenciales incorrectas.', 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Save hashed refresh token in database (Requirement 7)
    await db.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashToken(refreshToken) },
    });

    const res = jsonSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return setAuthCookies(res, accessToken, refreshToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al procesar inicio de sesión';
    return jsonError(message, 500);
  }
}
