import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: Se requiere rol de administrador.', 403);
    }

    const { id } = await context.params;
    const body = await request.json();
    const { reason } = body;

    // Rule 15: motivo obligatorio que queda registrado
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return jsonError('Debe indicar un motivo obligatorio de cancelación (mínimo 5 caracteres).', 400);
    }

    const auction = await db.auction.findUnique({
      where: { id },
    });

    if (!auction) {
      return jsonError('Subasta no encontrada.', 404);
    }

    if (auction.status === 'CANCELLED') {
      return jsonError('La subasta ya se encuentra cancelada.', 409);
    }

    // Rule 15 & 16: Cancels auction and saves reason without deleting record
    const updated = await db.auction.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason.trim(),
      },
    });

    return jsonSuccess({
      message: 'Subasta cancelada por moderación administrativa.',
      auction: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al moderar subasta';
    return jsonError(message, 500);
  }
}
