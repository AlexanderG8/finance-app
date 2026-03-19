import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage, TextUIPart } from 'ai';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getTextFromParts(parts: UIMessage['parts']): string {
  return parts
    .filter((p): p is TextUIPart => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function formatList(items: unknown[]): string {
  if (!items || items.length === 0) return 'Ninguno registrado';
  return items.join('\n');
}

export async function POST(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 1. Verify JWT
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: authHeader },
  });
  if (!meRes.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { data: user } = (await meRes.json()) as { data: { name: string } };

  // 2. Parse request body
  const body = (await req.json()) as { messages: UIMessage[] };
  const { messages } = body;

  // 3. Fetch financial context in parallel
  const [dashboardRes, expensesRes, incomesRes, debtsRes, savingsRes] = await Promise.all([
    fetch(`${API_URL}/dashboard/summary`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/expenses?limit=10`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/incomes?limit=5`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/debts?status=PENDING&limit=10`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/savings`, { headers: { Authorization: authHeader } }),
  ]);

  const [dashboardJson, expensesJson, incomesJson, debtsJson, savingsJson] = await Promise.all([
    dashboardRes.json(),
    expensesRes.json(),
    incomesRes.json(),
    debtsRes.json(),
    savingsRes.json(),
  ]);

  // 4. Build context strings
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();

  const d = dashboardJson.data as {
    income: { total: number };
    expenses: { total: number };
    debtPayments: { total: number };
    balance: number;
    debts: { totalPending: number };
    savings: { totalSaved: number; goalsCount: number };
    loans: { totalPending: number; activeLoans: number };
  } | undefined;

  const expensesList = formatList(
    ((expensesJson.data as Array<{ date: string; description: string; category?: { name: string }; amount: number }>) ?? []).map(
      (e) =>
        `${new Date(e.date).toLocaleDateString('es-PE')} | ${e.description} | ${e.category?.name ?? ''} | S/ ${Number(e.amount).toFixed(2)}`,
    ),
  );

  const incomesList = formatList(
    ((incomesJson.data as Array<{ date: string; description: string; source: string; amount: number }>) ?? []).map(
      (i) =>
        `${new Date(i.date).toLocaleDateString('es-PE')} | ${i.description} | ${i.source} | S/ ${Number(i.amount).toFixed(2)}`,
    ),
  );

  const debtsList = formatList(
    ((debtsJson.data as Array<{ creditorName: string; totalAmount: number; paidAmount: number; status: string }>) ?? []).map(
      (db) =>
        `${db.creditorName} | S/ ${Number(db.totalAmount).toFixed(2)} total | S/ ${Number(db.paidAmount).toFixed(2)} pagado | S/ ${(Number(db.totalAmount) - Number(db.paidAmount)).toFixed(2)} pendiente | ${db.status}`,
    ),
  );

  const savingsArray = Array.isArray(savingsJson.data) ? savingsJson.data : (savingsJson.data ? [savingsJson.data] : []);
  const savingsList = formatList(
    (savingsArray as Array<{ name: string; targetAmount: number; currentAmount: number }>).map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      return `${g.name} | Meta: S/ ${target.toFixed(2)} | Ahorrado: S/ ${current.toFixed(2)} | ${pct}%`;
    }),
  );

  // 5. Build system prompt
  const systemPrompt = `Eres un asesor financiero personal de ${user.name}.
Solo tienes acceso a los datos financieros de este usuario específico.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje y responde SIEMPRE en ese mismo idioma. Si escribe en español, responde en español. Si escribe en inglés, responde en inglés.

DATOS FINANCIEROS ACTUALES (${monthName} ${year}):
- Ingresos del mes: S/ ${d?.income?.total?.toFixed(2) ?? '0.00'}
- Gastos del mes: S/ ${d?.expenses?.total?.toFixed(2) ?? '0.00'}
- Pagos a deudas del mes: S/ ${d?.debtPayments?.total?.toFixed(2) ?? '0.00'}
- Balance: S/ ${d?.balance?.toFixed(2) ?? '0.00'}
- Deudas pendientes totales: S/ ${d?.debts?.totalPending?.toFixed(2) ?? '0.00'}
- Ahorros acumulados: S/ ${d?.savings?.totalSaved?.toFixed(2) ?? '0.00'} en ${d?.savings?.goalsCount ?? 0} meta(s)
- Préstamos por cobrar: S/ ${d?.loans?.totalPending?.toFixed(2) ?? '0.00'} (${d?.loans?.activeLoans ?? 0} activo(s))

ÚLTIMOS GASTOS DEL MES:
${expensesList}

ÚLTIMOS INGRESOS:
${incomesList}

DEUDAS PENDIENTES:
${debtsList}

METAS DE AHORRO:
${savingsList}

REGLAS:
- Responde de forma concisa y directa.
- Usa montos en soles (S/) para valores en PEN.
- Si el usuario pregunta datos que no están en el contexto, dilo honestamente.
- No inventes cifras ni datos que no estén en el contexto.
- No compartas ni hagas referencia a datos de otros usuarios.`;

  // 6. Get last user message text for saving after stream completes
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserText = lastUserMsg ? getTextFromParts(lastUserMsg.parts) : '';

  // 7. Convert UIMessages to ModelMessages for Gemini
  const modelMessages = await convertToModelMessages(messages);

  // 8. Stream response
  const result = streamText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      if (lastUserText && text) {
        await fetch(`${API_URL}/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ userMessage: lastUserText, assistantMessage: text }),
        }).catch(() => {
          // Don't fail if saving chat history fails
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
