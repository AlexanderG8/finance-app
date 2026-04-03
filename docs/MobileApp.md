# 📱 Finance App — Fase 2: Aplicación Mobile
## Documento de Planificación y Desarrollo

> **LEER COMPLETAMENTE ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO.**
> Este documento es la fuente de verdad para la Fase 2 (Mobile). Complementa al `CLAUDE.md` raíz del proyecto.

---

## 🎯 Objetivo de la Fase 2

Desarrollar la aplicación mobile de **Personal Finance App** usando **React Native con Expo**, consumiendo exactamente la misma API REST ya construida en la Fase 1 (`apps/api`). El usuario final tendrá la misma experiencia y datos que en la versión web, accesible desde su teléfono.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────┐
│  React Native + Expo (Mobile)   │  → apps/mobile
│  TypeScript + NativeWind        │
└──────────────┬──────────────────┘
               │ HTTP (axios) — mismo contrato que la web
               ▼
┌─────────────────────────────────┐
│   Node.js + Express (API REST)  │  → Puerto 4000 (ya construida)
│      TypeScript + Zod           │
└──────────────┬──────────────────┘
               │ Prisma Client
               ▼
┌─────────────────────────────────┐
│   PostgreSQL — NeonDB            │
│   (Serverless PostgreSQL)        │
└─────────────────────────────────┘
```

### Decisiones de arquitectura:
- La app mobile **NO duplica lógica de negocio** — todo viene de `apps/api`.
- Se reutilizan los **tipos compartidos** de `packages/shared` (mismo monorepo).
- Los **Zustand stores** y **hooks** se inspiran directamente en la versión web pero adaptados a React Native.
- Las funcionalidades de **IA** se consumen desde endpoints dedicados en `apps/api` (no dependen de Next.js).
- El **token de acceso** se almacena en **Expo SecureStore** (equivalente seguro a memoria + cookie en web).

---

## 📁 Estructura de Carpetas

```
finance-app/
└── apps/
    └── mobile/                          # Expo React Native App
        ├── src/
        │   ├── app/                     # Expo Router (file-based routing)
        │   │   ├── (auth)/              # Grupo de rutas no autenticadas
        │   │   │   ├── _layout.tsx      # Stack layout para auth
        │   │   │   ├── login.tsx
        │   │   │   ├── register.tsx
        │   │   │   └── forgot-password.tsx
        │   │   ├── (tabs)/              # Grupo de rutas autenticadas (Tab Bar)
        │   │   │   ├── _layout.tsx      # Tab Bar layout con 6 tabs
        │   │   │   ├── index.tsx        # Dashboard (tab 1)
        │   │   │   ├── expenses.tsx     # Gastos (tab 2)
        │   │   │   ├── loans.tsx        # Préstamos (tab 3)
        │   │   │   ├── debts.tsx        # Deudas (tab 4)
        │   │   │   ├── savings.tsx      # Ahorros (tab 5)
        │   │   │   └── more.tsx         # Más: Ingresos, IA, Ajustes (tab 6)
        │   │   ├── expenses/
        │   │   │   └── [id].tsx         # Detalle de gasto
        │   │   ├── loans/
        │   │   │   └── [id].tsx         # Detalle de préstamo + cuotas
        │   │   ├── debts/
        │   │   │   └── [id].tsx         # Detalle de deuda + pagos
        │   │   ├── savings/
        │   │   │   └── [id].tsx         # Detalle de meta de ahorro
        │   │   ├── incomes/
        │   │   │   └── index.tsx        # Listado de ingresos
        │   │   ├── ai-chat/
        │   │   │   └── index.tsx        # Chat con IA
        │   │   ├── settings/
        │   │   │   └── index.tsx        # Configuración de cuenta
        │   │   ├── _layout.tsx          # Root layout (auth guard)
        │   │   └── +not-found.tsx       # Pantalla 404
        │   │
        │   ├── components/
        │   │   ├── ui/                  # Componentes base reutilizables
        │   │   │   ├── Button.tsx
        │   │   │   ├── Input.tsx
        │   │   │   ├── Card.tsx
        │   │   │   ├── Badge.tsx
        │   │   │   ├── Skeleton.tsx
        │   │   │   ├── ProgressBar.tsx
        │   │   │   ├── Select.tsx       # Modal picker nativo
        │   │   │   └── EmptyState.tsx
        │   │   ├── layout/
        │   │   │   ├── ScreenHeader.tsx # Header reutilizable por pantalla
        │   │   │   └── SafeAreaWrapper.tsx
        │   │   ├── dashboard/
        │   │   │   ├── StatCard.tsx
        │   │   │   ├── BalanceChart.tsx
        │   │   │   ├── ExpensesPieChart.tsx
        │   │   │   ├── UpcomingPayments.tsx
        │   │   │   ├── AIMonthlySummary.tsx
        │   │   │   └── AIAnomalyAlert.tsx
        │   │   ├── expenses/
        │   │   │   ├── ExpenseCard.tsx
        │   │   │   ├── ExpenseFormSheet.tsx   # Bottom sheet formulario
        │   │   │   ├── ExpenseFilters.tsx
        │   │   │   └── BudgetProgress.tsx
        │   │   ├── loans/
        │   │   │   ├── LoanCard.tsx
        │   │   │   ├── LoanFormSheet.tsx
        │   │   │   ├── InstallmentList.tsx
        │   │   │   └── PaymentSheet.tsx
        │   │   ├── debts/
        │   │   │   ├── DebtCard.tsx
        │   │   │   ├── DebtFormSheet.tsx
        │   │   │   ├── PaymentSheet.tsx
        │   │   │   └── AIDebtStrategy.tsx
        │   │   ├── savings/
        │   │   │   ├── SavingGoalCard.tsx
        │   │   │   ├── SavingGoalFormSheet.tsx
        │   │   │   ├── ContributeSheet.tsx
        │   │   │   └── AISavingsAdvice.tsx
        │   │   ├── incomes/
        │   │   │   ├── IncomeCard.tsx
        │   │   │   └── IncomeFormSheet.tsx
        │   │   └── ai/
        │   │       ├── ChatMessage.tsx
        │   │       ├── ChatInput.tsx
        │   │       └── TypingIndicator.tsx
        │   │
        │   ├── hooks/                   # Custom hooks (misma lógica que web)
        │   │   ├── useDashboard.ts
        │   │   ├── useExpenses.ts
        │   │   ├── useLoans.ts
        │   │   ├── useDebts.ts
        │   │   ├── useSavings.ts
        │   │   ├── useIncomes.ts
        │   │   └── useAIChat.ts
        │   │
        │   ├── lib/
        │   │   ├── api-client.ts        # Axios instance (misma base que web)
        │   │   ├── auth.ts              # Helpers de autenticación
        │   │   ├── storage.ts           # Expo SecureStore wrapper
        │   │   └── utils.ts             # formatCurrency, formatDate, etc.
        │   │
        │   ├── stores/
        │   │   └── auth.store.ts        # Zustand auth store
        │   │
        │   └── constants/
        │       ├── colors.ts            # Paleta de colores (igual que web)
        │       └── layout.ts            # Spacing, border radius, etc.
        │
        ├── assets/
        │   ├── images/
        │   │   ├── icon.png
        │   │   └── splash.png
        │   └── fonts/
        ├── app.json                     # Expo config
        ├── babel.config.js
        ├── metro.config.js
        ├── tsconfig.json
        └── package.json
```

---

## 🛠️ Stack Tecnológico

### Mobile (`apps/mobile`)
```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "react-native": "0.76.x",
  "react": "18.x",
  "typescript": "5.x",
  "nativewind": "~4.x",
  "tailwindcss": "3.x",
  "zustand": "4.x",
  "axios": "1.x",
  "react-hook-form": "7.x",
  "zod": "3.x",
  "@hookform/resolvers": "3.x",
  "date-fns": "3.x",
  "expo-secure-store": "~14.x",
  "expo-notifications": "~0.29.x",
  "expo-font": "~13.x",
  "expo-splash-screen": "~0.29.x",
  "expo-status-bar": "~2.x",
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x",
  "react-native-safe-area-context": "4.x",
  "react-native-screens": "~4.x",
  "@gorhom/bottom-sheet": "~5.x",
  "victory-native": "~41.x",
  "@shopify/react-native-skia": "~1.x"
}
```

> ⚠️ **NO instales ninguna librería que no esté en esta lista sin consultarlo primero.**

### Reutilizado del monorepo
```
@finance-app/shared   → Tipos TypeScript compartidos (ya existente)
```

---

## 🔐 Autenticación en Mobile

### Diferencia clave respecto a la web:

| Aspecto | Web (Fase 1) | Mobile (Fase 2) |
|---------|-------------|-----------------|
| Access Token | Memoria (Zustand) | Memoria (Zustand) |
| Refresh Token | `localStorage` | `Expo SecureStore` |
| Cookies | httpOnly cookie | No aplica en RN |

### Flujo de autenticación:
```
1. Login → recibe { accessToken, refreshToken }
2. accessToken → se guarda en Zustand store (memoria)
3. refreshToken → se guarda en Expo SecureStore (persistente y seguro)
4. Al abrir la app → leer refreshToken de SecureStore → renovar accessToken
5. Al logout → limpiar Zustand + limpiar SecureStore
```

### `storage.ts` — wrapper de SecureStore:
```typescript
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'finance_app_refresh_token';

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

---

## 🌐 Conexión a la API

### `api-client.ts`:
```typescript
import axios from 'axios';

// En desarrollo: IP local de tu máquina (no localhost — el emulador no lo resuelve)
// En producción: URL del servidor deployado
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.x.x:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});
```

> ⚠️ En el emulador Android, `localhost` no apunta a tu máquina host. Usar la IP local de la máquina (ej: `192.168.1.100`) o `10.0.2.2` para emulador Android de Android Studio.

### Variables de entorno (`apps/mobile/.env`):
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api/v1
```

> En Expo, las variables públicas deben tener el prefijo `EXPO_PUBLIC_`.

---

## 🤖 Funcionalidades de IA en Mobile

Las features de IA en la Fase 1 web se implementaron como **Next.js Route Handlers** que llaman a Google Gemini. Para la app mobile, estas deben migrarse al **backend Express** (`apps/api`) para ser accesibles sin depender del despliegue de Next.js.

### Endpoints de IA a agregar en `apps/api`:

```
POST /api/v1/ai/monthly-summary      → Resumen mensual inteligente
POST /api/v1/ai/budget-recommendations → Recomendaciones de presupuesto
POST /api/v1/ai/debt-strategy         → Estrategia de pago de deudas
POST /api/v1/ai/savings-advice        → Asesoría de metas de ahorro
POST /api/v1/ai/anomalies             → Detección de anomalías en gastos
```

> El endpoint de chat (`/api/v1/chat`) ya existe en el backend — reutilizar directamente.

### Dependencias a agregar en `apps/api`:
```json
{
  "@ai-sdk/google": "^3.x",
  "ai": "^6.x"
}
```

---

## 🎨 Guía de UI/UX Mobile

### Paleta de Colores (igual que web)
```typescript
// src/constants/colors.ts
export const Colors = {
  primary:    '#1E3A5F',
  accent:     '#2E86AB',
  success:    '#28A745',
  warning:    '#F4A261',
  danger:     '#E63946',
  background: '#F8FAFC',
  card:       '#FFFFFF',
  border:     '#E2E8F0',
  textPrimary:   '#1E293B',
  textSecondary: '#64748B',
  textMuted:     '#94A3B8',
};
```

### Patrones de Navegación
```
Root Navigator (Expo Router)
├── (auth)/              → Stack: login, register, forgot-password
└── (tabs)/              → Bottom Tab Bar
    ├── index            → Dashboard
    ├── expenses         → Gastos
    ├── loans            → Préstamos
    ├── debts            → Deudas
    ├── savings          → Ahorros
    └── more             → Ingresos / Asistente IA / Configuración
```

### Componentes nativos a preferir
```
- Bottom Sheet (@gorhom/bottom-sheet) → en lugar de Modal para formularios
- FlatList / SectionList              → en lugar de map() para listas largas
- RefreshControl                      → pull-to-refresh en todas las listas
- KeyboardAvoidingView                → en todos los formularios
- SafeAreaView                        → en todas las pantallas
```

### Animaciones (React Native Reanimated)
```typescript
// Entrada de pantalla — equivalente a pageVariants de Framer Motion
import Animated, { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.duration(300)}>
  {/* contenido */}
</Animated.View>
```

### Gráficas (Victory Native con Skia)
```typescript
// Equivalente a Recharts en web
import { VictoryPie, VictoryBar } from 'victory-native';
```

---

## 📋 Plan de Sprints — Fase 2 Mobile

### Sprint M1 — Setup + Autenticación ✅ COMPLETADO
```
[x] M1.1  Inicializar Expo app en apps/mobile con TypeScript template (Expo SDK 55)
[x] M1.2  Configurar Expo Router v4 (file-based routing — grupos (auth) y (tabs))
[x] M1.3  Instalar y configurar NativeWind v4 (babel.config.js + metro.config.js + tailwind.config.js)
[x] M1.4  Configurar tsconfig.json con path aliases (@/*), jsxImportSource: nativewind, skipLibCheck
[x] M1.5  Agregar apps/mobile a turbo.json y root package.json (scripts: mobile, mobile:android)
[x] M1.6  Configurar @finance-app/shared en package.json + main: expo-router/entry
[x] M1.7  Crear src/lib/storage.ts (Expo SecureStore — access + refresh tokens)
[x] M1.8  Crear src/lib/api-client.ts (Axios con interceptores auth + refresh automático + queue)
[x] M1.9  Crear src/stores/auth.store.ts (Zustand — login, register, logout, loadAuth)
[x] M1.10 Implementar app/_layout.tsx (SplashScreen + auth guard + GestureHandlerRootView)
[x] M1.11 Pantalla Login: validación Zod min 8 chars, error específico por campo
[x] M1.12 Pantalla Register: validación Zod min 8 chars, confirmación de contraseña
[x] M1.13 Pantalla Forgot Password: form email + estado de éxito genérico (anti-enumeración)
[x] M1.14 Lógica de renovación de token al abrir app (SecureStore → /auth/me → Zustand)
[x] M1.15 Splash screen con fondo #1E3A5F y app configurada (scheme: financeapp)
```
**Notas de implementación:**
- La API devuelve `{ user, tokens: { accessToken, refreshToken } }` — NO `{ accessToken, refreshToken, user }` directamente
- Validación: la API exige `password.min(8)` — el schema Zod del mobile debe coincidir
- `EXPO_PUBLIC_API_URL`: usar IP local de la PC (no localhost) cuando se prueba en dispositivo físico

### Sprint M2 — Dashboard ✅ COMPLETADO
```
[x] M2.1  Tab Bar con 6 tabs: Dashboard 🏠, Gastos 💸, Préstamos 🤝, Deudas 💳, Ahorros 🐷, Más ☰
[x] M2.2  Hook useDashboard: GET /dashboard/summary (tipado real de la respuesta de la API)
[x] M2.3  Hook useUpcomingPayments: GET /dashboard/upcoming-payments (parseo correcto: loanInstallments + debts → array plano)
[x] M2.4  Componente StatCard (3 cards: Por cobrar, Deuda pendiente, Total ahorrado)
[x] M2.5  Componente BalanceChart (barras nativas con View — sin librería externa) + balance calculado al pie
[x] M2.6  Componente ExpensesPieChart (barras de progreso nativas por categoría con porcentaje)
[x] M2.7  Componente UpcomingPayments (lista combinada préstamos + deudas, badges de urgencia)
[x] M2.8  Card "Estado de préstamos" (activos / completados / vencidos / total cobrado)
[x] M2.9  Balance card principal con desglose completo (ver notas)
[x] M2.10 Pull-to-refresh en Dashboard (RefreshControl con Promise.all)
[ ] M2.11 AIMonthlySummary → movido a Sprint M8
[ ] M2.12 AIAnomalyAlert → movido a Sprint M8
```
**Notas de implementación:**
- `victory-native` y `@shopify/react-native-skia` **NO se usan** — incompatibles con Expo Go + RN 0.83 + Reanimated 4.x
- Las gráficas son implementaciones nativas con `View` (barras de progreso) — funcionales y sin dependencias
- La API devuelve `byCategory` como `{ category: { id, name, emoji, color }, total, count }[]` — NO `{ categoryName, emoji, color, total }[]`
- La API devuelve `loans` como `{ totalLent, totalCollected, totalPending, activeLoans, completedLoans, overdueLoans }`
- La API devuelve `debts` como `{ totalPending }` — NO `{ totalDebt, totalPaid, pendingCount }`
- `upcoming-payments` devuelve `{ loanInstallments: [], debts: [] }` — hay que combinar y mapear manualmente
- Tab "profile" eliminado — reemplazado por "debts" (💳) y "more" (☰)
- Archivos creados: `src/constants/colors.ts`, `src/lib/utils.ts`, `src/hooks/useDashboard.ts`, `src/hooks/useUpcomingPayments.ts`, `src/components/dashboard/`
- **Balance card** muestra dos filas: entradas (Ingresos, Deudas recibidas, Cobros) y salidas (Gastos, Pago deudas, Prestado). Solo se muestran los conceptos con valor > 0.
- `useDashboard` incluye los campos: `debtReceived.total`, `loanDisbursements.total`, `loanCollections.total`

### Sprint M3 — Gastos ✅ COMPLETADO
```
[x] M3.1  Hook useExpenses: GET /expenses (con filtros mes/año/categoría/método)
[x] M3.2  Hook useMonthlySummary: GET /expenses/summary/monthly
[x] M3.3  deleteExpense integrado en useExpenses (DELETE /expenses/:id → 204)
[x] M3.4  Pantalla Gastos: FlatList de ExpenseCard + selector de mes + paginación
[x] M3.5  Componente ExpenseCard: emoji categoría + descripción + monto + fecha + acciones
[x] M3.6  ExpenseFormSheet (Modal): crear/editar gasto — categoría, monto, método pago, fecha
[x] M3.7  Hook useCategories: GET /categories
[x] M3.8  Tab Resumen: gráfica de barras nativa por categoría con porcentajes
[x] M3.9  Tab Presupuesto: BudgetProgress — hook useBudgetComparison GET /budgets/comparison
[x] M3.10 Hook useExpenseForm: createExpense + updateExpense con manejo de errores
```
**Notas de implementación:**
- Pantalla tiene 3 tabs internos: Lista / Resumen / Presupuesto
- Selector horizontal de mes (Ene–Dic) en el header
- ExpenseFormSheet usa Modal nativo (no bottom sheet) con selector de categorías, métodos de pago: CASH, YAPE, PLIN, CREDIT_CARD
- BudgetProgress muestra color verde/amarillo/rojo según % del presupuesto usado
- API respuesta verificada: `{ data: Expense[], pagination }` con `category` embebido en cada gasto

### Sprint M4 — Ingresos ✅ COMPLETADO
```
[x] M4.1  Hook useIncomes: GET /incomes (filtros: mes, año, fuente, paginación) + deleteIncome
[x] M4.2  Hook useIncomeSummary: GET /incomes/summary/monthly
[x] M4.3  Hook useIncomeForm: createIncome (POST) + updateIncome (PUT)
[x] M4.4  Pantalla /incomes/index.tsx: FlatList de IncomeCard + selector de mes + tabs
[x] M4.5  Componente IncomeCard: emoji por fuente + descripción + monto verde + fecha + acciones
[x] M4.6  IncomeFormSheet (Modal): fuente, descripción, monto, método de recepción, fecha, recurrente
[x] M4.7  Tab "Resumen": desglose por fuente con barras nativas y porcentajes
[x] M4.8  Tab "Más" actualizado: ítem Ingresos navega a /incomes (disponible), otros ítems con badge Sprint
```
**Notas de implementación:**
- Pantalla con 2 tabs: Lista / Resumen
- Fuentes: SALARY, FREELANCE, BUSINESS, INVESTMENT, RENTAL, OTHER — cada una con emoji y color propio
- Métodos de recepción: YAPE, PLIN, BANK_TRANSFER, CASH (sin CREDIT_CARD — validado contra schema API)
- Pantalla accesible desde tab "Más" → navega como pantalla nueva (no dentro del tab)
- API respuesta: `{ data: Income[], pagination }` — sin campo `category` (a diferencia de gastos)

### Sprint M5 — Préstamos ✅ COMPLETADO
```
[x] M5.1  Hook useLoans: GET /loans (filtros: status, borrowerName, paginación)
[x] M5.2  Hook useLoanDetail: GET /loans/:id (incluye installments + payments)
[x] M5.3  Hook useLoanSummary: GET /loans/summary
[x] M5.4  Hook useLoanForm: createLoan (POST 201) + updateLoan (PUT) + payInstallment (POST)
[x] M5.5  Pantalla Préstamos (tabs): filtros Todos/Activos/Vencidos/Completados + FlatList
[x] M5.6  Componente LoanCard: nombre + estado badge + principal/total/cuota + navega a detalle
[x] M5.7  LoanFormSheet (Modal): preview automático de interés (15%/<1000, 20%/>=1000)
[x] M5.8  Pantalla /loans/[id]: info financiera + barra de progreso + cronograma de cuotas
[x] M5.9  Cuotas con badge de estado (PENDING/PAID/OVERDUE/PARTIAL) y botón "Cobrar"
[x] M5.10 PayInstallmentSheet (Modal): monto, método, fecha + validación vs. monto pendiente
[x] M5.11 Summary card: Por cobrar / Cobrado / Activos / Vencidos
```
**Notas de implementación:**
- El usuario ingresa la tasa de interés deseada (%) en el formulario; el service la convierte a decimal (÷100)
- **Nueva fórmula de interés**: el interés total se aplica a CADA cuota (no se divide entre cuotas)
  - `interestAmount = principal × rate` (fijo por cuota)
  - `installmentAmount = (principal/n) + interestAmount`
  - `totalProfit = interestAmount × n` (ganancia total visible en LoanCard y detalle)
- **LoanFormSheet**: la card de "Vista previa del préstamo" está siempre visible al tope del formulario (no condicional), se actualiza en tiempo real al escribir. Se usaron `style` inline en lugar de solo NativeWind para garantizar renderizado dentro de Modal.
- **Validación de balance**: antes de crear, el service verifica `balance >= principal` (balance del mes en curso)
- **Eliminar préstamo**: `useDeleteLoan` hook + Alert.alert de confirmación en LoanCard y detalle /loans/[id]
- LoanCard muestra `totalProfit` en verde
- /loans/[id] muestra `interestAmount` por cuota, `totalProfit` y botón "🗑 Eliminar" en el header
- payInstallment valida que el monto no supere el pendiente de la cuota
- Detalle incluye: progreso de cobro (barra), cobrado vs pendiente, cronograma completo
- Métodos de pago/entrega: YAPE, PLIN, BANK_TRANSFER, CASH (sin CREDIT_CARD)

### Sprint M6 — Deudas ✅ COMPLETADO
```
[x] M6.1  Hook useDebts: GET /debts (filtros: status, paginación) + deleteDebt
[x] M6.2  Hook useDebtDetail: GET /debts/:id (incluye payments[] ordenados por paidAt desc)
[x] M6.3  Hook useDebtForm: createDebt (POST 201) + updateDebt (PUT) + payDebt (POST)
[x] M6.4  Pantalla Deudas: filtros Todas/Pendientes/Parciales/Pagadas + FlatList + summary card
[x] M6.5  Componente DebtCard: acreedor + barra de progreso + badge status + total/pagado/pendiente
[x] M6.6  DebtFormSheet (Modal): acreedor, monto, cuotas opcionales, fecha vencimiento opcional
[x] M6.7  Pantalla /debts/[id]: info financiera + barra de progreso + botón pagar + historial
[x] M6.8  PayDebtSheet (Modal): monto pre-llenado con pendiente, método, fecha + validación
```
**Notas de implementación:**
- Debt tiene `numberOfInstallments` y `dueDate` opcionales (null si no aplica)
- Status automático por servidor: PENDING (0 pagado) → PARTIAL → PAID (completo)
- DebtCard toca para navegar al detalle (/debts/[id])
- Historial de pagos ordenado por `paidAt desc` (más reciente primero)
- PayDebtSheet pre-carga el método habitual de la deuda y el monto pendiente restante
- Métodos de pago: YAPE, PLIN, BANK_TRANSFER, CASH (sin CREDIT_CARD)

### Sprint M7 — Ahorros ✅ COMPLETADO
```
[x] M7.1  Hook useSavings: GET /savings (lista sin paginación, array directo)
[x] M7.2  Hook useSavingDetail: GET /savings/:id + GET /savings/:id/projection en paralelo (Promise.all)
[x] M7.3  Hook useSavingForm: createGoal (POST), updateGoal (PUT), contribute (POST /:id/contribute)
[x] M7.4  deleteGoal integrado en useSavings (DELETE /savings/:id → 204)
[x] M7.5  Pantalla Ahorros (tabs/savings.tsx): summary card (total ahorrado/objetivo/en progreso) + FlatList de SavingGoalCards
[x] M7.6  SavingGoalCard: tipo emoji (🎯/🆘/⭐), status badge, ahorrado/meta/restante, barra de progreso, targetDate, monthlyContribution
[x] M7.7  SavingGoalFormSheet: tipo selector, nombre, targetAmount+currency, monthlyContribution (opcional), DatePickerField targetDate (opcional), notas
[x] M7.8  Pantalla Detalle /savings/[id]: header con status, info financiera + barra de progreso, proyección, fechas, cambio de estado, historial de aportes
[x] M7.9  ContributeSheet: solo BANK_TRANSFER/CASH, info de meta, monto, DatePickerField, notas
[x] M7.10 AISavingsAdvice: pendiente (Sprint M8D)
```
**Notas de implementación:**
- `useSavings` retorna array directo (sin paginación), a diferencia de otros endpoints
- `useSavingDetail` hace fetch paralelo de detalle + proyección con `Promise.all`
- La proyección muestra: aporte mensual, meses restantes, fecha estimada, indicador isOnTrack
- Métodos de pago restringidos en ContributeSheet: solo BANK_TRANSFER y CASH
- Status puede cambiarse desde el detalle: IN_PROGRESS / PAUSED / COMPLETED
- El botón "Agregar aporte" se oculta cuando status === 'COMPLETED'

### Sprint M8 — Inteligencia Artificial Completa ✅ COMPLETADO
> Cubre TODAS las funcionalidades de IA del Sprint 10 (10A + 10B + 10C) de la web, migradas/adaptadas para Mobile.

#### M8A — Migración de endpoints IA al backend Express ✅
```
[x] M8A.1  apps/api/src/routes/ai.routes.ts y controllers/ai.controller.ts:
           POST /api/v1/ai/chat                   → Chat no-streaming (generateText)
           POST /api/v1/ai/monthly-summary         → Resumen narrativo del mes
           POST /api/v1/ai/budget-recommendations  → Recomendaciones de presupuesto
           POST /api/v1/ai/debt-strategy           → Estrategia de pago de deudas
           POST /api/v1/ai/savings-advice          → Asesoría de meta de ahorro
           POST /api/v1/ai/anomalies               → Detección de gastos inusuales
[x] M8A.2  Instalado en apps/api: @ai-sdk/google + ai
[x] M8A.3  GOOGLE_GENERATIVE_AI_API_KEY ya existía en apps/api/.env
[x] M8A.4  Modelo: gemini-2.0-flash en todos los endpoints
[x] M8A.5  Cada endpoint usa authMiddleware + llama servicios Prisma directamente
[x] M8A.6  Chat history reutiliza chatService (GET/POST/DELETE /api/v1/chat/history)
```

#### M8B — Chat Financiero ✅
```
[x] M8B.1  Hook useAIChat: POST /api/v1/ai/chat (respuesta completa, no streaming)
[x] M8B.2  Pantalla /ai-chat/index.tsx: interfaz tipo mensajería
[x] M8B.3  ChatBubble: burbuja usuario (derecha, fondo #1E3A5F) + IA (izquierda, fondo gris)
[x] M8B.4  Input con TextInput multilínea + botón enviar + KeyboardAvoidingView
[x] M8B.5  TypingIndicator: texto "Escribiendo..." mientras espera respuesta
[x] M8B.6  Preguntas sugeridas en estado vacío (5 cards tocables que pre-llenan el input)
[x] M8B.7  Botón "Limpiar" → DELETE /api/v1/chat/history + setMessages([])
[x] M8B.8  Historial persistente: carga GET /api/v1/chat/history al entrar
[x] M8B.9  System prompt completo con contexto financiero: ingresos, gastos, deudas, ahorros, préstamos
[x] M8B.10 Fix teclado oculta el input en Android: KeyboardAvoidingView como wrapper más externo,
           SafeAreaView con edges={['top','left','right']} adentro + softwareKeyboardLayoutMode: "resize"
           en app.json (Android) — Expo SDK 51+ cambió el default a "pan" rompiendo KeyboardAvoidingView
[x] M8B.11 Fix GOOGLE_GENERATIVE_AI_API_KEY no cargada: dotenv usaba process.cwd() (raíz del monorepo)
           en lugar de la ruta relativa al archivo fuente. Fix: loadEnv({ path: join(__dirname, '../.env') })
[x] M8B.12 Mensajes de error específicos en useAIChat (sin Alert): banner inline rojo con botón ✕.
           Distingue: timeout, sin conexión, error 500 servidor, rate limit 429, error genérico
[x] M8B.13 Timeout de apiClient aumentado de 10s a 60s para soportar respuestas lentas de IA
```

#### M8C — Resumen Mensual y Recomendaciones ✅
```
[x] M8C.1  Hook useAIMonthlySummary: POST /api/v1/ai/monthly-summary
[x] M8C.2  Card "Resumen con IA 🤖" en Dashboard:
           - Botón "Generar resumen del mes"
           - ActivityIndicator mientras procesa
           - Texto generado cuando termina + botón "Regenerar"
[x] M8C.3  Hook useAIBudgetRecommendations: POST /api/v1/ai/budget-recommendations
[x] M8C.4  Card "Sugerencias con IA ✨" en tab Presupuesto de Gastos:
           - Botón "Sugerir presupuestos con IA"
           - Lista con categoryName + suggestedAmount + reasoning
           - Botón "Descartar sugerencias"
[x] M8C.5  Fix recomendaciones vacías con <3 meses de historial: el controller ahora analiza
           mes actual + últimos 3 meses. Si no hay datos devuelve noDataMessage en lugar de array vacío.
           Hook expone noDataMessage; UI muestra banner ámbar explicativo + botón "Entendido"
[x] M8C.6  Botón "Aplicar sugerencia" por cada recomendación de IA: abre BudgetFormSheet
           pre-llenado con la categoría (búsqueda case-insensitive) y el monto sugerido.
           Muestra "Aplicado ✓" en verde tras aplicar. Estado se limpia al descartar/refrescar.
           Props nuevas en BudgetFormSheet: defaultCategoryId? y defaultAmount?
```

#### M8D — Asesoría Avanzada ✅
```
[x] M8D.1  Hook useAIDebtStrategy: POST /api/v1/ai/debt-strategy
[x] M8D.2  Card "Estrategia de pago con IA 🧠" en pantalla Deudas (ListFooter):
           - Método (avalanche/snowball), explicación, orden de pago, monto mensual, meses estimados
[x] M8D.3  Hook useAISavingsAdvice: POST /api/v1/ai/savings-advice { goalId }
[x] M8D.4  Card "Asesoría con IA ✨" en Detalle de Meta de Ahorro:
           - Viabilidad, evaluación, contribución recomendada, fecha estimada, 3 tips
[x] M8D.5  Hook useAIAnomalies: POST /api/v1/ai/anomalies + AsyncStorage para descarte mensual
[x] M8D.6  Card AIAnomalyAlert en Dashboard (background check al cargar):
           - Si hay anomalías: card ámbar con % de aumento vs promedio
           - Botón "Descartar" (persiste en AsyncStorage hasta el próximo mes)
```
**Notas de implementación:**
- Chat usa `generateText` (no streaming) porque React Native no soporta SSE
- El controller llama servicios Prisma directamente (más eficiente que HTTP calls internas)
- AsyncStorage instalado: `@react-native-async-storage/async-storage@2.2.0`
- `req.user.name` no disponible en JWT — el controller consulta la BD para obtenerlo
- Modelo: `gemini-2.0-flash` (más reciente que el de la web que usaba `gemini-3.1-flash-lite-preview`)
- `dotenv` en `apps/api/src/app.ts` debe usar ruta explícita: `loadEnv({ path: join(__dirname, '../.env') })`
  porque Turborepo ejecuta desde la raíz del monorepo y `process.cwd()` no apunta a `apps/api/`
- `softwareKeyboardLayoutMode: "resize"` es obligatorio en `app.json` (sección android) desde Expo SDK 51+
  para que `KeyboardAvoidingView` funcione correctamente en Android
- `KeyboardAvoidingView` debe ser el componente más externo (antes de `SafeAreaView`) en pantallas con input
- Timeout de `apiClient` fijado en 60 000 ms (60 s) — las llamadas a Gemini pueden superar los 10 s por defecto
- Errores de IA se muestran como banner inline (no Alert) con mensajes específicos según código HTTP / código axios

### Sprint M9 — Notificaciones Push ✅ COMPLETADO
```
[x] M9.1  Configurar Expo Notifications en app.json (plugin con icon, color #1E3A5F, iosDisplayInForeground)
[x] M9.2  Solicitar permisos al usuario en primer login mediante hook usePushNotifications
           Si los permisos son denegados: setPushEnabled(false) en SecureStore y se muestra alerta al usuario
[x] M9.3  Registrar Expo Push Token en el backend: PUT /api/v1/auth/push-token { token: string | null }
           Schema Zod valida que empiece con "ExponentPushToken[". Token null = deshabilitar.
[x] M9.4  Migración BD: campo expoPushToken String? en modelo User (20260322052207_add_expo_push_token)
[x] M9.5  notifications.service.ts actualizado: sendExpoPushNotification() junto a cada email:
           - checkUpcomingInstallments → push "⏰ Cuota por vencer"
           - checkOverdueInstallments  → push "🚨 Cuota vencida"
           - checkBudgetAlerts         → push "[emoji] Alerta de presupuesto"
           - checkSavingGoalMilestones → push "[🎉/🚀/⭐] Meta al XX%"
[x] M9.6  Notificación foreground: setNotificationHandler en usePushNotifications.ts muestra la
           notificación aunque la app esté abierta (shouldShowAlert: true, shouldPlaySound: true)
[x] M9.7  Push para cuota vencida y meta de ahorro completada implementados en M9.5
[x] M9.8  Pantalla Configuración (app/settings/index.tsx): toggle Switch de notificaciones push
           con ActivityIndicator mientras cambia de estado. Navega desde tab "Más" → Configuración.
```
**Notas de implementación:**
- Push Token solo disponible en dispositivos reales y Expo Go (no en simuladores/emuladores)
  → getExpoPushToken() falla silenciosamente en simuladores con try/catch
- Canal Android "default" configurado con AndroidImportance.MAX y vibración
- lib/push.ts: helper puro con fetch a https://exp.host/--/api/v2/push/send (sin expo-server-sdk)
- storage.ts: nuevos métodos getPushEnabled/setPushEnabled en SecureStore (clave: push_notifications_enabled)
- usePushNotifications: hook que se llama en _layout.tsx cuando isAuthenticated cambia a true
- more.tsx: "Configuración" habilitado con ruta /settings (antes Sprint M10)
- El token se registra automáticamente al autenticarse; se desregistra con token: null al deshabilitar

### Sprint M10 — Configuración + QA + Deploy ✅ PARCIAL (M10.1–M10.6)
```
[x] M10.1 Pantalla Settings: editar perfil inline (nombre + moneda PEN/USD)
          - TextInput para nombre con validación (mín. 2 chars)
          - Selector de moneda PEN/USD con chips
          - PUT /auth/profile + setUser en Zustand al guardar
          - Cancelar restaura los valores originales
[x] M10.2 Logout: Alert de confirmación → logout() + router.replace('/(auth)/login')
[x] M10.3 Manejo global de errores de red
          - network.store.ts (Zustand): isOffline / setOffline
          - api-client.ts: interceptor detecta ECONNABORTED, ERR_NETWORK, ERR_CANCELED, !response
            → setOffline(true), auto-oculta a los 4 segundos
          - _layout.tsx: banner rojo absoluto en top cuando isOffline
[x] M10.4 Empty states en todas las pantallas (emoji + texto + botón de acción)
          - loans.tsx, debts.tsx, savings.tsx, expenses.tsx, incomes/index.tsx
[x] M10.5 Loading states consistentes (SkeletonList en todas las listas)
          - SkeletonCard.tsx: animación de opacity pulsante con Animated de RN
          - SkeletonList: renderiza N SkeletonCard apilados
          - Aplicado en: loans.tsx, debts.tsx, savings.tsx, expenses.tsx, incomes/index.tsx
[x] M10.6 Pull-to-refresh en todas las pantallas con listas
          - RefreshControl en todos los FlatList de lista y resumen
[ ] M10.7 Pruebas en Android (emulador + dispositivo físico)
[ ] M10.8 Pruebas en iOS (simulador + dispositivo físico)
[ ] M10.9 Configurar EAS Build (Expo Application Services) para generar APK/IPA
[ ] M10.10 Deploy en Expo Go para pruebas internas (QR code)
[ ] M10.11 ⚠️ ANTES DEL BUILD: Verificar notificaciones push en Android
           - En usePushNotifications.ts, confirmar que isRemotePushSupported detecta
             correctamente el build (Constants.appOwnership !== 'expo' en EAS builds)
           - Probar registerForPushNotifications() en un development build de Android
           - Verificar que el token llega correctamente al backend (PUT /auth/push-token)
           - Verificar que las notificaciones push se reciben en dispositivo físico
[ ] M10.12 Generar build de producción: APK (Android) + IPA (iOS)
```

---

## 🛠️ Mejoras Adicionales implementadas (post Sprint M10)

### Balance real del dashboard (Web + Mobile)
El endpoint `GET /dashboard/summary` retorna ahora todos los componentes del balance:
```
income         → ingresos del mes           (+)
debtReceived   → deudas registradas el mes  (+) al registrar una deuda, ese dinero suma al balance
loanCollections → cobros de cuotas el mes   (+)
expenses       → gastos del mes             (−)
debtPayments   → pagos de deudas el mes     (−)
loanDisbursements → préstamos desembolsados (−)
balance = income + debtReceived + loanCollections − expenses − debtPayments − loanDisbursements
```

### Nueva lógica de préstamos (Web + Mobile)
- **Interés por cuota**: el interés total (`principal × rate`) se cobra en CADA cuota, no se divide.
- **Tasa configurable**: el usuario ingresa el porcentaje de interés que desea cobrar.
- **totalProfit**: nueva columna en DB — ganancia total del préstamo (`interestAmount × n`).
- **Validación de balance**: no se puede crear un préstamo si el balance del mes es insuficiente.
- **Eliminar préstamo**: `DELETE /api/v1/loans/:id` — cascade elimina cuotas y pagos.

---

## 🔄 Diferencias Clave Web vs Mobile

| Concepto | Web (Next.js) | Mobile (React Native) |
|----------|--------------|----------------------|
| Routing | App Router (carpetas/archivos) | Expo Router (mismo paradigma) |
| Estilos | Tailwind CSS | NativeWind (Tailwind para RN) |
| Modales/Forms | Dialog (shadcn/ui) | Bottom Sheet (@gorhom) |
| Listas | `map()` + `div` | `FlatList` / `SectionList` |
| Animaciones | Framer Motion | React Native Reanimated |
| Gráficas | Recharts | Barras nativas con View (Victory Native descartado — incompatible con Expo Go + RN 0.83) |
| Token storage | localStorage | Expo SecureStore |
| Íconos | Lucide React | @expo/vector-icons (Ionicons) |
| Navegación global | Links de Next.js | Expo Router (`router.push`) |
| Pull to refresh | No aplica | RefreshControl en FlatList |
| Teclado | Nativo del navegador | KeyboardAvoidingView |
| Fuentes tipográficas | Inter (Google Fonts CSS) | expo-font (carga manual) |

---

## ⚙️ Variables de Entorno

### `apps/mobile/.env`
```env
# URL de la API (cambiar según entorno)
# Desarrollo local Android: EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1
# Desarrollo local iOS sim: EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
# Desarrollo dispositivo físico: EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api/v1
# Producción: EXPO_PUBLIC_API_URL=https://tu-api.railway.app/api/v1
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1
```

---

## ⚠️ Errores Comunes a Evitar

```
❌ Usar localhost en la URL de la API en el emulador Android
   ✅ Usar 10.0.2.2 (Android Studio) o la IP local de tu máquina con Expo Go

❌ Usar AsyncStorage directamente para guardar tokens
   ✅ Usar Expo SecureStore — está cifrado y es más seguro

❌ Usar <div>, <p>, <span> de HTML
   ✅ Usar <View>, <Text>, <TouchableOpacity> de React Native

❌ Usar onClick en componentes RN
   ✅ Usar onPress

❌ Calcular tamaños de fuente con px fijos
   ✅ Usar el sistema de escala de NativeWind (text-sm, text-base, text-lg, etc.)

❌ Usar StyleSheet.create con colores hardcodeados
   ✅ Usar NativeWind (className) + constants/colors.ts

❌ Renderizar listas con .map() en pantallas con muchos items
   ✅ Usar FlatList con keyExtractor y getItemLayout cuando sea posible

❌ Omitir KeyboardAvoidingView en pantallas con formularios
   ✅ Wrappear formularios con KeyboardAvoidingView + behavior="padding"

❌ No manejar el caso de red offline
   ✅ Interceptor de axios que detecta errores de red y muestra mensaje amigable
```

---

## 📚 Referencias

| Tecnología | Documentación |
|-----------|---------------|
| Expo SDK 55 | https://docs.expo.dev |
| Expo Router v4 | https://docs.expo.dev/router/introduction |
| NativeWind v4 | https://www.nativewind.dev |
| React Native Reanimated | https://docs.swmansion.com/react-native-reanimated |
| @gorhom/bottom-sheet | https://gorhom.dev/react-native-bottom-sheet |
| Expo SecureStore | https://docs.expo.dev/sdk/securestore |
| Expo Notifications | https://docs.expo.dev/sdk/notifications |
| EAS Build | https://docs.expo.dev/build/introduction |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Zustand | https://zustand.docs.pmnd.rs |
| date-fns | https://date-fns.org |

---

*Versión: 2.1 — Fase 2 Mobile*
*Autor: Alexander Gomez*
*Última actualización: Marzo 2026*
*Sprints completados: M1 ✅, M2 ✅, M3 ✅, M4 ✅, M5 ✅, M6 ✅, M7 ✅, M8 ✅, M9 ✅, M10 📋 Parcial*
