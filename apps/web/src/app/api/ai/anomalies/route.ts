import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Previous 2 months
  const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [currentRes, prev1Res, prev2Res] = await Promise.all([
    fetch(`${API_URL}/expenses/summary/monthly?month=${currentMonth}&year=${currentYear}`, {
      headers: { Authorization: authHeader },
    }),
    fetch(`${API_URL}/expenses/summary/monthly?month=${prev1.getMonth() + 1}&year=${prev1.getFullYear()}`, {
      headers: { Authorization: authHeader },
    }),
    fetch(`${API_URL}/expenses/summary/monthly?month=${prev2.getMonth() + 1}&year=${prev2.getFullYear()}`, {
      headers: { Authorization: authHeader },
    }),
  ]);

  const [currentJson, prev1Json, prev2Json] = await Promise.all([
    currentRes.json(),
    prev1Res.json(),
    prev2Res.json(),
  ]);

  type CategoryRow = { category: { name: string }; total: number };
  type SummaryData = { byCategory: CategoryRow[] } | undefined;

  const currentCategories = (currentJson.data as SummaryData)?.byCategory ?? [];
  const prev1Categories = (prev1Json.data as SummaryData)?.byCategory ?? [];
  const prev2Categories = (prev2Json.data as SummaryData)?.byCategory ?? [];

  if (currentCategories.length === 0) {
    return new Response(
      JSON.stringify({ anomalies: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Build average per category from previous 2 months
  const prevTotals = new Map<string, number[]>();
  [...prev1Categories, ...prev2Categories].forEach(({ category, total }) => {
    const existing = prevTotals.get(category.name) ?? [];
    existing.push(Number(total));
    prevTotals.set(category.name, existing);
  });

  // Build comparison string for categories that have history
  const comparisonData = currentCategories
    .map(({ category, total }) => {
      const prevAmounts = prevTotals.get(category.name) ?? [];
      const avg = prevAmounts.length > 0
        ? prevAmounts.reduce((a, b) => a + b, 0) / prevAmounts.length
        : 0;
      return `${category.name}: current S/ ${Number(total).toFixed(2)} | previous avg S/ ${avg.toFixed(2)}`;
    })
    .join('\n');

  const result = await generateObject({
    model: google('gemini-3.1-flash-lite-preview'),
    schema: anomaliesSchema,
    prompt: `Eres un asesor financiero personal. Detecta patrones de gasto inusuales comparando el mes actual con el promedio de los 2 meses anteriores.

COMPARACIÓN DE GASTOS (mes actual vs promedio de los últimos 2 meses):
${comparisonData}

Reglas:
- Solo marca una categoría como anomalía si el monto actual es al menos un 25% mayor que el promedio anterior Y el promedio anterior es mayor que 0 (existe historial para comparar).
- Si una categoría no tiene historial previo (promedio = 0), no la marques como anomalía.
- percentageIncrease debe ser el porcentaje real de incremento (ej: 45.5 para 45.5%)
- alertMessage debe ser un mensaje de advertencia corto y amigable en español (texto plano, sin markdown)
- Devuelve un array de anomalías vacío si no se detecta nada inusual.`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
