import { prisma } from '../lib/prisma';
import { calculateLoan } from '../lib/loan-calculator';
import { addDays } from 'date-fns';
import type { CreateLoanInput, UpdateLoanInput, PayInstallmentInput, LoanQueryInput } from '../schemas/loans.schema';

export async function listLoans(userId: string, query: LoanQueryInput) {
  const { status, borrowerName, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(borrowerName
      ? { borrowerName: { contains: borrowerName, mode: 'insensitive' as const } }
      : {}),
  };

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.loan.count({ where }),
  ]);

  return {
    data: loans.map((l) => ({
      ...l,
      principal: Number(l.principal),
      totalAmount: Number(l.totalAmount),
      installmentAmount: Number(l.installmentAmount),
      interestRate: Number(l.interestRate),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createLoan(userId: string, input: CreateLoanInput) {
  const loanDate = new Date(input.loanDate);
  const calculation = calculateLoan(
    { principal: input.principal, numberOfInstallments: input.numberOfInstallments },
    loanDate
  );

  const loan = await prisma.loan.create({
    data: {
      userId,
      borrowerName: input.borrowerName,
      borrowerContact: input.borrowerContact,
      principal: input.principal,
      currency: input.currency,
      interestRate: calculation.interestRate,
      totalAmount: calculation.totalAmount,
      numberOfInstallments: input.numberOfInstallments,
      installmentAmount: calculation.installmentAmount,
      deliveryMethod: input.deliveryMethod,
      loanDate,
      notes: input.notes,
      installments: {
        create: calculation.installments.map((inst) => ({
          number: inst.number,
          amount: inst.amount,
          dueDate: inst.dueDate,
        })),
      },
    },
    include: { installments: true },
  });

  return {
    ...loan,
    principal: Number(loan.principal),
    totalAmount: Number(loan.totalAmount),
    installmentAmount: Number(loan.installmentAmount),
    interestRate: Number(loan.interestRate),
    installments: loan.installments.map((i) => ({
      ...i,
      amount: Number(i.amount),
      paidAmount: Number(i.paidAmount),
    })),
  };
}

export async function getLoanById(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
    include: {
      installments: {
        include: { payments: true },
        orderBy: { number: 'asc' },
      },
    },
  });

  if (!loan) {
    const error = new Error('Préstamo no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return {
    ...loan,
    principal: Number(loan.principal),
    totalAmount: Number(loan.totalAmount),
    installmentAmount: Number(loan.installmentAmount),
    interestRate: Number(loan.interestRate),
    installments: loan.installments.map((i) => ({
      ...i,
      amount: Number(i.amount),
      paidAmount: Number(i.paidAmount),
      payments: i.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    })),
  };
}

export async function updateLoan(userId: string, loanId: string, input: UpdateLoanInput) {
  const existing = await prisma.loan.findFirst({ where: { id: loanId, userId } });

  if (!existing) {
    const error = new Error('Préstamo no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      ...(input.borrowerName !== undefined ? { borrowerName: input.borrowerName } : {}),
      ...(input.borrowerContact !== undefined ? { borrowerContact: input.borrowerContact } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });

  return {
    ...loan,
    principal: Number(loan.principal),
    totalAmount: Number(loan.totalAmount),
    installmentAmount: Number(loan.installmentAmount),
    interestRate: Number(loan.interestRate),
  };
}

export async function getLoanInstallments(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });

  if (!loan) {
    const error = new Error('Préstamo no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const installments = await prisma.loanInstallment.findMany({
    where: { loanId },
    include: { payments: true },
    orderBy: { number: 'asc' },
  });

  return installments.map((i) => ({
    ...i,
    amount: Number(i.amount),
    paidAmount: Number(i.paidAmount),
    payments: i.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  }));
}

export async function payInstallment(
  userId: string,
  loanId: string,
  installmentId: string,
  input: PayInstallmentInput
) {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });

  if (!loan) {
    const error = new Error('Préstamo no encontrado.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const installment = await prisma.loanInstallment.findFirst({
    where: { id: installmentId, loanId },
  });

  if (!installment) {
    const error = new Error('Cuota no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const newPaidAmount = Number(installment.paidAmount) + input.amount;
  const installmentAmount = Number(installment.amount);
  const newStatus = newPaidAmount >= installmentAmount ? 'PAID' : 'PARTIAL';

  const [payment] = await prisma.$transaction([
    prisma.loanPayment.create({
      data: {
        installmentId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paidAt: new Date(input.paidAt),
        notes: input.notes,
      },
    }),
    prisma.loanInstallment.update({
      where: { id: installmentId },
      data: { paidAmount: newPaidAmount, status: newStatus },
    }),
  ]);

  // Check if all installments are paid and update loan status
  const allInstallments = await prisma.loanInstallment.findMany({ where: { loanId } });
  const allPaid = allInstallments.every((i) => i.status === 'PAID');

  if (allPaid) {
    await prisma.loan.update({ where: { id: loanId }, data: { status: 'COMPLETED' } });
  }

  return { ...payment, amount: Number(payment.amount) };
}

export async function getUpcomingInstallments(userId: string, days: number = 7) {
  const now = new Date();
  const futureDate = addDays(now, days);

  const installments = await prisma.loanInstallment.findMany({
    where: {
      loan: { userId },
      dueDate: { gte: now, lte: futureDate },
      status: { in: ['PENDING', 'PARTIAL'] },
    },
    include: { loan: true },
    orderBy: { dueDate: 'asc' },
  });

  return installments.map((i) => ({
    ...i,
    amount: Number(i.amount),
    paidAmount: Number(i.paidAmount),
    loan: {
      ...i.loan,
      principal: Number(i.loan.principal),
      totalAmount: Number(i.loan.totalAmount),
      installmentAmount: Number(i.loan.installmentAmount),
      interestRate: Number(i.loan.interestRate),
    },
  }));
}

export async function getLoanSummary(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: {
      installments: { include: { payments: true } },
    },
  });

  let totalLent = 0;
  let totalCollected = 0;
  let totalPending = 0;

  for (const loan of loans) {
    totalLent += Number(loan.principal);
    for (const installment of loan.installments) {
      totalCollected += Number(installment.paidAmount);
      if (installment.status !== 'PAID') {
        totalPending += Number(installment.amount) - Number(installment.paidAmount);
      }
    }
  }

  return {
    totalLent,
    totalCollected,
    totalPending,
    activeLoans: loans.filter((l) => l.status === 'ACTIVE').length,
    completedLoans: loans.filter((l) => l.status === 'COMPLETED').length,
    overdueLoans: loans.filter((l) => l.status === 'OVERDUE').length,
  };
}
