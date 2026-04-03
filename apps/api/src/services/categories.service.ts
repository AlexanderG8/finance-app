import { prisma } from '../lib/prisma';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/categories.schema';

function notFound(msg = 'Categoría no encontrada.'): Error & { statusCode: number } {
  const error = new Error(msg) as Error & { statusCode: number };
  error.statusCode = 404;
  return error;
}

function forbidden(msg = 'No tienes permiso para modificar esta categoría.'): Error & { statusCode: number } {
  const error = new Error(msg) as Error & { statusCode: number };
  error.statusCode = 403;
  return error;
}

function withIsUserCategory<T extends { userId: string | null }>(cat: T) {
  return { ...cat, isUserCategory: cat.userId !== null };
}

/** Retorna categorías del sistema (userId=null) + categorías propias del usuario */
export async function listCategories(userId: string) {
  const cats = await prisma.expenseCategory.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    orderBy: [{ userId: 'asc' }, { name: 'asc' }],
  });
  return cats.map(withIsUserCategory);
}

export async function createUserCategory(userId: string, input: CreateCategoryInput) {
  const cat = await prisma.expenseCategory.create({
    data: { userId, name: input.name, emoji: input.emoji, color: input.color },
  });
  return withIsUserCategory(cat);
}

export async function updateUserCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
) {
  const existing = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });

  if (!existing) throw notFound();
  if (existing.userId === null) throw forbidden('Las categorías del sistema no se pueden editar.');
  if (existing.userId !== userId) throw forbidden();

  const cat = await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });
  return withIsUserCategory(cat);
}

export async function deleteUserCategory(userId: string, categoryId: string): Promise<void> {
  const existing = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });

  if (!existing) throw notFound();
  if (existing.userId === null) throw forbidden('Las categorías del sistema no se pueden eliminar.');
  if (existing.userId !== userId) throw forbidden();

  await prisma.expenseCategory.delete({ where: { id: categoryId } });
}
