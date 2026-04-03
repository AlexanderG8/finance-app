import { prisma } from '../lib/prisma';
import type { CreateDebtInput, UpdateDebtInput, PayDebtInput, DebtQueryInput } from '../schemas/debts.schema';

export async function listDebts(userId: string, query: DebtQueryInput) {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status ? { status } : {}),
  };

  const [debts, total] = await Promise.all([
    prisma.personalDebt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.personalDebt.count({ where }),
  ]);

  return {
    data: debts.map((d) => ({
      ...d,
      totalAmount: Number(d.totalAmount),
      paidAmount: Number(d.paidAmount),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createDebt(userId: string, input: CreateDebtInput) {
  const debt = await prisma.personalDebt.create({
    data: {
      userId,
      creditorName: input.creditorName,
      totalAmount: input.totalAmount,
      currency: input.currency,
      debtType: input.debtType,
      numberOfInstallments: input.numberOfInstallments,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    },
  });

  return {
    ...debt,
    totalAmount: Number(debt.totalAmount),
    paidAmount: Number(debt.paidAmount),
  };
}

export async function getDebtById(userId: string, debtId: string) {
  const debt = await prisma.personalDebt.findFirst({
    where: { id: debtId, userId },
    include: { payments: { orderBy: { paidAt: 'desc' } } },
  });

  if (!debt) {
    const error = new Error('Deuda no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return {
    ...debt,
    totalAmount: Number(debt.totalAmount),
    paidAmount: Number(debt.paidAmount),
    payments: debt.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

export async function updateDebt(userId: string, debtId: string, input: UpdateDebtInput) {
  const existing = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });

  if (!existing) {
    const error = new Error('Deuda no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const debt = await prisma.personalDebt.update({
    where: { id: debtId },
    data: {
      ...(input.creditorName !== undefined ? { creditorName: input.creditorName } : {}),
      ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.debtType !== undefined ? { debtType: input.debtType } : {}),
      ...(input.numberOfInstallments !== undefined ? { numberOfInstallments: input.numberOfInstallments } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return {
    ...debt,
    totalAmount: Number(debt.totalAmount),
    paidAmount: Number(debt.paidAmount),
  };
}

export async function payDebt(userId: string, debtId: string, input: PayDebtInput) {
  const debt = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });

  if (!debt) {
    const error = new Error('Deuda no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const newPaidAmount = Number(debt.paidAmount) + input.amount;
  const totalAmount = Number(debt.totalAmount);

  let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PARTIAL';
  if (newPaidAmount >= totalAmount) {
    newStatus = 'PAID';
  } else if (newPaidAmount === 0) {
    newStatus = 'PENDING';
  }

  const [payment] = await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        debtId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paidAt: new Date(input.paidAt),
        notes: input.notes,
      },
    }),
    prisma.personalDebt.update({
      where: { id: debtId },
      data: { paidAmount: newPaidAmount, status: newStatus },
    }),
  ]);

  return { ...payment, amount: Number(payment.amount) };
}

export async function deleteDebt(userId: string, debtId: string): Promise<void> {
  const existing = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });

  if (!existing) {
    const error = new Error('Deuda no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.personalDebt.delete({ where: { id: debtId } });
}
