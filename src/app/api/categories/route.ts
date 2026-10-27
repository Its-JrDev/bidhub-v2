import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { auctions: true },
        },
      },
    });

    return jsonSuccess(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar categorías';
    return jsonError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: Se requiere rol de administrador.', 403);
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return jsonError('El nombre de la categoría es obligatorio.', 400);
    }

    const cleanName = name.trim();

    const existing = await db.category.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return jsonError('Ya existe una categoría con ese nombre.', 409);
    }

    const category = await db.category.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
      },
    });

    return jsonSuccess(category, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear categoría';
    return jsonError(message, 500);
  }
}
