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

  const months = getLastThreeMonths();

  const summaries = await Promise.all(
    months.map(({ month, year }) =>
      fetch(`${API_URL}/expenses/summary/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: authHeader },
      }).then((r) => r.json()),
    ),
  );

  // Aggregate spending per category across 3 months
  // json.data is { totalAmount, byCategory: [{ category: { name }, total, count }] }
  const totalsPerCategory = new Map<string, number[]>();
  summaries.forEach((json) => {
    const data = json.data as {
      byCategory: Array<{ category: { name: string }; total: number }>;
    } | undefined;
    const rows = data?.byCategory ?? [];
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

  const result = await generateObject({
    model: google('gemini-3.1-flash-lite-preview'),
    schema: recommendationsSchema,
    prompt: `You are a personal finance advisor. Based on spending history from the last 3 months, suggest realistic monthly budget amounts per category.

Historical spending data per category:
${spendingData}

For each category, suggest a monthly budget amount with a brief reasoning.
- suggestedAmount should be in PEN (soles), as a number
- reasoning should be a concise explanation like "Historical average S/320, suggesting S/350 with 10% buffer"
- Include all categories that have spending data`,
  });

  return new Response(JSON.stringify(result.object), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
