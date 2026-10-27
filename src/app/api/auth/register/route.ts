import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { signAccessToken, signRefreshToken, hashToken } from '@/shared/utils/jwt';
import { setAuthCookies } from '@/shared/utils/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return jsonError('El nombre debe tener al menos 2 caracteres.', 400);
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonError('Correo electrónico inválido.', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return jsonError('La contraseña debe tener al menos 6 caracteres.', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return jsonError('El correo electrónico ya se encuentra registrado.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'USER',
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Save hashed refresh token
    await db.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashToken(refreshToken) },
    });

    const res = jsonSuccess(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      201
    );

    return setAuthCookies(res, accessToken, refreshToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return jsonError(message, 500);
  }
}
