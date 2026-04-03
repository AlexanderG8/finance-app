import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';


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

  const body = (await req.json()) as { lang?: string };
  const lang = body.lang ?? 'es';

  const dashboardRes = await fetch(`${API_URL}/dashboard/summary`, {
    headers: { Authorization: authHeader },
  });

  const dashboardJson = await dashboardRes.json();

  const dashboardData = dashboardJson.data as {
    expenses: { total: number; byCategory: Array<{ category: { name: string }; total: number; count: number }> };
    income: { total: number; bySource: Array<{ source: string; total: number }> };
    debtPayments: { total: number };
    loanDisbursements: { total: number };
    loanCollections: { total: number };
    balance: number;
  } | undefined;

  const totalExpenses = Number(dashboardData?.expenses.total ?? 0);
  const totalIncome = Number(dashboardData?.income.total ?? 0);
  const totalDebtPayments = Number(dashboardData?.debtPayments.total ?? 0);
  const totalLoanDisbursements = Number(dashboardData?.loanDisbursements.total ?? 0);
  const totalLoanCollections = Number(dashboardData?.loanCollections.total ?? 0);
  const balance = Number(dashboardData?.balance ?? 0);

  const expensesByCategory = (dashboardData?.expenses.byCategory ?? [])
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((c) => `- ${c.category.name}: S/ ${Number(c.total).toFixed(2)} (${c.count} gastos)`)
    .join('\n');

  const incomeBySource = (dashboardData?.income.bySource ?? [])
    .map((s) => `- ${s.source}: S/ ${Number(s.total).toFixed(2)}`)
    .join('\n');

  const prompt = lang === 'en'
    ? `You are a personal finance advisor for ${user.name}.
Generate a concise executive summary of their overall financial situation in 3-4 sentences.
Respond ONLY in English. Do not use markdown formatting.

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

Write a helpful, friendly, and actionable 3-4 sentence summary of the user's overall financial health. Highlight their biggest spending categories, income sources, and the overall balance. Mention the most relevant insights for improving their finances.`
    : `Eres un asesor financiero personal de ${user.name}.
Genera un resumen ejecutivo conciso de su situación financiera general en 3-4 oraciones.
Responde ÚNICAMENTE en español. No uses formato markdown.

DATOS FINANCIEROS HISTÓRICOS (ACUMULADOS):
Total de ingresos registrados: S/ ${totalIncome.toFixed(2)}
Total de gastos registrados: S/ ${totalExpenses.toFixed(2)}
Total de pagos de deudas realizados: S/ ${totalDebtPayments.toFixed(2)}
Total de préstamos desembolsados: S/ ${totalLoanDisbursements.toFixed(2)}
Total de cobros de préstamos recibidos: S/ ${totalLoanCollections.toFixed(2)}
Balance general: S/ ${balance.toFixed(2)}

Principales gastos por categoría (histórico):
${expensesByCategory || 'Sin gastos registrados'}

Ingresos por fuente (histórico):
${incomeBySource || 'Sin ingresos registrados'}

Escribe un resumen útil, amigable y accionable de 3-4 oraciones sobre la salud financiera general del usuario. Destaca las categorías de mayor gasto, las fuentes de ingresos y el balance general. Menciona los insights más relevantes para mejorar sus finanzas.`;

  const result = await generateText({
    model: google('gemini-3.1-flash-lite-preview'),
    prompt,
  });

  return new Response(JSON.stringify({ summary: result.text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
