import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const savingsAdviceSchema = z.object({
  isAchievable: z.boolean(),
  assessment: z.string(),
  recommendedMonthlyContribution: z.number(),
  estimatedCompletionDate: z.string(),
  tips: z.array(z.string()),
});

function getLastThreeMonths(): Array<{ month: number; year: number }> {
  const now = new Date();
  const result: Array<{ month: number; year: number }> = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
}

export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: authHeader },
  });
  if (!meRes.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = (await req.json()) as { goalId?: string };
  if (!body.goalId) {
    return new Response(JSON.stringify({ error: 'goalId is required' }), { status: 400 });
  }

  const months = getLastThreeMonths();

  // Fetch goal + last 3 months income and expense summaries in parallel
  const [goalRes, ...summaryRes] = await Promise.all([
    fetch(`${API_URL}/savings/${body.goalId}`, { headers: { Authorization: authHeader } }),
    ...months.map(({ month, year }) =>
      Promise.all([
        fetch(`${API_URL}/incomes/summary/monthly?month=${month}&year=${year}`, {
          headers: { Authorization: authHeader },
        }),
        fetch(`${API_URL}/expenses/summary/monthly?month=${month}&year=${year}`, {
          headers: { Authorization: authHeader },
        }),
      ]),
    ),
  ]);

  if (!goalRes.ok) {
    return new Response(JSON.stringify({ error: 'Saving goal not found' }), { status: 404 });
  }

  const goalJson = await goalRes.json();
  const summaryJsons = await Promise.all(
    (summaryRes as Array<[Response, Response]>).map(async ([incRes, expRes]) => ({
      income: await incRes.json(),
      expenses: await expRes.json(),
    })),
  );

  const goal = goalJson.data as {
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution?: number;
    targetDate?: string;
    status: string;
    type: string;
  };

  // Calculate average monthly balance (income - expenses) over last 3 months
  let totalBalance = 0;
  summaryJsons.forEach(({ income, expenses }) => {
    const inc = Number((income.data as { totalAmount: number } | undefined)?.totalAmount ?? 0);
    const exp = Number((expenses.data as { totalAmount: number } | undefined)?.totalAmount ?? 0);
    totalBalance += inc - exp;
  });
  const avgMonthlyBalance = totalBalance / 3;

  const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
  const progressPct =
    goal.targetAmount > 0
      ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0;

  const result = await generateObject({
    model: google('gemini-3.1-flash-lite-preview'),
    schema: savingsAdviceSchema,
    prompt: `You are a personal finance advisor. Analyze this savings goal and provide advice.

SAVINGS GOAL:
- Name: ${goal.name}
- Type: ${goal.type}
- Target amount: S/ ${Number(goal.targetAmount).toFixed(2)}
- Current amount saved: S/ ${Number(goal.currentAmount).toFixed(2)}
- Remaining: S/ ${remaining.toFixed(2)}
- Progress: ${progressPct}%
- Current monthly contribution: ${goal.monthlyContribution ? `S/ ${Number(goal.monthlyContribution).toFixed(2)}` : 'Not set'}
- Target date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('es-PE') : 'Not set'}
- Status: ${goal.status}

FINANCIAL CONTEXT:
- Average monthly balance (income minus expenses, last 3 months): S/ ${avgMonthlyBalance.toFixed(2)}

Responde SIEMPRE en español. Proporciona:
- isAchievable: true si la meta puede lograrse de forma realista dado el balance mensual
- assessment: evaluación honesta de 2-3 oraciones sobre la viabilidad de la meta (texto plano, en español)
- recommendedMonthlyContribution: monto mensual sugerido para ahorrar en PEN (como número), basado en el balance disponible
- estimatedCompletionDate: fecha ISO (YYYY-MM-DD) en que se completaría la meta con el aporte mensual recomendado
- tips: exactamente 3 tips cortos y accionables para alcanzar la meta más rápido (texto plano, en español)`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
