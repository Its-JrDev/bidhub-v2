import { type NextRequest } from 'next/server';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return jsonError('No autenticado', 401);
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return jsonError('Usuario no encontrado', 404);
  }

  return jsonSuccess(user);
}
