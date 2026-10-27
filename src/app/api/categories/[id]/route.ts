import { type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/shared/utils/api-response';
import { getSession } from '@/shared/utils/session';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: Se requiere rol de administrador.', 403);
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return jsonError('El nombre de la categoría es obligatorio.', 400);
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return jsonSuccess(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar categoría';
    return jsonError(message, 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'ADMIN') {
      return jsonError('Acceso denegado: Se requiere rol de administrador.', 403);
    }

    const { id } = await context.params;

    // Rule 17: "Una categoría con subastas asociadas no se puede eliminar."
    const count = await db.auction.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      return jsonError('No se puede eliminar una categoría que tiene subastas asociadas.', 409);
    }

    await db.category.delete({
      where: { id },
    });

    return jsonSuccess({ message: 'Categoría eliminada con éxito.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar categoría';
    return jsonError(message, 500);
  }
}
