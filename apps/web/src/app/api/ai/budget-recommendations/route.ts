import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const recommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      categoryName: z.string(),
      suggestedAmount: z.number(),
      reasoning: z.string(),
    }),
  ),
});

function getLastThreeMonths(): Array<{ month: number; year: number }> {
  const result: Array<{ month: number; year: number }> = [];
  const now = new Date();
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

  const now = new Date();
  const currentMonth = { month: now.getMonth() + 1, year: now.getFullYear() };

  // Include current month + last 3 months so users with little history still get results
  const months = [currentMonth, ...getLastThreeMonths()];

  const summaries = await Promise.all(
    months.map(({ month, year }) =>
      fetch(`${API_URL}/expenses/summary/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: authHeader },
      }).then((r) => r.json()),
    ),
  );

  // Aggregate spending per category across all available months
  // json.data is { totalAmount, byCategory: [{ category: { name }, total, count }] }
  const totalsPerCategory = new Map<string, number[]>();
  let monthsWithData = 0;
  summaries.forEach((json) => {
    const data = json.data as {
      byCategory: Array<{ category: { name: string }; total: number }>;
    } | undefined;
    const rows = data?.byCategory ?? [];
    if (rows.length > 0) monthsWithData++;
    rows.forEach(({ category, total }) => {
      const existing = totalsPerCategory.get(category.name) ?? [];
      existing.push(Number(total));
      totalsPerCategory.set(category.name, existing);
    });
  });

  if (totalsPerCategory.size === 0) {
    return new Response(
      JSON.stringify({ recommendations: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const spendingData = Array.from(totalsPerCategory.entries())
    .map(([cat, amounts]) => {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      return `${cat}: month averages S/ ${avg.toFixed(2)} (data from ${amounts.length} month(s))`;
    })
    .join('\n');

  const limitedDataNote = monthsWithData < 2
    ? 'NOTA: El usuario solo tiene datos de 1 mes. Genera sugerencias basadas en ese historial e indica que son estimaciones iniciales.'
    : '';

  const result = await generateObject({
    model: google('gemini-3.1-flash-lite-preview'),
    schema: recommendationsSchema,
    prompt: `Eres un asesor financiero personal. Basándote en el historial de gastos disponible, sugiere montos mensuales de presupuesto realistas por categoría. Responde SIEMPRE en español.
${limitedDataNote}

Historial de gastos por categoría:
${spendingData}

Para cada categoría, sugiere un monto mensual de presupuesto con un razonamiento breve en español.
- suggestedAmount debe estar en PEN (soles), como número
- reasoning debe ser una explicación concisa en español como "Promedio histórico S/320, se sugiere S/350 con 10% de margen"
- Si los datos son limitados (1 mes), menciónalo brevemente en el razonamiento
- Incluye todas las categorías que tengan datos de gasto`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
