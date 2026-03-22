import { Request, Response, NextFunction } from 'express';
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { CoreMessage } from 'ai';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import * as expensesService from '../services/expenses.service';
import * as incomeService from '../services/income.service';
import * as debtsService from '../services/debts.service';
import * as savingsService from '../services/savings.service';
import * as loansService from '../services/loans.service';
import * as chatService from '../services/chat.service';
import { startOfMonth, endOfMonth } from 'date-fns';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getLastThreeMonths(): Array<{ month: number; year: number }> {
  const now = new Date();
  const result: Array<{ month: number; year: number }> = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

function formatList(items: string[]): string {
  if (items.length === 0) return 'Ninguno registrado';
  return items.join('\n');
}

// ─── POST /ai/chat ────────────────────────────────────────────────────────────
export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const { message } = req.body as { message: string };

    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'El mensaje es requerido' });
      return;
    }

    console.log('[AI/chat] Step 1: fetching data for userId:', userId);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = MONTH_NAMES[now.getMonth()];

    // Fetch financial context + history in parallel
    const [
      user,
      history,
      loanSummary,
      monthlySummary,
      incomeSummary,
      debtsList,
      savingGoals,
      debtPaymentsAggregate,
      recentExpenses,
      recentIncomes,
      activeLoans,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      chatService.getChatHistory(userId, 20),
      loansService.getLoanSummary(userId),
      expensesService.getMonthlySummary(userId, month, year),
      incomeService.getMonthlyIncomeSummary(userId, month, year),
      debtsService.listDebts(userId, { page: 1, limit: 100 }),
      savingsService.listSavingGoals(userId),
      prisma.debtPayment.aggregate({
        where: {
          debt: { userId },
          paidAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.loan.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 10,
      }),
    ]);

    console.log('[AI/chat] Step 2: data fetched OK. history.length:', history.length, '| expenses:', recentExpenses.length);

    const totalDebtsPending = debtsList.data.reduce(
      (sum: number, d: { totalAmount: number; paidAmount: number }) => sum + (d.totalAmount - d.paidAmount),
      0,
    );
    const totalSavings = savingGoals.reduce((sum: number, g: { currentAmount: number }) => sum + g.currentAmount, 0);
    const debtPaymentsTotal = Number(debtPaymentsAggregate._sum.amount ?? 0);
    const balance = incomeSummary.totalAmount - monthlySummary.totalAmount - debtPaymentsTotal;

    const expensesList = formatList(
      recentExpenses.map(
        (e) =>
          `${new Date(e.date).toLocaleDateString('es-PE')} | ${e.description} | ${e.category.name} | S/ ${Number(e.amount).toFixed(2)}`,
      ),
    );

    const incomesList = formatList(
      recentIncomes.map(
        (i) =>
          `${new Date(i.date).toLocaleDateString('es-PE')} | ${i.description} | ${i.source} | S/ ${Number(i.amount).toFixed(2)}`,
      ),
    );

    const debtsList2 = formatList(
      debtsList.data.map(
        (d: { creditorName: string; totalAmount: number; paidAmount: number; status: string }) => {
          const pending = d.totalAmount - d.paidAmount;
          return `${d.creditorName} | S/ ${d.totalAmount.toFixed(2)} total | S/ ${d.paidAmount.toFixed(2)} pagado | S/ ${pending.toFixed(2)} pendiente | ${d.status}`;
        },
      ),
    );

    const savingsList = formatList(
      savingGoals.map((g: { name: string; targetAmount: number; currentAmount: number }) => {
        const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
        return `${g.name} | Meta: S/ ${g.targetAmount.toFixed(2)} | Ahorrado: S/ ${g.currentAmount.toFixed(2)} | ${pct}%`;
      }),
    );

    const loansList = formatList(
      activeLoans.map(
        (l) =>
          `${l.borrowerName} | Prestado: S/ ${Number(l.principal).toFixed(2)} | Total a cobrar: S/ ${Number(l.totalAmount).toFixed(2)} | Cuota: S/ ${Number(l.installmentAmount).toFixed(2)} x ${l.numberOfInstallments} | Estado: ${l.status}`,
      ),
    );

    const userName = user?.name ?? 'Usuario';
    const systemPrompt = `Eres un asesor financiero personal de ${userName}.
Solo tienes acceso a los datos financieros de este usuario específico.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje y responde SIEMPRE en ese mismo idioma. Si escribe en español, responde en español. Si escribe en inglés, responde en inglés.

INSTRUCCIÓN DE FORMATO: Usa texto plano sin markdown. No uses asteriscos, almohadillas ni símbolos de formato. Usa saltos de línea para separar ideas. Sé amigable y profesional, como un asesor de confianza.

INSTRUCCIÓN DE EXTENSIÓN: Adapta la extensión de tu respuesta a la complejidad de la pregunta. Para preguntas simples sé breve (1-2 oraciones). Para análisis o planes financieros sé detallado y estructurado.

DATOS FINANCIEROS ACTUALES (${monthName} ${year}):
- Ingresos del mes: S/ ${incomeSummary.totalAmount.toFixed(2)}
- Gastos del mes: S/ ${monthlySummary.totalAmount.toFixed(2)}
- Pagos a deudas del mes: S/ ${debtPaymentsTotal.toFixed(2)}
- Balance real del mes (Ingresos - Gastos - Pagos de deudas): S/ ${balance.toFixed(2)}
- Deudas pendientes totales: S/ ${totalDebtsPending.toFixed(2)}
- Ahorros acumulados: S/ ${totalSavings.toFixed(2)} en ${savingGoals.length} meta(s)
- Préstamos activos por cobrar: S/ ${loanSummary.totalPending?.toFixed(2) ?? '0.00'} (${loanSummary.activeLoans ?? 0} préstamo(s))

GASTOS DEL MES (${monthName} ${year}):
${expensesList}

INGRESOS DEL MES (${monthName} ${year}):
${incomesList}

PRÉSTAMOS ACTIVOS:
${loansList}

DEUDAS PENDIENTES:
${debtsList2}

METAS DE AHORRO:
${savingsList}

REGLAS:
- Usa montos en soles (S/) para valores en PEN.
- Si el usuario pregunta datos que no están en el contexto, dilo honestamente.
- No inventes cifras ni datos que no estén en el contexto.
- No compartas ni hagas referencia a datos de otros usuarios.`;

    // Build messages array (CoreMessage[]) — identical structure to web's convertToModelMessages
    const messages: CoreMessage[] = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[AI/chat] Step 3: calling generateText. messages count:', messages.length);

    const result = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: systemPrompt,
      messages,
      maxRetries: 0,
    });

    console.log('[AI/chat] Step 4: generateText OK. response length:', result.text?.length);

    // Save both messages to history
    await chatService.saveChatMessages(userId, message, result.text);

    console.log('[AI/chat] Step 5: history saved OK.');

    res.status(200).json({ success: true, data: { message: result.text } });
  } catch (error) {
    console.error('[AI/chat] ERROR:', error);
    next(error);
  }
}

// ─── POST /ai/monthly-summary ─────────────────────────────────────────────────
export async function monthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const body = req.body as { month?: number; year?: number; lang?: string };
    const now = new Date();
    const month = body.month ?? now.getMonth() + 1;
    const year = body.year ?? now.getFullYear();
    const lang = body.lang ?? 'es';
    const langLabel = lang === 'en' ? 'English' : 'Spanish';
    const monthName = MONTH_NAMES[month - 1] ?? '';

    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = dbUser?.name ?? 'Usuario';

    const [expensesSummary, incomeSummaryData, debtPaymentsAggregate] = await Promise.all([
      expensesService.getMonthlySummary(userId, month, year),
      incomeService.getMonthlyIncomeSummary(userId, month, year),
      prisma.debtPayment.aggregate({
        where: {
          debt: { userId },
          paidAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = expensesSummary.totalAmount;
    const totalIncome = incomeSummaryData.totalAmount;
    const totalDebtPayments = Number(debtPaymentsAggregate._sum.amount ?? 0);
    const balance = totalIncome - totalExpenses - totalDebtPayments;

    const expensesByCategory = expensesSummary.byCategory
      .map((c: { category: { name: string }; total: number; count: number }) =>
        `- ${c.category.name}: S/ ${c.total.toFixed(2)} (${c.count} gastos)`,
      )
      .join('\n');

    const incomeBySource = incomeSummaryData.bySource
      .map((s: { source: string; total: number }) => `- ${s.source}: S/ ${s.total.toFixed(2)}`)
      .join('\n');

    const prompt = `You are a personal finance advisor for ${userName}.
Generate a concise executive summary of their financial month in 3-4 sentences.
Respond ONLY in ${langLabel}. Do not use markdown formatting.

FINANCIAL DATA FOR ${monthName} ${year}:
Total income: S/ ${totalIncome.toFixed(2)}
Total expenses: S/ ${totalExpenses.toFixed(2)}
Debt payments this month: S/ ${totalDebtPayments.toFixed(2)}
Real balance (income - expenses - debt payments): S/ ${balance.toFixed(2)}

Expenses by category:
${expensesByCategory || 'No expenses recorded'}

Income by source:
${incomeBySource || 'No income recorded'}

Write a helpful, friendly, and actionable 3-4 sentence summary. Use the real balance that already discounts both expenses and debt payments. Mention the most relevant insights.`;

    const result = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      prompt,
    });

    res.status(200).json({ success: true, data: { summary: result.text } });
  } catch (error) {
    next(error);
  }
}

// ─── POST /ai/budget-recommendations ─────────────────────────────────────────
const recommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      categoryName: z.string(),
      suggestedAmount: z.number(),
      reasoning: z.string(),
    }),
  ),
});

export async function budgetRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = { month: now.getMonth() + 1, year: now.getFullYear() };

    // Include current month + last 3 months so users with little history still get results
    const months = [currentMonth, ...getLastThreeMonths()];

    const summaries = await Promise.all(
      months.map(({ month, year }) => expensesService.getMonthlySummary(userId, month, year)),
    );

    const totalsPerCategory = new Map<string, number[]>();
    summaries.forEach((summary) => {
      summary.byCategory.forEach(({ category, total }: { category: { name: string }; total: number }) => {
        const existing = totalsPerCategory.get(category.name) ?? [];
        existing.push(total);
        totalsPerCategory.set(category.name, existing);
      });
    });

    if (totalsPerCategory.size === 0) {
      res.status(200).json({
        success: true,
        data: {
          recommendations: [],
          noDataMessage: 'Aún no tienes gastos registrados. Registra tus primeros gastos y vuelve a intentarlo para recibir sugerencias personalizadas.',
        },
      });
      return;
    }

    const monthsAvailable = new Set(
      summaries.filter((s) => s.byCategory.length > 0).map((s) => `${s.month}/${s.year}`),
    ).size;

    const spendingData = Array.from(totalsPerCategory.entries())
      .map(([cat, amounts]) => {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        return `${cat}: promedio mensual S/ ${avg.toFixed(2)} (datos de ${amounts.length} mes(es))`;
      })
      .join('\n');

    const limitedDataNote = monthsAvailable < 2
      ? 'NOTA: El usuario solo tiene datos de 1 mes. Genera sugerencias basadas en ese historial e indica que son estimaciones iniciales.'
      : '';

    // @ts-expect-error — TS2589: known deep type instantiation issue with ai SDK + Zod
    const result = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: recommendationsSchema,
      prompt: `You are a personal finance advisor. Based on available spending history, suggest realistic monthly budget amounts per category. Respond in Spanish.
${limitedDataNote}

Historical spending data per category:
${spendingData}

For each category, suggest a monthly budget amount with a brief reasoning in Spanish.
- suggestedAmount should be in PEN (soles), as a number
- reasoning should be a concise explanation in Spanish like "Promedio histórico S/320, se sugiere S/350 con 10% de margen"
- If data is limited (1 month), mention it briefly in the reasoning
- Include all categories that have spending data`,
      maxRetries: 0,
    });

    res.status(200).json({ success: true, data: result.object });
  } catch (error) {
    next(error);
  }
}

// ─── POST /ai/debt-strategy ───────────────────────────────────────────────────
const debtStrategySchema = z.object({
  recommendedMethod: z.enum(['avalanche', 'snowball']),
  methodExplanation: z.string(),
  debtOrder: z.array(
    z.object({
      creditorName: z.string(),
      reason: z.string(),
    }),
  ),
  monthlyTargetAmount: z.number(),
  estimatedMonthsToDebtFree: z.number(),
});

export async function debtStrategy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const months = getLastThreeMonths();

    const [debtsList, ...incomeSummaries] = await Promise.all([
      debtsService.listDebts(userId, { page: 1, limit: 100 }),
      ...months.map(({ month, year }) => incomeService.getMonthlyIncomeSummary(userId, month, year)),
    ]);

    const pendingDebts = debtsList.data.filter(
      (d: { status: string }) => d.status === 'PENDING' || d.status === 'PARTIAL',
    );

    if (pendingDebts.length === 0) {
      res.status(400).json({ success: false, error: 'No se encontraron deudas pendientes' });
      return;
    }

    const totalIncome = incomeSummaries.reduce(
      (acc: number, summary: { totalAmount: number }) => acc + summary.totalAmount,
      0,
    );
    const avgMonthlyIncome = totalIncome / 3;

    const debtList = pendingDebts
      .map((d: { creditorName: string; totalAmount: number; paidAmount: number; dueDate?: Date | null }) => {
        const pending = d.totalAmount - d.paidAmount;
        return `- ${d.creditorName}: Total S/ ${d.totalAmount.toFixed(2)} | Pagado S/ ${d.paidAmount.toFixed(2)} | Pendiente S/ ${pending.toFixed(2)}${d.dueDate ? ` | Vence: ${new Date(d.dueDate).toLocaleDateString('es-PE')}` : ''}`;
      })
      .join('\n');

    const totalPending = pendingDebts.reduce(
      (acc: number, d: { totalAmount: number; paidAmount: number }) => acc + (d.totalAmount - d.paidAmount),
      0,
    );

    // @ts-expect-error — TS2589: known deep type instantiation issue with ai SDK + Zod
    const result = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: debtStrategySchema,
      prompt: `You are a personal finance advisor. Analyze these personal debts and recommend the best payment strategy.

PENDING DEBTS:
${debtList}

TOTAL PENDING: S/ ${totalPending.toFixed(2)}
AVERAGE MONTHLY INCOME (last 3 months): S/ ${avgMonthlyIncome.toFixed(2)}

Responde SIEMPRE en español. Recomienda:
- recommendedMethod: "avalanche" (mayor deuda/monto primero) o "snowball" (menor saldo primero)
- methodExplanation: explicación breve de por qué este método (2-3 oraciones, texto plano, en español)
- debtOrder: acreedores en el orden de pago recomendado, cada uno con razón breve en español
- monthlyTargetAmount: monto mensual realista para deudas en PEN (como número)
- estimatedMonthsToDebtFree: meses estimados para pagar todas las deudas

Texto plano, sin markdown, todo en español.`,
    });

    res.status(200).json({ success: true, data: result.object });
  } catch (error) {
    next(error);
  }
}

// ─── POST /ai/savings-advice ──────────────────────────────────────────────────
const savingsAdviceSchema = z.object({
  isAchievable: z.boolean(),
  assessment: z.string(),
  recommendedMonthlyContribution: z.number(),
  estimatedCompletionDate: z.string(),
  tips: z.array(z.string()),
});

export async function savingsAdvice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const { goalId } = req.body as { goalId?: string };

    if (!goalId) {
      res.status(400).json({ success: false, error: 'goalId es requerido' });
      return;
    }

    const months = getLastThreeMonths();

    const [goal, ...monthlySummaries] = await Promise.all([
      prisma.savingGoal.findFirst({ where: { id: goalId, userId } }),
      ...months.map(({ month, year }) =>
        Promise.all([
          incomeService.getMonthlyIncomeSummary(userId, month, year),
          expensesService.getMonthlySummary(userId, month, year),
        ]),
      ),
    ]);

    if (!goal) {
      res.status(404).json({ success: false, error: 'Meta de ahorro no encontrada' });
      return;
    }

    let totalBalance = 0;
    (monthlySummaries as Array<[{ totalAmount: number }, { totalAmount: number }]>).forEach(([income, expenses]) => {
      totalBalance += income.totalAmount - expenses.totalAmount;
    });
    const avgMonthlyBalance = totalBalance / 3;

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const remaining = targetAmount - currentAmount;
    const progressPct = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0;

    // @ts-expect-error — TS2589: known deep type instantiation issue with ai SDK + Zod
    const result = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: savingsAdviceSchema,
      prompt: `You are a personal finance advisor. Analyze this savings goal and provide advice.

SAVINGS GOAL:
- Name: ${goal.name}
- Type: ${goal.type}
- Target amount: S/ ${targetAmount.toFixed(2)}
- Current amount saved: S/ ${currentAmount.toFixed(2)}
- Remaining: S/ ${remaining.toFixed(2)}
- Progress: ${progressPct}%
- Current monthly contribution: ${goal.monthlyContribution ? `S/ ${Number(goal.monthlyContribution).toFixed(2)}` : 'Not set'}
- Target date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('es-PE') : 'Not set'}
- Status: ${goal.status}

FINANCIAL CONTEXT:
- Average monthly balance (income minus expenses, last 3 months): S/ ${avgMonthlyBalance.toFixed(2)}

Responde SIEMPRE en español. Proporciona:
- isAchievable: true si la meta puede lograrse de forma realista
- assessment: evaluación honesta de 2-3 oraciones (texto plano, en español)
- recommendedMonthlyContribution: monto mensual sugerido en PEN (como número)
- estimatedCompletionDate: fecha ISO (YYYY-MM-DD) cuando se completaría la meta
- tips: exactamente 3 tips cortos y accionables en español`,
    });

    res.status(200).json({ success: true, data: result.object });
  } catch (error) {
    next(error);
  }
}

// ─── POST /ai/anomalies ───────────────────────────────────────────────────────
const anomaliesSchema = z.object({
  anomalies: z.array(
    z.object({
      categoryName: z.string(),
      currentAmount: z.number(),
      averageAmount: z.number(),
      percentageIncrease: z.number(),
      alertMessage: z.string(),
    }),
  ),
});

export async function detectAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [currentSummary, prev1Summary, prev2Summary] = await Promise.all([
      expensesService.getMonthlySummary(userId, currentMonth, currentYear),
      expensesService.getMonthlySummary(userId, prev1.getMonth() + 1, prev1.getFullYear()),
      expensesService.getMonthlySummary(userId, prev2.getMonth() + 1, prev2.getFullYear()),
    ]);

    const currentCategories = currentSummary.byCategory;

    if (currentCategories.length === 0) {
      res.status(200).json({ success: true, data: { anomalies: [] } });
      return;
    }

    const prevTotals = new Map<string, number[]>();
    [...prev1Summary.byCategory, ...prev2Summary.byCategory].forEach(
      ({ category, total }: { category: { name: string }; total: number }) => {
        const existing = prevTotals.get(category.name) ?? [];
        existing.push(total);
        prevTotals.set(category.name, existing);
      },
    );

    const comparisonData = currentCategories
      .map(({ category, total }: { category: { name: string }; total: number }) => {
        const prevAmounts = prevTotals.get(category.name) ?? [];
        const avg =
          prevAmounts.length > 0 ? prevAmounts.reduce((a, b) => a + b, 0) / prevAmounts.length : 0;
        return `${category.name}: actual S/ ${total.toFixed(2)} | promedio anterior S/ ${avg.toFixed(2)}`;
      })
      .join('\n');

    // @ts-expect-error — TS2589: known deep type instantiation issue with ai SDK + Zod
    const result = await generateObject({
      model: google('gemini-3.1-flash-lite-preview'),
      schema: anomaliesSchema,
      prompt: `You are a personal finance advisor. Detect unusual spending patterns comparing the current month to the previous 2-month average.

SPENDING COMPARISON (current month vs previous 2-month average):
${comparisonData}

Rules:
- Only flag a category as anomaly if current amount is at least 25% higher than the previous average AND the previous average is greater than 0.
- If a category has no previous data (avg = 0), do not flag it.
- percentageIncrease should be the actual percentage (e.g. 45.5 for 45.5%)
- alertMessage should be a short, friendly warning in Spanish (plain text, no markdown)
- Return empty anomalies array if nothing unusual is detected.`,
    });

    res.status(200).json({ success: true, data: result.object });
  } catch (error) {
    next(error);
  }
}
