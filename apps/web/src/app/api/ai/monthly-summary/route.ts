import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const LANG_LABELS: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
};

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
  const { data: user } = (await meRes.json()) as { data: { name: string } };

  const body = (await req.json()) as { month?: number; year?: number; lang?: string };
  const now = new Date();
  const month = body.month ?? now.getMonth() + 1;
  const year = body.year ?? now.getFullYear();
  const lang = body.lang ?? 'es';
  const langLabel = LANG_LABELS[lang] ?? 'Spanish';

  const [summaryRes, incomesRes, dashboardRes] = await Promise.all([
    fetch(`${API_URL}/expenses/summary/monthly?month=${month}&year=${year}`, {
      headers: { Authorization: authHeader },
    }),
    fetch(`${API_URL}/incomes/summary/monthly?month=${month}&year=${year}`, {
      headers: { Authorization: authHeader },
    }),
    fetch(`${API_URL}/dashboard/summary`, {
      headers: { Authorization: authHeader },
    }),
  ]);

  const [summaryJson, incomesJson, dashboardJson] = await Promise.all([
    summaryRes.json(),
    incomesRes.json(),
    dashboardRes.json(),
  ]);

  const monthName = MONTH_NAMES[month - 1] ?? '';

  // data is { month, year, totalAmount, byCategory: [...] }
  const expensesData = summaryJson.data as {
    totalAmount: number;
    byCategory: Array<{ category: { name: string }; total: number; count: number }>;
  } | undefined;

  const incomesData = incomesJson.data as {
    totalAmount: number;
    bySource: Array<{ source: string; total: number }>;
  } | undefined;

  const dashboardData = dashboardJson.data as {
    debtPayments: { total: number };
  } | undefined;

  const totalExpenses = Number(expensesData?.totalAmount ?? 0);
  const totalIncome = Number(incomesData?.totalAmount ?? 0);
  const totalDebtPayments = Number(dashboardData?.debtPayments?.total ?? 0);
  // Balance = Ingresos - Gastos - Pagos de deudas
  const balance = totalIncome - totalExpenses - totalDebtPayments;

  const expensesByCategory = (expensesData?.byCategory ?? [])
    .map((c) => `- ${c.category.name}: S/ ${Number(c.total).toFixed(2)} (${c.count} gastos)`)
    .join('\n');

  const incomeBySource = (incomesData?.bySource ?? [])
    .map((s) => `- ${s.source}: S/ ${Number(s.total).toFixed(2)}`)
    .join('\n');

  const prompt = `You are a personal finance advisor for ${user.name}.
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

  return new Response(JSON.stringify({ summary: result.text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
