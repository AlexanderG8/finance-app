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

function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
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

  // 3. Fetch ALL financial data in parallel (no month filter)
  const [dashboardRes, allExpensesRes, allIncomesRes, allDebtsRes, savingsRes, allLoansRes] = await Promise.all([
    fetch(`${API_URL}/dashboard/summary`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/expenses?limit=500`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/incomes?limit=300`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/debts?limit=100`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/savings`, { headers: { Authorization: authHeader } }),
    fetch(`${API_URL}/loans?limit=100`, { headers: { Authorization: authHeader } }),
  ]);

  const [dashboardJson, allExpensesJson, allIncomesJson, allDebtsJson, savingsJson, allLoansJson] = await Promise.all([
    dashboardRes.json(),
    allExpensesRes.json(),
    allIncomesRes.json(),
    allDebtsRes.json(),
    savingsRes.json(),
    allLoansRes.json(),
  ]);

  // 4. Types
  type ExpenseRow = { date: string; description: string; category?: { name: string }; amount: number };
  type IncomeRow = { date: string; description: string; source: string; amount: number };
  type LoanRow = { borrowerName: string; principal: number; totalAmount: number; installmentAmount: number; numberOfInstallments: number; status: string; loanDate: string; notes?: string };
  type DebtRow = { creditorName: string; totalAmount: number; paidAmount: number; status: string; dueDate?: string; debtType: string };
  type SavingRow = { name: string; targetAmount: number; currentAmount: number; status: string; targetDate?: string };

  const allExpenses = (allExpensesJson.data as ExpenseRow[]) ?? [];
  const allIncomes = (allIncomesJson.data as IncomeRow[]) ?? [];
  const allLoans = (allLoansJson.data as LoanRow[]) ?? [];
  const allDebts = (allDebtsJson.data as DebtRow[]) ?? [];
  const savingsArray: SavingRow[] = Array.isArray(savingsJson.data) ? savingsJson.data : (savingsJson.data ? [savingsJson.data] : []);

  // 5. Group expenses by month
  const expensesByMonth = new Map<string, { total: number; byCategory: Map<string, number> }>();
  const now = new Date();
  const recentCutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1); // last 2 months detail
  const recentExpenses: string[] = [];

  allExpenses.forEach((e) => {
    const d = new Date(e.date);
    const key = monthLabel(d);
    if (!expensesByMonth.has(key)) {
      expensesByMonth.set(key, { total: 0, byCategory: new Map() });
    }
    const entry = expensesByMonth.get(key)!;
    const amount = Number(e.amount);
    entry.total += amount;
    const cat = e.category?.name ?? 'Sin categoría';
    entry.byCategory.set(cat, (entry.byCategory.get(cat) ?? 0) + amount);

    if (d >= recentCutoff) {
      recentExpenses.push(`  ${d.toLocaleDateString('es-PE')} | ${e.description} | ${cat} | S/ ${amount.toFixed(2)}`);
    }
  });

  // 6. Group incomes by month
  const incomesByMonth = new Map<string, { total: number; bySource: Map<string, number> }>();
  const recentIncomes: string[] = [];

  allIncomes.forEach((i) => {
    const d = new Date(i.date);
    const key = monthLabel(d);
    if (!incomesByMonth.has(key)) {
      incomesByMonth.set(key, { total: 0, bySource: new Map() });
    }
    const entry = incomesByMonth.get(key)!;
    const amount = Number(i.amount);
    entry.total += amount;
    entry.bySource.set(i.source, (entry.bySource.get(i.source) ?? 0) + amount);

    if (d >= recentCutoff) {
      recentIncomes.push(`  ${d.toLocaleDateString('es-PE')} | ${i.description} | ${i.source} | S/ ${amount.toFixed(2)}`);
    }
  });

  // 7. Format monthly expense summary
  const expensesMonthlySummary = Array.from(expensesByMonth.entries())
    .map(([month, data]) => {
      const cats = Array.from(data.byCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat, total]) => `    • ${cat}: S/ ${total.toFixed(2)}`)
        .join('\n');
      return `${month} | Total: S/ ${data.total.toFixed(2)}\n${cats}`;
    })
    .join('\n\n');

  // 8. Format monthly income summary
  const incomesMonthlySummary = Array.from(incomesByMonth.entries())
    .map(([month, data]) => {
      const sources = Array.from(data.bySource.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([src, total]) => `    • ${src}: S/ ${total.toFixed(2)}`)
        .join('\n');
      return `${month} | Total: S/ ${data.total.toFixed(2)}\n${sources}`;
    })
    .join('\n\n');

  // 9. Format loans
  const loansList = formatList(
    allLoans.map((l) =>
      `${l.borrowerName} | Prestado: S/ ${Number(l.principal).toFixed(2)} | Total a cobrar: S/ ${Number(l.totalAmount).toFixed(2)} | Cuota: S/ ${Number(l.installmentAmount).toFixed(2)} x ${l.numberOfInstallments} | Estado: ${l.status} | Fecha: ${new Date(l.loanDate).toLocaleDateString('es-PE')}${l.notes ? ` | Nota: ${l.notes}` : ''}`,
    ),
  );

  // 10. Format debts
  const debtsList = formatList(
    allDebts.map((db) =>
      `${db.creditorName} | Tipo: ${db.debtType} | Total: S/ ${Number(db.totalAmount).toFixed(2)} | Pagado: S/ ${Number(db.paidAmount).toFixed(2)} | Pendiente: S/ ${(Number(db.totalAmount) - Number(db.paidAmount)).toFixed(2)} | Estado: ${db.status}${db.dueDate ? ` | Vence: ${new Date(db.dueDate).toLocaleDateString('es-PE')}` : ''}`,
    ),
  );

  // 11. Format savings
  const savingsList = formatList(
    savingsArray.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      return `${g.name} | Meta: S/ ${target.toFixed(2)} | Ahorrado: S/ ${current.toFixed(2)} | ${pct}% | Estado: ${g.status}${g.targetDate ? ` | Fecha objetivo: ${new Date(g.targetDate).toLocaleDateString('es-PE')}` : ''}`;
    }),
  );

  // 12. Dashboard global totals
  const d = dashboardJson.data as {
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

  // 13. Build system prompt
  const systemPrompt = `Eres un asesor financiero personal de ${user.name}.
Solo tienes acceso a los datos financieros de este usuario específico.
Hoy es ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje y responde SIEMPRE en ese mismo idioma.

INSTRUCCIÓN DE FORMATO: Usa texto plano sin markdown. No uses asteriscos, almohadillas ni símbolos de formato. Usa saltos de línea para separar ideas. Sé amigable y profesional.

INSTRUCCIÓN DE EXTENSIÓN: Adapta la extensión de tu respuesta a la complejidad de la pregunta. Para preguntas simples sé breve. Para análisis financieros sé detallado.

━━━ RESUMEN GLOBAL HISTÓRICO (acumulado total) ━━━
Ingresos totales: S/ ${d?.income?.total?.toFixed(2) ?? '0.00'}
Gastos totales: S/ ${d?.expenses?.total?.toFixed(2) ?? '0.00'}
Pagos a deudas totales: S/ ${d?.debtPayments?.total?.toFixed(2) ?? '0.00'}
Préstamos desembolsados totales: S/ ${d?.loanDisbursements?.total?.toFixed(2) ?? '0.00'}
Cobros de préstamos totales: S/ ${d?.loanCollections?.total?.toFixed(2) ?? '0.00'}
Balance general: S/ ${d?.balance?.toFixed(2) ?? '0.00'}
Deudas pendientes: S/ ${d?.debts?.totalPending?.toFixed(2) ?? '0.00'}
Ahorros acumulados: S/ ${d?.savings?.totalSaved?.toFixed(2) ?? '0.00'} en ${d?.savings?.goalsCount ?? 0} meta(s)
Préstamos activos: ${d?.loans?.activeLoans ?? 0} | Completados: ${d?.loans?.completedLoans ?? 0} | Vencidos: ${d?.loans?.overdueLoans ?? 0}

━━━ GASTOS POR MES (desglose por categoría) ━━━
${expensesMonthlySummary || 'Sin gastos registrados'}

━━━ INGRESOS POR MES (desglose por fuente) ━━━
${incomesMonthlySummary || 'Sin ingresos registrados'}

━━━ DETALLE DE TRANSACCIONES RECIENTES (últimos 2 meses) ━━━
Gastos recientes:
${recentExpenses.length > 0 ? recentExpenses.join('\n') : '  Ninguno'}

Ingresos recientes:
${recentIncomes.length > 0 ? recentIncomes.join('\n') : '  Ninguno'}

━━━ TODOS LOS PRÉSTAMOS ━━━
${loansList}

━━━ TODAS LAS DEUDAS ━━━
${debtsList}

━━━ METAS DE AHORRO ━━━
${savingsList}

REGLAS:
- Usa monetos en soles (S/) para valores en PEN.
- Si el usuario pregunta por datos que no están en el contexto, dilo honestamente.
- No inventes cifras ni datos que no estén en el contexto.
- Puedes calcular totales, promedios y comparativas a partir de los datos disponibles.`;

  // 14. Get last user message for saving history
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserText = lastUserMsg ? getTextFromParts(lastUserMsg.parts) : '';

  // 15. Convert UIMessages to ModelMessages for Gemini
  const modelMessages = await convertToModelMessages(messages);

  // 16. Stream response
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
