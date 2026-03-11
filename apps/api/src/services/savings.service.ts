import { prisma } from '../lib/prisma';
import { addMonths, differenceInMonths } from 'date-fns';
import type { CreateSavingGoalInput, UpdateSavingGoalInput, ContributeInput } from '../schemas/savings.schema';

export async function listSavingGoals(userId: string) {
  const goals = await prisma.savingGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    monthlyContribution: g.monthlyContribution ? Number(g.monthlyContribution) : null,
  }));
}

export async function createSavingGoal(userId: string, input: CreateSavingGoalInput) {
  const goal = await prisma.savingGoal.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      targetAmount: input.targetAmount,
      currency: input.currency,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      monthlyContribution: input.monthlyContribution,
      notes: input.notes,
    },
  });

  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
  };
}

export async function getSavingGoalById(userId: string, goalId: string) {
  const goal = await prisma.savingGoal.findFirst({
    where: { id: goalId, userId },
    include: { contributions: { orderBy: { contributedAt: 'desc' } } },
  });

  if (!goal) {
    const error = new Error('Meta de ahorro no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
    contributions: goal.contributions.map((c) => ({ ...c, amount: Number(c.amount) })),
  };
}

export async function updateSavingGoal(userId: string, goalId: string, input: UpdateSavingGoalInput) {
  const existing = await prisma.savingGoal.findFirst({ where: { id: goalId, userId } });

  if (!existing) {
    const error = new Error('Meta de ahorro no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const goal = await prisma.savingGoal.update({
    where: { id: goalId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount } : {}),
      ...(input.targetDate !== undefined
        ? { targetDate: input.targetDate ? new Date(input.targetDate) : null }
        : {}),
      ...(input.monthlyContribution !== undefined
        ? { monthlyContribution: input.monthlyContribution }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
  };
}

export async function contribute(userId: string, goalId: string, input: ContributeInput) {
  const goal = await prisma.savingGoal.findFirst({ where: { id: goalId, userId } });

  if (!goal) {
    const error = new Error('Meta de ahorro no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const newAmount = Number(goal.currentAmount) + input.amount;
  const targetAmount = Number(goal.targetAmount);
  const isCompleted = newAmount >= targetAmount;

  const [contribution] = await prisma.$transaction([
    prisma.savingContribution.create({
      data: {
        goalId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        contributedAt: new Date(input.contributedAt),
        notes: input.notes,
      },
    }),
    prisma.savingGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        ...(isCompleted ? { status: 'COMPLETED' } : {}),
      },
    }),
  ]);

  return { ...contribution, amount: Number(contribution.amount) };
}

export async function getSavingGoalProjection(userId: string, goalId: string) {
  const goal = await prisma.savingGoal.findFirst({ where: { id: goalId, userId } });

  if (!goal) {
    const error = new Error('Meta de ahorro no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const currentAmount = Number(goal.currentAmount);
  const targetAmount = Number(goal.targetAmount);
  const remaining = targetAmount - currentAmount;
  const monthlyContribution = goal.monthlyContribution ? Number(goal.monthlyContribution) : null;

  if (remaining <= 0) {
    return {
      goalId,
      currentAmount,
      targetAmount,
      remaining: 0,
      isCompleted: true,
      projectedCompletionDate: null,
      monthsToComplete: 0,
    };
  }

  if (!monthlyContribution || monthlyContribution <= 0) {
    return {
      goalId,
      currentAmount,
      targetAmount,
      remaining,
      isCompleted: false,
      projectedCompletionDate: null,
      monthsToComplete: null,
    };
  }

  const monthsToComplete = Math.ceil(remaining / monthlyContribution);
  const projectedCompletionDate = addMonths(new Date(), monthsToComplete);

  const targetDate = goal.targetDate;
  const monthsUntilTarget = targetDate
    ? differenceInMonths(targetDate, new Date())
    : null;

  return {
    goalId,
    currentAmount,
    targetAmount,
    remaining,
    isCompleted: false,
    projectedCompletionDate,
    monthsToComplete,
    monthlyContribution,
    isOnTrack: monthsUntilTarget !== null ? monthsToComplete <= monthsUntilTarget : null,
    targetDate: goal.targetDate,
  };
}

export async function deleteSavingGoal(userId: string, goalId: string): Promise<void> {
  const existing = await prisma.savingGoal.findFirst({ where: { id: goalId, userId } });

  if (!existing) {
    const error = new Error('Meta de ahorro no encontrada.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  await prisma.savingGoal.delete({ where: { id: goalId } });
}
