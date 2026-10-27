import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { computeAuctionStatus } from '@/shared/utils/auction-rules';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return jsonError('No autenticado.', 401);
    }

    // Rule 20: Listado completo de sus propias ofertas
    const bids = await db.bid.findMany({
      where: { bidderId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            category: true,
            bids: {
              select: { amount: true },
            },
          },
        },
      },
    });

    const now = new Date();
    const formatted = bids.map((b) => {
      const computedStatus = computeAuctionStatus(b.auction, now);
      const isHighestBid = b.auction.currentPrice === b.amount;
      const isWinning = computedStatus === 'CLOSED' && isHighestBid;

      return {
        id: b.id,
        amount: b.amount,
        createdAt: b.createdAt,
        isHighestBid,
        isWinning,
        auction: {
          id: b.auction.id,
          title: b.auction.title,
          currentPrice: b.auction.currentPrice,
          status: computedStatus,
          endsAt: b.auction.endsAt,
          categoryName: b.auction.category.name,
        },
      };
    });

    return jsonSuccess(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener ofertas';
    return jsonError(message, 500);
  }
}
