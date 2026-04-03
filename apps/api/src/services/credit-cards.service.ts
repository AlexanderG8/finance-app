import { prisma } from '../lib/prisma';
import type { CreateCreditCardInput, UpdateCreditCardInput } from '../schemas/credit-cards.schema';

/**
 * Calcula el ciclo de facturación activo y la fecha límite de pago.
 *
 * Ejemplo: cycleStartDay=11, paymentDueDay=5
 *   - Si hoy es 25 Ene → ciclo: 11 Ene – 10 Feb, pago límite: 5 Mar
 *   - Si hoy es 5 Ene  → ciclo: 11 Dic – 10 Ene, pago límite: 5 Feb
 */
function computeCurrentCycle(cycleStartDay: number, paymentDueDay: number) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (currentDay >= cycleStartDay) {
    cycleStart = new Date(currentYear, currentMonth, cycleStartDay);
    // El ciclo termina el día anterior al inicio del mes siguiente
    cycleEnd = new Date(currentYear, currentMonth + 1, cycleStartDay - 1);
  } else {
    cycleStart = new Date(currentYear, currentMonth - 1, cycleStartDay);
    cycleEnd = new Date(currentYear, currentMonth, cycleStartDay - 1);
  }

  // El pago vence en el mes siguiente al cierre del ciclo
  const paymentDueDate = new Date(
    cycleEnd.getFullYear(),
    cycleEnd.getMonth() + 1,
    paymentDueDay,
  );

  const daysUntilPayment = Math.ceil(
    (paymentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return { cycleStart, cycleEnd, paymentDueDate, daysUntilPayment };
}

function formatCard(card: {
  id: string;
  userId: string;
  entityName: string;
  cycleStartDay: number;
  paymentDueDay: number;
  currency: string;
  creditLimit: { toString(): string } | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...card,
    creditLimit: card.creditLimit ? Number(card.creditLimit) : null,
  };
}

export async function listCreditCards(userId: string) {
  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return cards.map(formatCard);
}

export async function createCreditCard(userId: string, input: CreateCreditCardInput) {
  const card = await prisma.creditCard.create({
    data: {
      userId,
      entityName: input.entityName,
      cycleStartDay: input.cycleStartDay,
      paymentDueDay: input.paymentDueDay,
      currency: input.currency,
      creditLimit: input.creditLimit ?? null,
      notes: input.notes ?? null,
    },
  });
  return formatCard(card);
}

export async function getCreditCardById(userId: string, cardId: string) {
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId },
  });

  if (!card) {
    const error = new Error('Tarjeta de crédito no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return formatCard(card);
}

export async function getCurrentCycleSummary(userId: string, cardId: string) {
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId },
  });

  if (!card) {
    const error = new Error('Tarjeta de crédito no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const { cycleStart, cycleEnd, paymentDueDate, daysUntilPayment } = computeCurrentCycle(
    card.cycleStartDay,
    card.paymentDueDay,
  );

  // Gastos registrados con esta tarjeta dentro del ciclo activo
  const expenses = await prisma.expense.findMany({
    where: {
      creditCardId: cardId,
      date: {
        gte: cycleStart,
        lte: new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), cycleEnd.getDate(), 23, 59, 59),
      },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    card: formatCard(card),
    cycleStart: cycleStart.toISOString(),
    cycleEnd: cycleEnd.toISOString(),
    paymentDueDate: paymentDueDate.toISOString(),
    daysUntilPayment,
    totalSpent,
    creditLimit: card.creditLimit ? Number(card.creditLimit) : null,
    usagePercentage:
      card.creditLimit && Number(card.creditLimit) > 0
        ? Math.round((totalSpent / Number(card.creditLimit)) * 100)
        : null,
    expenses: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
  };
}

export async function updateCreditCard(
  userId: string,
  cardId: string,
  input: UpdateCreditCardInput,
) {
  const existing = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });

  if (!existing) {
    const error = new Error('Tarjeta de crédito no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const card = await prisma.creditCard.update({
    where: { id: cardId },
    data: {
      ...(input.entityName !== undefined ? { entityName: input.entityName } : {}),
      ...(input.cycleStartDay !== undefined ? { cycleStartDay: input.cycleStartDay } : {}),
      ...(input.paymentDueDay !== undefined ? { paymentDueDay: input.paymentDueDay } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
    },
  });

  return formatCard(card);
}

export async function deleteCreditCard(userId: string, cardId: string): Promise<void> {
  const existing = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });

  if (!existing) {
    const error = new Error('Tarjeta de crédito no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.creditCard.delete({ where: { id: cardId } });
}
