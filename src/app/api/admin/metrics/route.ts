import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: Se requiere rol de administrador.', 403);
    }

    const [totalUsers, totalAuctions, totalBids, totalCategories, auctions] = await Promise.all([
      db.user.count(),
      db.auction.count(),
      db.bid.count(),
      db.category.count(),
      db.auction.findMany({
        select: { status: true, endsAt: true },
      }),
    ]);

    const now = new Date();
    let active = 0;
    let closed = 0;
    let deserted = 0;
    let cancelled = 0;

    for (const a of auctions) {
      if (a.status === 'CANCELLED') cancelled++;
      else if (new Date(a.endsAt) > now) active++;
      else closed++;
    }

    return jsonSuccess({
      totalUsers,
      totalAuctions,
      totalBids,
      totalCategories,
      breakdown: {
        active,
        closed,
        deserted,
        cancelled,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener métricas';
    return jsonError(message, 500);
  }
}
