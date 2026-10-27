import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { computeAuctionStatus } from '@/shared/utils/auction-rules';
import { maskBidder } from '@/shared/utils/format';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const auction = await db.auction.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, email: true },
        },
        winner: {
          select: { id: true, name: true },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!auction) {
      return jsonError('Subasta no encontrada.', 404);
    }

    const now = new Date();
    const computedStatus = computeAuctionStatus(auction, now);

    // Rule 18: Mask bidder identities in public bid history
    const session = await getSession(request);
    const maskedBids = auction.bids.map((bid) => {
      const isMyBid = session?.userId === bid.bidderId;
      return {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        bidderName: isMyBid ? `${bid.bidder.name} (Tú)` : maskBidder(bid.bidder.name, bid.bidder.email),
        isOwnBid: isMyBid,
      };
    });

    return jsonSuccess({
      ...auction,
      status: computedStatus,
      bids: maskedBids,
      bidsCount: auction.bids.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener subasta';
    return jsonError(message, 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session) {
      return jsonError('No autenticado.', 401);
    }

    const { id } = await context.params;
    const auction = await db.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      return jsonError('Subasta no encontrada.', 404);
    }

    // Rule 19: Usuario no puede editar subastas de otro usuario
    if (auction.sellerId !== session.userId && session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: No eres el vendedor de esta subasta.', 403);
    }

    // Rule 5: Solo mientras no tenga ofertas y esté activa
    const status = computeAuctionStatus(auction, new Date());
    if (status !== 'ACTIVE') {
      return jsonError('No se puede editar una subasta que no esté activa.', 409);
    }

    if (auction.bids.length > 0) {
      return jsonError('No se puede editar una subasta que ya ha recibido ofertas.', 409);
    }

    const body = await request.json();
    const { title, description, imageUrl, startingPrice, minIncrement, categoryId } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (title) dataToUpdate.title = title.trim();
    if (description) dataToUpdate.description = description.trim();
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl?.trim() || null;
    if (startingPrice && Number(startingPrice) > 0) {
      dataToUpdate.startingPrice = Number(startingPrice);
      dataToUpdate.currentPrice = Number(startingPrice);
    }
    if (minIncrement && Number(minIncrement) > 0) {
      dataToUpdate.minIncrement = Number(minIncrement);
    }
    if (categoryId) dataToUpdate.categoryId = categoryId;

    const updated = await db.auction.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });

    return jsonSuccess(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar subasta';
    return jsonError(message, 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session) {
      return jsonError('No autenticado.', 401);
    }

    const { id } = await context.params;
    const auction = await db.auction.findUnique({
      where: { id },
      include: { bids: true },
    });

    if (!auction) {
      return jsonError('Subasta no encontrada.', 404);
    }

    // Rule 19: Un usuario no puede cancelar subastas de otro usuario
    if (auction.sellerId !== session.userId && session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: No tienes permisos para cancelar esta subasta.', 403);
    }

    // Rule 14: El vendedor puede cancelar su subasta únicamente si no tiene ofertas
    if (auction.bids.length > 0 && session.role !== 'ADMIN') {
      return jsonError('No puedes cancelar una subasta que ya tiene ofertas.', 409);
    }

    // Rule 16: Una subasta cancelada no se elimina, se conserva con su historial
    const cancelled = await db.auction.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Cancelada por el vendedor.',
      },
    });

    return jsonSuccess({ message: 'Subasta cancelada con éxito.', auction: cancelled });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cancelar subasta';
    return jsonError(message, 500);
  }
}
