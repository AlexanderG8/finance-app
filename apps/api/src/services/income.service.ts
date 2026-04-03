import { prisma } from '../lib/prisma';
import type { CreateIncomeInput, UpdateIncomeInput, IncomeQueryInput } from '../schemas/income.schema';

export async function listIncomes(userId: string, query: IncomeQueryInput) {
  const { month, year, source, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(month && year
      ? {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        }
      : {}),
    ...(source ? { source } : {}),
  };

  const [incomes, total] = await Promise.all([
    prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.income.count({ where }),
  ]);

  return {
    data: incomes.map((i) => ({ ...i, amount: Number(i.amount) })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createIncome(userId: string, input: CreateIncomeInput) {
  const income = await prisma.income.create({
    data: {
      userId,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      source: input.source,
      paymentMethod: input.paymentMethod,
      date: new Date(input.date),
      isRecurring: input.isRecurring,
      notes: input.notes,
    },
  });

  return { ...income, amount: Number(income.amount) };
}

export async function getIncomeById(userId: string, incomeId: string) {
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId } });

  if (!income) {
    const error = new Error('Ingreso no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return { ...income, amount: Number(income.amount) };
}

export async function updateIncome(userId: string, incomeId: string, input: UpdateIncomeInput) {
  const existing = await prisma.income.findFirst({ where: { id: incomeId, userId } });

  if (!existing) {
    const error = new Error('Ingreso no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const income = await prisma.income.update({
    where: { id: incomeId },
    data: {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      ...(input.isRecurring !== undefined ? { isRecurring: input.isRecurring } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return { ...income, amount: Number(income.amount) };
}

export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  const existing = await prisma.income.findFirst({ where: { id: incomeId, userId } });

  if (!existing) {
    const error = new Error('Ingreso no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.income.delete({ where: { id: incomeId } });
}

export async function getGlobalIncomeSummary(userId: string) {
  const incomes = await prisma.income.findMany({ where: { userId } });

  const totalAmount = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const bySource: Record<string, { source: string; total: number; count: number }> = {};
  for (const income of incomes) {
    const key = income.source;
    if (!bySource[key]) {
      bySource[key] = { source: key, total: 0, count: 0 };
    }
    bySource[key]!.total += Number(income.amount);
    bySource[key]!.count += 1;
  }

  return {
    totalAmount,
    bySource: Object.values(bySource),
  };
}

export async function getMonthlyIncomeSummary(userId: string, month: number, year: number) {
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });

  const totalAmount = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const bySource: Record<string, { source: string; total: number; count: number }> = {};
  for (const income of incomes) {
    const key = income.source;
    if (!bySource[key]) {
      bySource[key] = { source: key, total: 0, count: 0 };
    }
    bySource[key]!.total += Number(income.amount);
    bySource[key]!.count += 1;
  }

  return {
    month,
    year,
    totalAmount,
    bySource: Object.values(bySource),
  };
}
