import { prisma } from '../lib/prisma';
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseQueryInput, CreateBudgetInput } from '../schemas/expenses.schema';

interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
}

interface SummaryItem {
  category: { id: string; name: string; emoji: string; color: string };
  total: number;
  count: number;
}

export async function listExpenses(userId: string, query: ExpenseQueryInput) {
  const { month, year, categoryId, paymentMethod, page, limit } = query;
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
    ...(categoryId ? { categoryId } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      date: new Date(input.date),
      isRecurring: input.isRecurring,
      notes: input.notes,
    },
    include: { category: true },
  });

  return { ...expense, amount: Number(expense.amount) };
}

export async function getExpenseById(userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
    include: { category: true },
  });

  if (!expense) {
    const error = new Error('Gasto no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return { ...expense, amount: Number(expense.amount) };
}

export async function updateExpense(userId: string, expenseId: string, input: UpdateExpenseInput) {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!existing) {
    const error = new Error('Gasto no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      ...(input.isRecurring !== undefined ? { isRecurring: input.isRecurring } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: { category: true },
  });

  return { ...expense, amount: Number(expense.amount) };
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!existing) {
    const error = new Error('Gasto no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.expense.delete({ where: { id: expenseId } });
}

export async function getMonthlySummary(userId: string, month: number, year: number) {
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    include: { category: true },
  });

  const summary: Record<string, SummaryItem> = {};

  for (const expense of expenses) {
    const key = expense.categoryId;
    if (!summary[key]) {
      const cat: CategoryData = expense.category;
      summary[key] = {
        category: { id: cat.id, name: cat.name, emoji: cat.emoji, color: cat.color },
        total: 0,
        count: 0,
      };
    }
    summary[key]!.total += Number(expense.amount);
    summary[key]!.count += 1;
  }

  const totalAmount = expenses.reduce((sum: number, e) => sum + Number(e.amount), 0);

  return {
    month,
    year,
    totalAmount,
    byCategory: Object.values(summary),
  };
}

export async function listCategories() {
  return prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function listBudgets(userId: string, month: number, year: number) {
  return prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });
}

export async function upsertBudget(userId: string, input: CreateBudgetInput) {
  return prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: input.categoryId,
        month: input.month,
        year: input.year,
      },
    },
    update: { amount: input.amount, currency: input.currency },
    create: {
      userId,
      categoryId: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      month: input.month,
      year: input.year,
    },
    include: { category: true },
  });
}

export async function getBudgetComparison(userId: string, month: number, year: number) {
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    }),
  ]);

  const expenseByCategory: Record<string, number> = {};
  for (const expense of expenses) {
    expenseByCategory[expense.categoryId] =
      (expenseByCategory[expense.categoryId] ?? 0) + Number(expense.amount);
  }

  return budgets.map((budget) => ({
    budget: { ...budget, amount: Number(budget.amount) },
    spent: expenseByCategory[budget.categoryId] ?? 0,
    remaining: Number(budget.amount) - (expenseByCategory[budget.categoryId] ?? 0),
    percentage:
      Number(budget.amount) > 0
        ? Math.round(((expenseByCategory[budget.categoryId] ?? 0) / Number(budget.amount)) * 100)
        : 0,
  }));
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });

  if (!budget) {
    const error = new Error('Presupuesto no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.budget.delete({ where: { id: budgetId } });
}
