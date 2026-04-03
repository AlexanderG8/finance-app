import { getSavingGoalProjection } from '../services/savings.service';

// ─── Mock de Prisma ──────────────────────────────────────────────────────────

jest.mock('../lib/prisma', () => ({
  prisma: {
    savingGoal: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

const mockFindFirst = prisma.savingGoal.findFirst as jest.Mock;

// ─── Helper para construir una meta de ahorro simulada ───────────────────────

function makeGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'goal-1',
    userId: 'user-1',
    name: 'Vacaciones',
    type: 'CUSTOM',
    targetAmount: 5000,
    currentAmount: 1000,
    monthlyContribution: 500,
    currency: 'PEN',
    targetDate: null,
    status: 'IN_PROGRESS',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getSavingGoalProjection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Meta no encontrada ──────────────────────────────────────────────────────

  it('debe lanzar error 404 si la meta no existe', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(getSavingGoalProjection('user-1', 'goal-inexistente')).rejects.toMatchObject({
      message: 'Meta de ahorro no encontrada.',
      statusCode: 404,
    });
  });

  // ── Meta ya completada ──────────────────────────────────────────────────────

  it('debe retornar isCompleted=true si currentAmount >= targetAmount', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({ currentAmount: 5000, targetAmount: 5000 }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.isCompleted).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.projectedCompletionDate).toBeNull();
    expect(result.monthsToComplete).toBe(0);
  });

  it('debe retornar isCompleted=true si currentAmount supera targetAmount', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({ currentAmount: 6000, targetAmount: 5000 }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.isCompleted).toBe(true);
  });

  // ── Sin contribución mensual ────────────────────────────────────────────────

  it('debe retornar projectedCompletionDate=null si monthlyContribution es null', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({ monthlyContribution: null }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.projectedCompletionDate).toBeNull();
    expect(result.monthsToComplete).toBeNull();
    expect(result.isCompleted).toBe(false);
  });

  it('debe retornar projectedCompletionDate=null si monthlyContribution es 0', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({ monthlyContribution: 0 }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.projectedCompletionDate).toBeNull();
    expect(result.monthsToComplete).toBeNull();
  });

  // ── Cálculo de proyección ───────────────────────────────────────────────────

  it('debe calcular monthsToComplete = ceil(remaining / monthlyContribution)', async () => {
    // remaining = 5000 - 1000 = 4000, contribution = 500 → 4000/500 = 8 meses exactos
    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 500,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.monthsToComplete).toBe(8);
    expect(result.remaining).toBe(4000);
  });

  it('debe redondear monthsToComplete hacia arriba (Math.ceil)', async () => {
    // remaining = 5000 - 1000 = 4000, contribution = 300 → 4000/300 = 13.33... → ceil = 14
    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 300,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.monthsToComplete).toBe(14);
  });

  it('debe calcular monthsToComplete = 1 si la contribución cubre el restante exacto', async () => {
    // remaining = 500, contribution = 500 → 1 mes
    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 4500,
      targetAmount: 5000,
      monthlyContribution: 500,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.monthsToComplete).toBe(1);
  });

  it('debe retornar una projectedCompletionDate futura cuando hay contribución', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 500,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.projectedCompletionDate).toBeInstanceOf(Date);
    expect((result.projectedCompletionDate as Date).getTime()).toBeGreaterThan(Date.now());
  });

  // ── isOnTrack ───────────────────────────────────────────────────────────────

  it('debe retornar isOnTrack=true si monthsToComplete <= meses hasta targetDate', async () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 12); // 12 meses en el futuro

    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 500, // 8 meses para completar
      targetDate,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.isOnTrack).toBe(true);
  });

  it('debe retornar isOnTrack=false si monthsToComplete > meses hasta targetDate', async () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3); // Solo 3 meses al target

    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 500, // 8 meses para completar > 3 meses al target
      targetDate,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.isOnTrack).toBe(false);
  });

  it('debe retornar isOnTrack=null si no hay targetDate', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({
      currentAmount: 1000,
      targetAmount: 5000,
      monthlyContribution: 500,
      targetDate: null,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-1');

    expect(result.isOnTrack).toBeNull();
  });

  // ── Datos retornados ────────────────────────────────────────────────────────

  it('debe retornar goalId, currentAmount y targetAmount correctamente', async () => {
    mockFindFirst.mockResolvedValue(makeGoal({
      id: 'goal-xyz',
      currentAmount: 2500,
      targetAmount: 10000,
      monthlyContribution: 1000,
    }));

    const result = await getSavingGoalProjection('user-1', 'goal-xyz');

    expect(result.goalId).toBe('goal-xyz');
    expect(result.currentAmount).toBe(2500);
    expect(result.targetAmount).toBe(10000);
    expect(result.remaining).toBe(7500);
  });
});
