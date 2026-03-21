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
    prompt: `You are a personal finance advisor. Detect unusual spending patterns by comparing the current month to the previous 2-month average.

SPENDING COMPARISON (current month vs previous 2-month average):
${comparisonData}

Rules:
- Only flag a category as an anomaly if the current amount is at least 25% higher than the previous average AND the previous average is greater than 0 (there is historical data to compare against).
- If a category has no previous data (avg = 0), do not flag it as an anomaly.
- percentageIncrease should be the actual percentage increase (e.g. 45.5 for 45.5%)
- alertMessage should be a short, friendly warning message (plain text, no markdown)
- Return an empty anomalies array if nothing unusual is detected.`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
