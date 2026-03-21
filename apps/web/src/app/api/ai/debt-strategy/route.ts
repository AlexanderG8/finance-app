import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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

  const months = getLastThreeMonths();

  // Fetch pending debts + last 3 months income summaries in parallel
  const [debtsRes, ...incomeSummaryRes] = await Promise.all([
    fetch(`${API_URL}/debts?status=PENDING&limit=100`, { headers: { Authorization: authHeader } }),
    ...months.map(({ month, year }) =>
      fetch(`${API_URL}/incomes/summary/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: authHeader },
      }),
    ),
  ]);

  const [debtsJson, ...incomeSummaryJsons] = await Promise.all([
    debtsRes.json(),
    ...incomeSummaryRes.map((r) => r.json()),
  ]);

  const debts = (
    debtsJson.data as Array<{
      creditorName: string;
      totalAmount: number;
      paidAmount: number;
      dueDate?: string;
      paymentMethod: string;
    }>
  ) ?? [];

  if (debts.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No pending debts found' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Calculate average monthly income from last 3 months
  const totalIncome = incomeSummaryJsons.reduce((acc, json) => {
    const data = json.data as { totalAmount: number } | undefined;
    return acc + Number(data?.totalAmount ?? 0);
  }, 0);
  const avgMonthlyIncome = totalIncome / 3;

  const debtList = debts
    .map((d) => {
      const pending = Number(d.totalAmount) - Number(d.paidAmount);
      return `- ${d.creditorName}: Total S/ ${Number(d.totalAmount).toFixed(2)} | Pagado S/ ${Number(d.paidAmount).toFixed(2)} | Pendiente S/ ${pending.toFixed(2)}${d.dueDate ? ` | Vence: ${new Date(d.dueDate).toLocaleDateString('es-PE')}` : ''}`;
    })
    .join('\n');

  const totalPending = debts.reduce(
    (acc, d) => acc + (Number(d.totalAmount) - Number(d.paidAmount)),
    0,
  );

  const result = await generateObject({
    model: google('gemini-3.1-flash-lite-preview'),
    schema: debtStrategySchema,
    prompt: `You are a personal finance advisor. Analyze these personal debts and recommend the best payment strategy.

PENDING DEBTS:
${debtList}

TOTAL PENDING: S/ ${totalPending.toFixed(2)}
AVERAGE MONTHLY INCOME (last 3 months): S/ ${avgMonthlyIncome.toFixed(2)}

Responde SIEMPRE en español. Recomienda:
- recommendedMethod: "avalanche" (mayor monto/interés primero) o "snowball" (menor saldo primero)
- methodExplanation: explicación breve de por qué este método se adapta a esta situación (2-3 oraciones, texto plano, en español)
- debtOrder: los acreedores en el orden de pago recomendado, cada uno con una razón breve en español
- monthlyTargetAmount: monto mensual realista para destinar a deudas (en PEN, como número), considerando el ingreso promedio
- estimatedMonthsToDebtFree: meses estimados para pagar todas las deudas al monto mensual sugerido

Responde solo con datos estructurados. Texto plano para explicaciones, sin markdown, todo en español.`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
