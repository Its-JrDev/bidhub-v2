import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { computeAuctionStatus, checkSniperExtension } from '@/shared/utils/auction-rules';
import { maskBidder } from '@/shared/utils/format';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession(request);

    const bids = await db.bid.findMany({
      where: { auctionId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        bidder: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const masked = bids.map((b) => ({
      id: b.id,
      amount: b.amount,
      createdAt: b.createdAt,
      bidderName: session?.userId === b.bidderId ? `${b.bidder.name} (Tú)` : maskBidder(b.bidder.name, b.bidder.email),
      isOwnBid: session?.userId === b.bidderId,
    }));

    return jsonSuccess(masked);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar ofertas';
    return jsonError(message, 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session) {
      return jsonError('Debe iniciar sesión para ofertar en una subasta.', 401);
    }

    const { id } = await context.params;
    const body = await request.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return jsonError('El monto de la oferta debe ser un número válido mayor a cero.', 400);
    }

    // Atomic transaction for bidding rules & concurrency
    const result = await db.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
          },
        },
      });

      if (!auction) {
        throw new Error('NOT_FOUND:Subasta no encontrada.');
      }

      // Rule 6: Un usuario no puede ofertar en su propia subasta
      if (auction.sellerId === session.userId) {
        throw new Error('FORBIDDEN:No puedes ofertar en tu propia subasta.');
      }

      // Rule 7: Solo se puede ofertar en una subasta activa
      const now = new Date();
      const status = computeAuctionStatus(auction, now);
      if (status !== 'ACTIVE') {
        throw new Error('CONFLICT:La subasta no está activa o ya ha cerrado.');
      }

      const highestBid = auction.bids[0];

      // Rule 9: El usuario con la oferta más alta no puede volver a ofertar
      if (highestBid && highestBid.bidderId === session.userId) {
        throw new Error('CONFLICT:Ya tienes la oferta más alta en esta subasta.');
      }

      // Rule 8: Primera oferta >= startingPrice; siguientes >= currentPrice + minIncrement
      if (!highestBid) {
        if (amount < auction.startingPrice) {
          throw new Error(`CONFLICT:La primera oferta debe ser mayor o igual al precio inicial ($${auction.startingPrice}).`);
        }
      } else {
        const minAllowed = highestBid.amount + auction.minIncrement;
        if (amount < minAllowed) {
          throw new Error(`CONFLICT:La oferta debe ser mayor o igual a $${minAllowed} (oferta actual + incremento mínimo).`);
        }
      }

      // Rule 11: Anti-sniper extension (si faltan 5 min o menos, extender 5 min)
      const extensionDate = checkSniperExtension(auction.endsAt, now);

      // Create bid
      const newBid = await tx.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          bidderId: session.userId,
        },
      });

      // Update auction current price and endsAt if extended
      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          winnerId: session.userId,
          ...(extensionDate ? { endsAt: extensionDate } : {}),
        },
      });

      return {
        bid: newBid,
        currentPrice: updatedAuction.currentPrice,
        endsAt: updatedAuction.endsAt,
        extended: Boolean(extensionDate),
      };
    });

    return jsonSuccess(result, 201);
  } catch (error: any) {
    const rawMsg = error.message || '';
    if (rawMsg.startsWith('NOT_FOUND:')) {
      return jsonError(rawMsg.replace('NOT_FOUND:', ''), 404);
    }
    if (rawMsg.startsWith('FORBIDDEN:')) {
      return jsonError(rawMsg.replace('FORBIDDEN:', ''), 403);
    }
    if (rawMsg.startsWith('CONFLICT:')) {
      return jsonError(rawMsg.replace('CONFLICT:', ''), 409);
    }
    return jsonError(rawMsg || 'Error al procesar la oferta.', 500);
  }
}
