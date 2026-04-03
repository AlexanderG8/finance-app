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

function formatList(items: string[]): string {
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

  // 3. Build last 12 months list
  const now = new Date();
  const months: Array<{ month: number; year: number; label: string }> = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  // 4. Fetch all data in parallel.
  //    For expenses and incomes, use the monthly summary endpoints (no pagination limit).
  //    For loans/debts, limit=100 is within the schema max.
  const baseRequests = [
    fetch(`${API_URL}/dashboard/summary`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/loans?limit=100`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/debts?limit=100`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/savings`, { headers: { Authorization: authHeader } }),
    // Recent individual transactions for current month (within limit)
    fetch(`${API_URL}/expenses?limit=100`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/incomes?limit=100`, { headers: { Authorization: authHeader } }),
  ];

  // Monthly summary requests: expense + income per month (12 months × 2 = 24 requests)
  const monthlySummaryRequests = months.flatMap(({ month, year }) => [
    fetch(`${API_URL}/expenses/summary/monthly?month=${month}&year=${year}`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/incomes/summary?month=${month}&year=${year}`, { headers: { Authorization: authHeader } }),
  ]);

  const allResponses = await Promise.all([...baseRequests, ...monthlySummaryRequests]);
  const allJson = await Promise.all(allResponses.map((r) => r.json()));

  const [dashboardJson, allLoansJson, allDebtsJson, savingsJson, recentExpensesJson, recentIncomesJson] = allJson;
  const monthlyJsonResults = allJson.slice(6); // remaining are monthly summaries

  // 5. Types
  type CategorySummary = { category: { name: string }; total: number; count: number };
  type SourceSummary = { source: string; total: number };
  type LoanRow = { borrowerName: string; principal: number; totalAmount: number; installmentAmount: number; numberOfInstallments: number; status: string; loanDate: string; notes?: string };
  type DebtRow = { creditorName: string; totalAmount: number; paidAmount: number; status: string; dueDate?: string; debtType: string };
  type SavingRow = { name: string; targetAmount: number; currentAmount: number; status: string; targetDate?: string };
  type ExpenseRow = { date: string; description: string; category?: { name: string }; amount: number };
  type IncomeRow = { date: string; description: string; source: string; amount: number };

  // 6. Build monthly summaries from the per-month responses
  const expensesMonthlySummary: string[] = [];
  const incomesMonthlySummary: string[] = [];

  months.forEach(({ label }, i) => {
    const expJson = monthlyJsonResults[i * 2];
    const incJson = monthlyJsonResults[i * 2 + 1];

    const byCategory: CategorySummary[] = expJson?.data?.byCategory ?? [];
    const bySource: SourceSummary[] = incJson?.data?.bySource ?? [];
    const incTotal = Number(incJson?.data?.totalAmount ?? 0);
    const expTotal = byCategory.reduce((s, c) => s + Number(c.total), 0);

    if (byCategory.length > 0) {
      const cats = byCategory
        .sort((a, b) => Number(b.total) - Number(a.total))
        .map((c) => `    • ${c.category.name}: S/ ${Number(c.total).toFixed(2)} (${c.count} gastos)`)
        .join('\n');
      expensesMonthlySummary.push(`${label} | Total: S/ ${expTotal.toFixed(2)}\n${cats}`);
    }

    if (bySource.length > 0) {
      const sources = bySource
        .sort((a, b) => Number(b.total) - Number(a.total))
        .map((s) => `    • ${s.source}: S/ ${Number(s.total).toFixed(2)}`)
        .join('\n');
      incomesMonthlySummary.push(`${label} | Total: S/ ${incTotal.toFixed(2)}\n${sources}`);
    }
  });

  // 7. Recent individual transactions (current month)
  const recentExpenses = (recentExpensesJson?.data as ExpenseRow[]) ?? [];
  const recentIncomes = (recentIncomesJson?.data as IncomeRow[]) ?? [];

  const recentExpenseLines = recentExpenses.map(
    (e) => `  ${new Date(e.date).toLocaleDateString('es-PE')} | ${e.description} | ${e.category?.name ?? 'Sin cat.'} | S/ ${Number(e.amount).toFixed(2)}`,
  );
  const recentIncomeLines = recentIncomes.map(
    (i) => `  ${new Date(i.date).toLocaleDateString('es-PE')} | ${i.description} | ${i.source} | S/ ${Number(i.amount).toFixed(2)}`,
  );

  // 8. Loans, debts, savings
  const allLoans = (allLoansJson?.data as LoanRow[]) ?? [];
  const allDebts = (allDebtsJson?.data as DebtRow[]) ?? [];
  const savingsArray: SavingRow[] = Array.isArray(savingsJson?.data) ? savingsJson.data : (savingsJson?.data ? [savingsJson.data] : []);

  const loansList = formatList(
    allLoans.map(
      (l) =>
        `${l.borrowerName} | Prestado: S/ ${Number(l.principal).toFixed(2)} | Total a cobrar: S/ ${Number(l.totalAmount).toFixed(2)} | Cuota: S/ ${Number(l.installmentAmount).toFixed(2)} x ${l.numberOfInstallments} | Estado: ${l.status} | Fecha: ${new Date(l.loanDate).toLocaleDateString('es-PE')}${l.notes ? ` | Nota: ${l.notes}` : ''}`,
    ),
  );

  const debtsList = formatList(
    allDebts.map((db) => {
      const pending = Number(db.totalAmount) - Number(db.paidAmount);
      return `${db.creditorName} | Tipo: ${db.debtType} | Total: S/ ${Number(db.totalAmount).toFixed(2)} | Pagado: S/ ${Number(db.paidAmount).toFixed(2)} | Pendiente: S/ ${pending.toFixed(2)} | Estado: ${db.status}${db.dueDate ? ` | Vence: ${new Date(db.dueDate).toLocaleDateString('es-PE')}` : ''}`;
    }),
  );

  const savingsList = formatList(
    savingsArray.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      return `${g.name} | Meta: S/ ${target.toFixed(2)} | Ahorrado: S/ ${current.toFixed(2)} | ${pct}% | Estado: ${g.status}${g.targetDate ? ` | Fecha objetivo: ${new Date(g.targetDate).toLocaleDateString('es-PE')}` : ''}`;
    }),
  );

  // 9. Dashboard global totals
  const d = dashboardJson?.data as {
    income: { total: number };
    expenses: { total: number };
    debtPayments: { total: number };
    loanDisbursements: { total: number };
    loanCollections: { total: number };
    balance: number;
    debts: { totalPending: number };
    savings: { totalSaved: number; goalsCount: number };
    loans: { totalPending: number; activeLoans: number; completedLoans: number; overdueLoans: number };
  } | undefined;

  // 10. Build system prompt
  const systemPrompt = `Eres un asesor financiero personal de ${user.name}.
Solo tienes acceso a los datos financieros de este usuario específico.
Hoy es ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje y responde SIEMPRE en ese mismo idioma.

INSTRUCCIÓN DE FORMATO: Usa texto plano sin markdown. No uses asteriscos, almohadillas ni símbolos de formato. Usa saltos de línea para separar ideas. Sé amigable y profesional.

INSTRUCCIÓN DE EXTENSIÓN: Adapta la extensión de tu respuesta a la complejidad de la pregunta. Para preguntas simples sé breve. Para análisis financieros sé detallado.

━━━ RESUMEN GLOBAL HISTÓRICO (acumulado total) ━━━
Ingresos totales: S/ ${Number(d?.income?.total ?? 0).toFixed(2)}
Gastos totales: S/ ${Number(d?.expenses?.total ?? 0).toFixed(2)}
Pagos a deudas totales: S/ ${Number(d?.debtPayments?.total ?? 0).toFixed(2)}
Préstamos desembolsados totales: S/ ${Number(d?.loanDisbursements?.total ?? 0).toFixed(2)}
Cobros de préstamos totales: S/ ${Number(d?.loanCollections?.total ?? 0).toFixed(2)}
Balance general: S/ ${Number(d?.balance ?? 0).toFixed(2)}
Deudas pendientes: S/ ${Number(d?.debts?.totalPending ?? 0).toFixed(2)}
Ahorros acumulados: S/ ${Number(d?.savings?.totalSaved ?? 0).toFixed(2)} en ${d?.savings?.goalsCount ?? 0} meta(s)
Préstamos activos: ${d?.loans?.activeLoans ?? 0} | Completados: ${d?.loans?.completedLoans ?? 0} | Vencidos: ${d?.loans?.overdueLoans ?? 0}

━━━ GASTOS POR MES — ÚLTIMOS 12 MESES (desglose por categoría) ━━━
${expensesMonthlySummary.length > 0 ? expensesMonthlySummary.join('\n\n') : 'Sin gastos registrados'}

━━━ INGRESOS POR MES — ÚLTIMOS 12 MESES (desglose por fuente) ━━━
${incomesMonthlySummary.length > 0 ? incomesMonthlySummary.join('\n\n') : 'Sin ingresos registrados'}

━━━ DETALLE DE TRANSACCIONES RECIENTES ━━━
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

  // 11. Get last user message for saving history
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserText = lastUserMsg ? getTextFromParts(lastUserMsg.parts) : '';

  // 12. Convert UIMessages to ModelMessages for Gemini
  const modelMessages = await convertToModelMessages(messages);

  // 13. Stream response
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
        }).catch(() => {});
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
