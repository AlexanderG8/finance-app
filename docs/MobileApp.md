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

### Sprint M1 — Setup + Autenticación
```
[ ] M1.1  Inicializar Expo app en apps/mobile (expo init con TypeScript template)
[ ] M1.2  Configurar Expo Router (file-based routing)
[ ] M1.3  Instalar y configurar NativeWind (Tailwind para RN)
[ ] M1.4  Configurar tsconfig.json con path aliases (@/components, @/lib, etc.)
[ ] M1.5  Agregar apps/mobile a turbo.json y root package.json
[ ] M1.6  Configurar @finance-app/shared en package.json de mobile
[ ] M1.7  Crear storage.ts (Expo SecureStore wrapper)
[ ] M1.8  Crear api-client.ts (Axios instance con interceptores de auth)
[ ] M1.9  Crear auth.store.ts (Zustand — accessToken en memoria)
[ ] M1.10 Implementar Root _layout.tsx (auth guard: redirige a login si no autenticado)
[ ] M1.11 Pantalla Login: form email + password, validación Zod, llamada a /auth/login
[ ] M1.12 Pantalla Register: form nombre + email + password, llamada a /auth/register
[ ] M1.13 Pantalla Forgot Password: form email, llamada a /auth/forgot-password
[ ] M1.14 Lógica de renovación de token al abrir app (SecureStore → refresh → Zustand)
[ ] M1.15 Splash screen y app icon configurados
```

### Sprint M2 — Dashboard
```
[ ] M2.1  Tab Bar layout con 6 tabs e íconos (Dashboard, Gastos, Préstamos, Deudas, Ahorros, Más)
[ ] M2.2  Hook useDashboard: GET /dashboard/summary
[ ] M2.3  Hook useUpcomingPayments: GET /dashboard/upcoming-payments
[ ] M2.4  Componente StatCard (5 tarjetas: ingresos, gastos, por cobrar, deudas, ahorros)
[ ] M2.5  Componente BalanceChart (VictoryBar: ingresos vs gastos vs pagos de deudas)
[ ] M2.6  Componente ExpensesPieChart (VictoryPie por categoría)
[ ] M2.7  Componente UpcomingPayments (lista de próximos vencimientos)
[ ] M2.8  Componente AIMonthlySummary (POST /api/v1/ai/monthly-summary)
[ ] M2.9  Componente AIAnomalyAlert (POST /api/v1/ai/anomalies)
[ ] M2.10 Pull-to-refresh en Dashboard
```

### Sprint M3 — Gastos
```
[ ] M3.1  Hook useExpenses: GET /expenses (con filtros mes/año/categoría/método)
[ ] M3.2  Hook useMonthlySummary: GET /expenses/summary/monthly
[ ] M3.3  Hook useDeleteExpense: DELETE /expenses/:id
[ ] M3.4  Pantalla Gastos: FlatList de ExpenseCard + filtros + paginación
[ ] M3.5  Componente ExpenseCard: emoji categoría + descripción + monto + fecha
[ ] M3.6  ExpenseFormSheet (Bottom Sheet): crear/editar gasto con validación Zod
[ ] M3.7  Pantalla Detalle Gasto /expenses/[id]: info completa + editar + eliminar
[ ] M3.8  MonthlySummaryChart: gráfica de barras por categoría
[ ] M3.9  Tab Presupuesto: BudgetProgress por categoría + agregar presupuesto
[ ] M3.10 AIBudgetRecommendations: botón que llama a POST /api/v1/ai/budget-recommendations
```

### Sprint M4 — Ingresos
```
[ ] M4.1  Hook useIncomes: GET /incomes (con filtros mes/año/fuente)
[ ] M4.2  Hook useIncomeSummary: GET /incomes/summary/monthly
[ ] M4.3  Hook useDeleteIncome: DELETE /incomes/:id
[ ] M4.4  Pantalla Ingresos (en tab "Más"): FlatList de IncomeCard + filtros + paginación
[ ] M4.5  Componente IncomeCard: color por fuente + descripción + monto + fecha
[ ] M4.6  IncomeFormSheet (Bottom Sheet): crear/editar ingreso con validación Zod
[ ] M4.7  Resumen cards: total ingresos del mes + registros + desglose por fuente
```

### Sprint M5 — Préstamos
```
[ ] M5.1  Hook useLoans: GET /loans (con filtros estado/nombre/página)
[ ] M5.2  Hook useLoan: GET /loans/:id
[ ] M5.3  Hook useLoanInstallments: GET /loans/:id/installments
[ ] M5.4  Hook useLoanSummary: GET /loans/summary
[ ] M5.5  Pantalla Préstamos: grid de LoanCard (2 columnas) + filtros
[ ] M5.6  Componente LoanCard: avatar + nombre + estado + progreso
[ ] M5.7  LoanFormSheet (Bottom Sheet): crear préstamo con cálculo automático
[ ] M5.8  Pantalla Detalle Préstamo /loans/[id]: info financiera + cronograma cuotas
[ ] M5.9  Componente InstallmentList: FlatList de cuotas con estado visual
[ ] M5.10 PaymentSheet (Bottom Sheet): registrar pago de cuota
[ ] M5.11 LoanSummaryCards: total prestado, cobrado, pendiente
```

### Sprint M6 — Deudas
```
[ ] M6.1  Hook useDebts: GET /debts (con filtros estado/página)
[ ] M6.2  Hook useDebt: GET /debts/:id
[ ] M6.3  Hook useDeleteDebt: DELETE /debts/:id
[ ] M6.4  Pantalla Deudas: FlatList de DebtCard + filtros + stat cards
[ ] M6.5  Componente DebtCard: acreedor + barra de progreso + estado + monto
[ ] M6.6  DebtFormSheet (Bottom Sheet): crear/editar deuda con validación Zod
[ ] M6.7  Pantalla Detalle Deuda /debts/[id]: historial de pagos
[ ] M6.8  PaymentSheet (Bottom Sheet): registrar pago parcial o total
[ ] M6.9  AIDebtStrategy: card con estrategia de pago (POST /api/v1/ai/debt-strategy)
```

### Sprint M7 — Ahorros
```
[ ] M7.1  Hook useSavingGoals: GET /savings
[ ] M7.2  Hook useSavingGoal: GET /savings/:id
[ ] M7.3  Hook useSavingGoalProjection: GET /savings/:id/projection
[ ] M7.4  Hook useDeleteSavingGoal: DELETE /savings/:id
[ ] M7.5  Pantalla Ahorros: grid de SavingGoalCard (1-2 columnas) + stat cards
[ ] M7.6  Componente SavingGoalCard: nombre + barra de progreso + tipo + estado
[ ] M7.7  SavingGoalFormSheet (Bottom Sheet): crear/editar meta con validación Zod
[ ] M7.8  Pantalla Detalle Meta /savings/[id]: progreso + proyección + historial
[ ] M7.9  ContributeSheet (Bottom Sheet): registrar aporte
[ ] M7.10 AISavingsAdvice: card con asesoría IA (POST /api/v1/ai/savings-advice)
```

### Sprint M8 — Asistente IA (Chat)
```
[ ] M8.1  Migrar endpoints de IA de Next.js Route Handlers → Express API (/api/v1/ai/*)
[ ] M8.2  Hook useAIChat: manejo de mensajes con streaming (SSE o polling)
[ ] M8.3  Pantalla AI Chat (en tab "Más"): interfaz de chat tipo WhatsApp
[ ] M8.4  Componente ChatMessage: burbuja usuario (derecha) + IA (izquierda)
[ ] M8.5  Componente ChatInput: TextInput multilínea + botón enviar
[ ] M8.6  TypingIndicator: animación de puntos mientras la IA responde
[ ] M8.7  Preguntas sugeridas en estado vacío (igual que web)
[ ] M8.8  Botón "Nueva conversación" (limpia historial via DELETE /chat/history)
[ ] M8.9  Historial persistente: carga al entrar desde GET /chat/history
```

### Sprint M9 — Notificaciones Push
```
[ ] M9.1  Configurar Expo Notifications en app.json (permisos iOS/Android)
[ ] M9.2  Solicitar permisos de notificación al usuario en primer login
[ ] M9.3  Registrar Expo Push Token en el backend (nuevo campo en User)
[ ] M9.4  Migración BD: agregar campo expoPushToken en modelo User
[ ] M9.5  Actualizar notification.job.ts: enviar push además de email
[ ] M9.6  Notificación local: recordatorio de cuota a vencer (foreground)
[ ] M9.7  Notificación push: cuota vencida, meta de ahorro completada
[ ] M9.8  Pantalla Configuración: toggle para activar/desactivar notificaciones push
```

### Sprint M10 — Configuración + QA + Deploy
```
[ ] M10.1 Pantalla Settings: editar perfil (nombre, avatar), moneda preferida
[ ] M10.2 Logout: limpiar Zustand + SecureStore + navegar a login
[ ] M10.3 Manejo global de errores de red (sin conexión, timeout)
[ ] M10.4 Empty states en todas las pantallas (ilustraciones o íconos)
[ ] M10.5 Loading states consistentes (Skeleton en todas las listas)
[ ] M10.6 Pull-to-refresh en todas las pantallas con listas
[ ] M10.7 Pruebas en Android (emulador + dispositivo físico)
[ ] M10.8 Pruebas en iOS (simulador + dispositivo físico)
[ ] M10.9 Configurar EAS Build (Expo Application Services) para generar APK/IPA
[ ] M10.10 Deploy en Expo Go para pruebas internas (QR code)
[ ] M10.11 Generar build de producción: APK (Android) + IPA (iOS)
```

---

## 🔄 Diferencias Clave Web vs Mobile

| Concepto | Web (Next.js) | Mobile (React Native) |
|----------|--------------|----------------------|
| Routing | App Router (carpetas/archivos) | Expo Router (mismo paradigma) |
| Estilos | Tailwind CSS | NativeWind (Tailwind para RN) |
| Modales/Forms | Dialog (shadcn/ui) | Bottom Sheet (@gorhom) |
| Listas | `map()` + `div` | `FlatList` / `SectionList` |
| Animaciones | Framer Motion | React Native Reanimated |
| Gráficas | Recharts | Victory Native + Skia |
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
| Expo SDK 52 | https://docs.expo.dev |
| Expo Router v4 | https://docs.expo.dev/router/introduction |
| NativeWind v4 | https://www.nativewind.dev |
| React Native Reanimated | https://docs.swmansion.com/react-native-reanimated |
| @gorhom/bottom-sheet | https://gorhom.dev/react-native-bottom-sheet |
| Victory Native | https://commerce.nearform.com/open-source/victory-native |
| Expo SecureStore | https://docs.expo.dev/sdk/securestore |
| Expo Notifications | https://docs.expo.dev/sdk/notifications |
| EAS Build | https://docs.expo.dev/build/introduction |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Zustand | https://zustand.docs.pmnd.rs |
| date-fns | https://date-fns.org |

---

*Versión: 1.0 — Fase 2 Mobile*
*Autor: Alexander Gomez*
*Última actualización: Marzo 2026*
