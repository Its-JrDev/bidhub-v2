import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';
import { computeAuctionStatus, validateAuctionDuration } from '@/shared/utils/auction-rules';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const statusFilter = searchParams.get('status')?.toUpperCase();
    const search = searchParams.get('search')?.toLowerCase().trim();
    const sellerId = searchParams.get('sellerId');

    const where: Record<string, unknown> = {};

    if (sellerId === 'me') {
      const session = await getSession(request);
      if (session) {
        where.sellerId = session.userId;
      }
    } else if (sellerId) {
      where.sellerId = sellerId;
    }

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const rawAuctions = await db.auction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true },
        },
        bids: {
          select: { id: true, amount: true },
        },
      },
    });

    const now = new Date();

    // Map auctions with real-time computed status (Rule 12 & 13)
    const formatted = rawAuctions.map((a) => {
      const computedStatus = computeAuctionStatus(a, now);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        imageUrl: a.imageUrl,
        startingPrice: a.startingPrice,
        currentPrice: a.currentPrice,
        minIncrement: a.minIncrement,
        status: computedStatus,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        category: a.category,
        seller: a.seller,
        bidsCount: a.bids.length,
        createdAt: a.createdAt,
      };
    });

    // Apply real-time status filter if requested
    const filtered = statusFilter
      ? formatted.filter((a) => a.status === statusFilter)
      : formatted;

    return jsonSuccess(filtered);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar subastas';
    return jsonError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return jsonError('Debe iniciar sesión para publicar una subasta.', 401);
    }

    const body = await request.json();
    const { title, description, imageUrl, startingPrice, minIncrement, endsAt, categoryId } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return jsonError('El título de la subasta es obligatorio.', 400);
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return jsonError('La descripción es obligatoria.', 400);
    }

    const numStartingPrice = Number(startingPrice);
    const numMinIncrement = Number(minIncrement);

    // Rule 1: Precio inicial > 0, incremento mínimo > 0
    if (isNaN(numStartingPrice) || numStartingPrice <= 0) {
      return jsonError('El precio inicial debe ser un número mayor a cero.', 400);
    }

    if (isNaN(numMinIncrement) || numMinIncrement <= 0) {
      return jsonError('El incremento mínimo debe ser un número mayor a cero.', 400);
    }

    // Rule 2: Fecha de cierre entre 1 hora y 7 días
    const durationCheck = validateAuctionDuration(endsAt);
    if (!durationCheck.valid) {
      return jsonError(durationCheck.error || 'Fecha de cierre no permitida.', 400);
    }

    // Rule 3: Cada subasta pertenece a una categoría existente
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return jsonError('La categoría seleccionada no existe.', 400);
    }

    // Rule 4: Máximo 5 subastas activas al mismo tiempo como vendedor
    const now = new Date();
    const activeAuctions = await db.auction.findMany({
      where: {
        sellerId: session.userId,
        status: 'ACTIVE',
        endsAt: { gt: now },
      },
    });

    if (activeAuctions.length >= 5) {
      return jsonError('Límite alcanzado: Un usuario puede tener un máximo de 5 subastas activas al mismo tiempo.', 409);
    }

    const auction = await db.auction.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
        startingPrice: numStartingPrice,
        currentPrice: numStartingPrice,
        minIncrement: numMinIncrement,
        endsAt: new Date(endsAt),
        categoryId,
        sellerId: session.userId,
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
    });

    return jsonSuccess(auction, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear subasta';
    return jsonError(message, 500);
  }
}
