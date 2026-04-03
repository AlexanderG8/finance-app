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

    // Fetch ALL financial data + history in parallel (no month filter)
    const [
      user,
      history,
      allExpenses,
      allIncomes,
      allLoans,
      allDebts,
      savingGoals,
      globalIncome,
      globalExpenses,
      totalDebtPayments,
      totalLoanDisbursements,
      totalLoanCollections,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      chatService.getChatHistory(userId, 20),
      prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 500,
      }),
      prisma.income.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 300,
      }),
      prisma.loan.findMany({
        where: { userId },
        orderBy: { loanDate: 'desc' },
        take: 100,
      }),
      prisma.personalDebt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      savingsService.listSavingGoals(userId),
      prisma.income.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.debtPayment.aggregate({ where: { debt: { userId } }, _sum: { amount: true } }),
      prisma.loan.aggregate({ where: { userId }, _sum: { principal: true } }),
      prisma.loanPayment.aggregate({ where: { installment: { loan: { userId } } }, _sum: { amount: true } }),
    ]);

    console.log('[AI/chat] Step 2: data fetched OK. history:', history.length, '| expenses:', allExpenses.length, '| incomes:', allIncomes.length);

    // Group expenses by month
    const expensesByMonth = new Map<string, { total: number; byCategory: Map<string, number> }>();
    const recentCutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const recentExpenseLines: string[] = [];

    allExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!expensesByMonth.has(key)) {
        expensesByMonth.set(key, { total: 0, byCategory: new Map() });
      }
      const entry = expensesByMonth.get(key)!;
      const amount = Number(e.amount);
      entry.total += amount;
      const cat = e.category.name;
      entry.byCategory.set(cat, (entry.byCategory.get(cat) ?? 0) + amount);
      if (d >= recentCutoff) {
        recentExpenseLines.push(`  ${d.toLocaleDateString('es-PE')} | ${e.description} | ${cat} | S/ ${amount.toFixed(2)}`);
      }
    });

    // Group incomes by month
    const incomesByMonth = new Map<string, { total: number; bySource: Map<string, number> }>();
    const recentIncomeLines: string[] = [];

    allIncomes.forEach((i) => {
      const d = new Date(i.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!incomesByMonth.has(key)) {
        incomesByMonth.set(key, { total: 0, bySource: new Map() });
      }
      const entry = incomesByMonth.get(key)!;
      const amount = Number(i.amount);
      entry.total += amount;
      entry.bySource.set(i.source, (entry.bySource.get(i.source) ?? 0) + amount);
      if (d >= recentCutoff) {
        recentIncomeLines.push(`  ${d.toLocaleDateString('es-PE')} | ${i.description} | ${i.source} | S/ ${amount.toFixed(2)}`);
      }
    });

    // Format monthly expense summary
    const expensesMonthlySummary = Array.from(expensesByMonth.entries())
      .map(([month, data]) => {
        const cats = Array.from(data.byCategory.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([cat, total]) => `    • ${cat}: S/ ${total.toFixed(2)}`)
          .join('\n');
        return `${month} | Total: S/ ${data.total.toFixed(2)}\n${cats}`;
      })
      .join('\n\n');

    // Format monthly income summary
    const incomesMonthlySummary = Array.from(incomesByMonth.entries())
      .map(([month, data]) => {
        const sources = Array.from(data.bySource.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([src, total]) => `    • ${src}: S/ ${total.toFixed(2)}`)
          .join('\n');
        return `${month} | Total: S/ ${data.total.toFixed(2)}\n${sources}`;
      })
      .join('\n\n');

    // Global totals
    const totalIncome = Number(globalIncome._sum.amount ?? 0);
    const totalExpenses = Number(globalExpenses._sum.amount ?? 0);
    const totalDebtPaid = Number(totalDebtPayments._sum.amount ?? 0);
    const totalLoanDisb = Number(totalLoanDisbursements._sum.principal ?? 0);
    const totalLoanColl = Number(totalLoanCollections._sum.amount ?? 0);
    const globalBalance = totalIncome - totalExpenses - totalDebtPaid - totalLoanDisb + totalLoanColl;

    const totalDebtsPending = allDebts.reduce(
      (sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)),
      0,
    );
    const totalSavings = savingGoals.reduce((sum: number, g: { currentAmount: number }) => sum + Number(g.currentAmount), 0);

    const loansList = formatList(
      allLoans.map(
        (l) =>
          `${l.borrowerName} | Prestado: S/ ${Number(l.principal).toFixed(2)} | Total a cobrar: S/ ${Number(l.totalAmount).toFixed(2)} | Cuota: S/ ${Number(l.installmentAmount).toFixed(2)} x ${l.numberOfInstallments} | Estado: ${l.status} | Fecha: ${new Date(l.loanDate).toLocaleDateString('es-PE')}${l.notes ? ` | Nota: ${l.notes}` : ''}`,
      ),
    );

    const debtsList = formatList(
      allDebts.map((d) => {
        const pending = Number(d.totalAmount) - Number(d.paidAmount);
        return `${d.creditorName} | Tipo: ${d.debtType} | Total: S/ ${Number(d.totalAmount).toFixed(2)} | Pagado: S/ ${Number(d.paidAmount).toFixed(2)} | Pendiente: S/ ${pending.toFixed(2)} | Estado: ${d.status}${d.dueDate ? ` | Vence: ${new Date(d.dueDate).toLocaleDateString('es-PE')}` : ''}`;
      }),
    );

    const savingsList = formatList(
      savingGoals.map((g: { name: string; targetAmount: number; currentAmount: number; status: string; targetDate?: Date | null }) => {
        const pct = Number(g.targetAmount) > 0 ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100) : 0;
        return `${g.name} | Meta: S/ ${Number(g.targetAmount).toFixed(2)} | Ahorrado: S/ ${Number(g.currentAmount).toFixed(2)} | ${pct}% | Estado: ${g.status}${g.targetDate ? ` | Fecha objetivo: ${new Date(g.targetDate).toLocaleDateString('es-PE')}` : ''}`;
      }),
    );

    const userName = user?.name ?? 'Usuario';
    const systemPrompt = `Eres un asesor financiero personal de ${userName}.
Solo tienes acceso a los datos financieros de este usuario específico.
Hoy es ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje y responde SIEMPRE en ese mismo idioma.

INSTRUCCIÓN DE FORMATO: Usa texto plano sin markdown. No uses asteriscos, almohadillas ni símbolos de formato. Usa saltos de línea para separar ideas. Sé amigable y profesional.

INSTRUCCIÓN DE EXTENSIÓN: Adapta la extensión de tu respuesta a la complejidad de la pregunta. Para preguntas simples sé breve. Para análisis financieros sé detallado.

━━━ RESUMEN GLOBAL HISTÓRICO (acumulado total) ━━━
Ingresos totales: S/ ${totalIncome.toFixed(2)}
Gastos totales: S/ ${totalExpenses.toFixed(2)}
Pagos a deudas totales: S/ ${totalDebtPaid.toFixed(2)}
Préstamos desembolsados totales: S/ ${totalLoanDisb.toFixed(2)}
Cobros de préstamos totales: S/ ${totalLoanColl.toFixed(2)}
Balance general: S/ ${globalBalance.toFixed(2)}
Deudas pendientes: S/ ${totalDebtsPending.toFixed(2)}
Ahorros acumulados: S/ ${totalSavings.toFixed(2)} en ${savingGoals.length} meta(s)

━━━ GASTOS POR MES (desglose por categoría) ━━━
${expensesMonthlySummary || 'Sin gastos registrados'}

━━━ INGRESOS POR MES (desglose por fuente) ━━━
${incomesMonthlySummary || 'Sin ingresos registrados'}

━━━ DETALLE DE TRANSACCIONES RECIENTES (últimos 2 meses) ━━━
Gastos recientes:
${recentExpenseLines.length > 0 ? recentExpenseLines.join('\n') : '  Ninguno'}

Ingresos recientes:
${recentIncomeLines.length > 0 ? recentIncomeLines.join('\n') : '  Ninguno'}

━━━ TODOS LOS PRÉSTAMOS ━━━
${loansList}

━━━ TODAS LAS DEUDAS ━━━
${debtsList}

━━━ METAS DE AHORRO ━━━
${savingsList}

REGLAS:
- Usa montos en soles (S/) para valores en PEN.
- Si el usuario pregunta datos que no están en el contexto, dilo honestamente.
- No inventes cifras ni datos que no estén en el contexto.
- Puedes calcular totales, promedios y comparativas a partir de los datos disponibles.`;

    // Build messages array (CoreMessage[])
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

    await chatService.saveChatMessages(userId, message, result.text);

    console.log('[AI/chat] Step 5: history saved OK.');

    res.status(200).json({ success: true, data: { message: result.text } });
  } catch (error) {
    console.error('[AI/chat] ERROR:', error);
    next(error);
  }
}

// ─── POST /ai/global-summary ──────────────────────────────────────────────────
export async function monthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const body = req.body as { lang?: string };
    const lang = body.lang ?? 'es';
    const langLabel = lang === 'en' ? 'English' : 'Spanish';

    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = dbUser?.name ?? 'Usuario';

    const [expensesSummary, incomeSummaryData, debtPaymentsAggregate, loanDisbursementsAggregate, loanCollectionsAggregate] = await Promise.all([
      expensesService.getGlobalExpensesSummary(userId),
      incomeService.getGlobalIncomeSummary(userId),
      prisma.debtPayment.aggregate({
        where: { debt: { userId } },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: { userId },
        _sum: { principal: true },
      }),
      prisma.loanPayment.aggregate({
        where: { installment: { loan: { userId } } },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = expensesSummary.totalAmount;
    const totalIncome = incomeSummaryData.totalAmount;
    const totalDebtPayments = Number(debtPaymentsAggregate._sum.amount ?? 0);
    const totalLoanDisbursements = Number(loanDisbursementsAggregate._sum.principal ?? 0);
    const totalLoanCollections = Number(loanCollectionsAggregate._sum.amount ?? 0);
    const balance = totalIncome - totalExpenses - totalDebtPayments - totalLoanDisbursements + totalLoanCollections;

    const expensesByCategory = expensesSummary.byCategory
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)
      .slice(0, 8)
      .map((c: { category: { name: string }; total: number; count: number }) =>
        `- ${c.category.name}: S/ ${c.total.toFixed(2)} (${c.count} gastos)`,
      )
      .join('\n');

    const incomeBySource = incomeSummaryData.bySource
      .map((s: { source: string; total: number }) => `- ${s.source}: S/ ${s.total.toFixed(2)}`)
      .join('\n');

    const prompt = `You are a personal finance advisor for ${userName}.
Generate a concise executive summary of their overall financial situation in 3-4 sentences.
Respond ONLY in ${langLabel}. Do not use markdown formatting.

HISTORICAL (ALL-TIME) FINANCIAL DATA:
Total income recorded: S/ ${totalIncome.toFixed(2)}
Total expenses recorded: S/ ${totalExpenses.toFixed(2)}
Total debt payments made: S/ ${totalDebtPayments.toFixed(2)}
Total loans disbursed: S/ ${totalLoanDisbursements.toFixed(2)}
Total loan collections received: S/ ${totalLoanCollections.toFixed(2)}
Overall balance: S/ ${balance.toFixed(2)}

Top expenses by category (all time):
${expensesByCategory || 'No expenses recorded'}

Income by source (all time):
${incomeBySource || 'No income recorded'}

Write a helpful, friendly, and actionable 3-4 sentence summary of the user's overall financial health. Highlight their biggest spending categories, income sources, and the overall balance. Mention the most relevant insights for improving their finances.`;

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
