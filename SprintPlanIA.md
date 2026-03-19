# Sprint Plan — Inteligencia Artificial (Sprint 10)
> Implementación de funcionalidades de IA con Google Gemini en Personal Finance App.
> **Total estimado: 3 sub-sprints (10A, 10B, 10C)**

---

## 🤖 IDEAS DE IA PARA LA APP

### Por qué tiene sentido la IA en esta app
El usuario ya registra sus gastos, ingresos, deudas, préstamos y metas de ahorro. Eso genera un conjunto de datos financieros ricos y personales que la IA puede transformar en **insights accionables**, reduciendo la carga cognitiva de analizar números manualmente.

---

### Funcionalidades propuestas

| # | Funcionalidad | Valor para el usuario |
|---|--------------|----------------------|
| 1 | **Chat financiero personal** | Preguntar en lenguaje natural: "¿cuánto gasté en comida este mes?" o "¿puedo permitirme una meta de ahorro de S/500?" |
| 2 | **Resumen mensual narrativo** | En lugar de solo ver números, recibir un párrafo: "Este mes gastaste 20% más que el anterior. Tu mayor gasto fue transporte." |
| 3 | **Auto-categorización de gastos** | Al escribir la descripción de un gasto, la IA sugiere la categoría más probable |
| 4 | **Recomendaciones de presupuesto** | Basado en el histórico de los últimos 3 meses, la IA sugiere montos de presupuesto por categoría |
| 5 | **Asesor de metas de ahorro** | Dado un objetivo (ej: "quiero comprar una laptop de S/3,000"), la IA calcula cuánto tiempo tomará y sugiere un plan |
| 6 | **Estrategia de pago de deudas** | La IA recomienda el orden óptimo para pagar deudas (método avalancha vs bola de nieve) |
| 7 | **Detección de gastos inusuales** | La IA identifica gastos que se salen del patrón habitual del usuario y los notifica |
| 8 | **Proyección financiera** | Con base en ingresos y gastos actuales, estima el saldo al final del mes |

---

## ✅ DECISIONES CONFIRMADAS

| Pregunta | Respuesta |
|----------|-----------|
| **Modelo Gemini** | `gemini-2.0-flash` — mejor ratio velocidad/costo para consultas frecuentes |
| **Historial del chat** | **Persiste entre sesiones** — requiere nuevo modelo Prisma `ChatMessage` y endpoints en Express |
| **Idioma** | **Multilingüe** — Gemini detecta el idioma del mensaje del usuario y responde en el mismo |
| **Rate limiting IA** | **Sin límite por ahora** |

---

## 🏗️ DECISIÓN ARQUITECTÓNICA

### ¿Dónde viven los endpoints de IA?

**Decisión:** Los endpoints de IA usan **Next.js Route Handlers** (`apps/web/src/app/api/ai/`), como excepción justificada al CLAUDE.md. El Vercel AI SDK está diseñado para streaming nativo en Next.js. El resto de la lógica de negocio (CRUD, historial) permanece en Express.

### Flujo completo de una consulta de chat
```
Usuario → Route Handler (Next.js)
  1. Verifica JWT → llama GET /api/v1/auth/me en Express
  2. Obtiene historial del chat → GET /api/v1/chat/history en Express
  3. Obtiene contexto financiero del usuario → GET /api/v1/dashboard/summary + gastos + ingresos
  4. Construye el system prompt con SOLO los datos de ese userId
  5. streamText() → google('gemini-2.0-flash')
  6. Hace streaming de la respuesta al cliente
  7. Al completarse → guarda mensaje usuario + respuesta en Express → POST /api/v1/chat/messages
```

### Modelo de privacidad
- Cada request está aislado por `userId` verificado con JWT.
- **Nunca** se pasan datos de otros usuarios a Gemini.
- La API key de Google **nunca** llega al cliente (solo en Route Handlers de servidor).

### Paquetes nuevos
```
apps/web:
  - ai               → Vercel AI SDK (streamText, generateText, generateObject, useChat)
  - @ai-sdk/google   → Proveedor Gemini para Vercel AI SDK

Variable de entorno nueva en apps/web/.env.local:
  GOOGLE_GENERATIVE_AI_API_KEY="tu-api-key-de-google-ai-studio"
```

---

## 📋 SPRINT 10A — Chat Financiero con Historial Persistente

**Objetivo:** Chat de IA donde el usuario hace preguntas en lenguaje natural sobre sus finanzas, con historial que persiste entre sesiones.

### 10A.1 — Base de datos (Express + Prisma)

- [ ] Agregar modelo `ChatMessage` al schema Prisma:
  ```prisma
  model ChatMessage {
    id        String   @id @default(cuid())
    userId    String
    role      String   // 'user' | 'assistant'
    content   String
    createdAt DateTime @default(now())

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@map("chat_messages")
  }
  ```
- [ ] Agregar relación `chatMessages ChatMessage[]` al modelo `User`
- [ ] Ejecutar migración: `npx prisma migrate dev --name add_chat_messages`

### 10A.2 — Backend Express (historial)

- [ ] Crear `apps/api/src/services/chat.service.ts`:
  - `getChatHistory(userId, limit = 50)` → últimos N mensajes ordenados por `createdAt asc`
  - `saveChatMessages(userId, userMessage, assistantMessage)` → guarda par de mensajes en una transacción
  - `clearChatHistory(userId)` → elimina todos los mensajes del usuario

- [ ] Crear `apps/api/src/controllers/chat.controller.ts`:
  - `getHistory` → llama `getChatHistory`
  - `saveMessages` → llama `saveChatMessages`
  - `clearHistory` → llama `clearChatHistory`

- [ ] Crear `apps/api/src/routes/chat.routes.ts` y registrar en `app.ts`:
  ```
  GET    /api/v1/chat/history     → últimos 50 mensajes [AUTH]
  POST   /api/v1/chat/messages    → guardar par user+assistant [AUTH]
  DELETE /api/v1/chat/history     → limpiar historial [AUTH]
  ```

### 10A.3 — Instalación de paquetes

- [ ] Instalar Vercel AI SDK:
  ```bash
  cd apps/web && npm install ai @ai-sdk/google
  ```

### 10A.4 — Route Handler Next.js (chat con streaming)

- [ ] Crear `apps/web/src/app/api/ai/chat/route.ts`:
  - Recibe `POST { messages: CoreMessage[] }` (formato Vercel AI SDK)
  - Verifica JWT → `GET ${API_URL}/auth/me` con el header `Authorization`
  - Si no autenticado → `return new Response('Unauthorized', { status: 401 })`
  - En paralelo, obtiene:
    - Historial del chat → `GET /api/v1/chat/history`
    - Resumen del dashboard → `GET /api/v1/dashboard/summary`
    - Últimos 10 gastos del mes → `GET /api/v1/expenses?limit=10`
    - Últimos 5 ingresos → `GET /api/v1/incomes?limit=5`
    - Deudas pendientes → `GET /api/v1/debts?status=PENDING&limit=10`
    - Metas de ahorro activas → `GET /api/v1/savings`
  - Construye el system prompt con el contexto (ver sección 10A.5)
  - Llama `streamText()` con `google('gemini-2.0-flash')`
  - Al completarse, guarda los mensajes → `POST /api/v1/chat/messages`
  - Retorna `result.toDataStreamResponse()`

### 10A.5 — System Prompt

```
Eres un asesor financiero personal de {nombre del usuario}.
Solo tienes acceso a los datos financieros de este usuario específico.

INSTRUCCIÓN DE IDIOMA: Detecta el idioma en que el usuario escribe su mensaje
y responde SIEMPRE en ese mismo idioma. Si escribe en español, responde en español.
Si escribe en inglés, responde en inglés. Adapta el idioma dinámicamente.

DATOS FINANCIEROS ACTUALES ({mes} {año}):
- Ingresos del mes: S/ {income.total}
- Gastos del mes: S/ {expenses.total}
- Pagos a deudas del mes: S/ {debtPayments.total}
- Balance: S/ {balance}
- Deudas pendientes totales: S/ {debts.totalPending}
- Ahorros acumulados: S/ {savings.totalSaved} en {savings.goalsCount} meta(s)
- Préstamos por cobrar: S/ {loans.totalPending} ({loans.activeLoans} activo(s))

ÚLTIMOS GASTOS DEL MES:
{lista: fecha | descripción | categoría | S/ monto}

ÚLTIMOS INGRESOS:
{lista: fecha | descripción | fuente | S/ monto}

DEUDAS PENDIENTES:
{lista: acreedor | S/ total | S/ pagado | S/ pendiente | estado}

METAS DE AHORRO:
{lista: nombre | S/ meta | S/ ahorrado | progreso%}

REGLAS:
- Responde de forma concisa y directa.
- Usa montos en soles (S/) para valores en PEN.
- Si el usuario pregunta datos que no están en el contexto, dilo honestamente.
- No inventes cifras ni datos que no estén en el contexto.
- No compartas ni hagas referencia a datos de otros usuarios.
```

### 10A.6 — Frontend: Página de chat

- [ ] Crear `apps/web/src/app/(dashboard)/ai-chat/page.tsx`:
  - Hook `useChat` del Vercel AI SDK apuntando a `/api/ai/chat`
  - Pasa `Authorization: Bearer {accessToken}` como header personalizado
  - Al cargar la página, obtiene el historial de `GET /api/v1/chat/history` y lo pre-carga en `useChat` con `initialMessages`
  - Layout: panel de mensajes (scroll automático al último) + input fijo en la parte inferior
  - Mensajes del usuario a la derecha (fondo azul `#1E3A5F`, texto blanco)
  - Mensajes del asistente a la izquierda (fondo gris claro, texto oscuro)
  - Indicador de "escribiendo..." con `TypingIndicator` mientras hace streaming
  - Botón "Nueva conversación" que llama `DELETE /api/v1/chat/history` y limpia los mensajes locales

- [ ] Crear componentes en `apps/web/src/components/ai/`:
  - `ChatMessage.tsx` — renderiza un mensaje con soporte de saltos de línea y listas simples
  - `ChatInput.tsx` — textarea que se expande, `Enter` envía, `Shift+Enter` hace salto de línea, botón de enviar con ícono `Send` de Lucide
  - `TypingIndicator.tsx` — tres puntos animados con Framer Motion

- [ ] Agregar ítem en el Sidebar:
  - Ícono `Bot` de Lucide React
  - Label: "Asistente IA"
  - Badge pequeño: "IA" con fondo `#2E86AB`

### 10A.7 — Variable de entorno

- [ ] Agregar a `apps/web/.env.local`:
  ```env
  GOOGLE_GENERATIVE_AI_API_KEY="tu-api-key-de-google-ai-studio"
  ```
  > Obtener API Key gratuita en Google AI Studio

### Ejemplos de consultas que debe responder
```
"¿Cuánto gasté en alimentación este mes?"
"¿En qué categoría gasto más?"
"¿Tengo deudas vencidas?"
"¿Cuánto me falta para completar mi meta de ahorro?"
"¿Estoy en números rojos este mes?"
"Dame un resumen de mis finanzas de este mes"
"How much did I spend this month?" (responde en inglés)
"¿Puedo ahorrar S/500 al mes con mi balance actual?"
"¿Qué préstamo debería cobrar primero?"
```

---

## 📋 SPRINT 10B — Resumen Mensual y Auto-categorización

**Objetivo:** Funcionalidades de IA integradas en el flujo normal de la app.

### 10B.1 — Resumen Mensual Narrativo

- [ ] Crear `apps/web/src/app/api/ai/monthly-summary/route.ts`:
  - `POST { month, year, lang? }` — `lang` opcional, por defecto `'es'`
  - Autenticación obligatoria
  - Obtiene gastos por categoría, ingresos y balance del mes indicado desde Express
  - Llama `generateText()` con `google('gemini-2.0-flash')`
  - Prompt: "Genera un resumen ejecutivo en 3-4 oraciones del mes financiero. Responde en el idioma: {lang}."
  - Devuelve `{ summary: string }`

- [ ] Crear `AIMonthlySummary.tsx` en `components/dashboard/`:
  - Card debajo de las stats cards en el Dashboard
  - Selector de idioma simple (ES / EN) antes de generar
  - Botón "Generar resumen con IA" con ícono `Sparkles` (Lucide)
  - Skeleton mientras procesa, texto generado cuando termina
  - El resumen no se guarda en BD; el usuario lo regenera cuando quiere

### 10B.2 — Auto-categorización de Gastos

- [ ] Crear `apps/web/src/app/api/ai/suggest-category/route.ts`:
  - `POST { description: string }`
  - Autenticación obligatoria
  - Obtiene lista de categorías disponibles desde Express `GET /api/v1/categories`
  - Llama `generateObject()` con schema Zod:
    ```typescript
    z.object({
      categoryName: z.string(),
      confidence: z.number().min(0).max(1),
    })
    ```
  - Prompt: "Given this expense description and the available categories list, choose the most appropriate category."
  - Devuelve `{ categoryName: string, confidence: number }`

- [ ] Integrar en `ExpenseFormModal.tsx`:
  - `onBlur` en el campo `description` (mínimo 3 caracteres) → debounce 500ms → llama al endpoint
  - Si `confidence >= 0.7` → pre-selecciona la categoría en el `<Select>`
  - Badge `"✨ Sugerido por IA"` debajo del selector (desaparece si el usuario cambia manualmente)
  - El usuario puede ignorarlo y elegir otra categoría sin restricción

### 10B.3 — Recomendaciones de Presupuesto

- [ ] Crear `apps/web/src/app/api/ai/budget-recommendations/route.ts`:
  - Autenticación obligatoria
  - Obtiene resumen de gastos de los últimos 3 meses por categoría desde Express
  - Llama `generateObject()`:
    ```typescript
    z.object({
      recommendations: z.array(z.object({
        categoryName: z.string(),
        suggestedAmount: z.number(),
        reasoning: z.string(),  // Ej: "Promedio histórico S/320, se sugiere S/350 con 10% de margen"
      }))
    })
    ```
  - Prompt: "Analyze the last 3 months of spending patterns and suggest realistic monthly budgets per category."
  - Devuelve array de recomendaciones

- [ ] Agregar botón "Sugerir con IA" en la sección de presupuestos de `/expenses`:
  - Modal o panel lateral con las recomendaciones
  - El usuario acepta cada sugerencia individualmente → pre-llena el campo de monto del presupuesto
  - Muestra el `reasoning` como tooltip o texto secundario para explicar la sugerencia

---

## 📋 SPRINT 10C — Asesoría Avanzada

**Objetivo:** Funcionalidades de análisis profundo activadas por el usuario en contexto.

### 10C.1 — Estrategia de Pago de Deudas

- [ ] Crear `apps/web/src/app/api/ai/debt-strategy/route.ts`:
  - Autenticación obligatoria
  - Obtiene todas las deudas pendientes + ingreso mensual promedio (últimos 3 meses)
  - Llama `generateObject()`:
    ```typescript
    z.object({
      recommendedMethod: z.enum(['avalanche', 'snowball']),
      methodExplanation: z.string(),
      debtOrder: z.array(z.object({
        creditorName: z.string(),
        reason: z.string(),
      })),
      monthlyTargetAmount: z.number(),
      estimatedMonthsToDebtFree: z.number(),
    })
    ```
  - Devuelve la estrategia estructurada

- [ ] Agregar sección "Estrategia IA" en `/debts`:
  - Card con botón "Analizar mis deudas con IA" + ícono `Brain` (Lucide)
  - Muestra el método recomendado, orden de pago priorizado, monto mensual sugerido y tiempo estimado para quedar libre de deudas

### 10C.2 — Asesor de Metas de Ahorro

- [ ] Crear `apps/web/src/app/api/ai/savings-advice/route.ts`:
  - `POST { goalId: string }`
  - Autenticación obligatoria
  - Obtiene datos de la meta específica + balance mensual promedio de los últimos 3 meses
  - Llama `generateObject()`:
    ```typescript
    z.object({
      isAchievable: z.boolean(),
      assessment: z.string(),
      recommendedMonthlyContribution: z.number(),
      estimatedCompletionDate: z.string(),  // ISO date string
      tips: z.array(z.string()),
    })
    ```

- [ ] En la página `/savings/[id]`:
  - Botón "Analizar con IA" + ícono `Sparkles`
  - Muestra: evaluación de viabilidad, contribución mensual recomendada, fecha estimada de cumplimiento y 3 tips

### 10C.3 — Detección de Gastos Inusuales

- [ ] Crear `apps/web/src/app/api/ai/anomalies/route.ts`:
  - Autenticación obligatoria
  - Compara gastos del mes actual vs promedio de los últimos 2 meses por categoría
  - Llama `generateObject()`:
    ```typescript
    z.object({
      anomalies: z.array(z.object({
        categoryName: z.string(),
        currentAmount: z.number(),
        averageAmount: z.number(),
        percentageIncrease: z.number(),
        alertMessage: z.string(),
      }))
    })
    ```

- [ ] En el Dashboard, al cargar:
  - Llama al endpoint en segundo plano (no bloquea la carga principal)
  - Si hay anomalías → card de advertencia con ícono `AlertTriangle` en color ámbar
  - El usuario puede descartar la alerta (`localStorage` guarda la fecha de descarte, no reaparece hasta el próximo mes)

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Nuevo modelo Prisma
```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String   // 'user' | 'assistant'
  content   String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}
```

### Migración requerida
```bash
npx prisma migrate dev --name add_chat_messages
```

---

## 🌐 ENDPOINTS COMPLETOS

### Nuevos en Express (`apps/api`)
```
GET    /api/v1/chat/history     → Obtener historial (últimos 50 msgs) [AUTH]
POST   /api/v1/chat/messages    → Guardar par user+assistant [AUTH]
DELETE /api/v1/chat/history     → Limpiar historial del usuario [AUTH]
```

### Nuevos en Next.js Route Handlers (`apps/web/src/app/api/ai/`)
```
POST /api/ai/chat                    → Chat con streaming (guarda historial en Express)
POST /api/ai/monthly-summary         → Resumen narrativo del mes
POST /api/ai/suggest-category        → Sugerencia de categoría para gasto
POST /api/ai/budget-recommendations  → Recomendaciones de presupuesto
POST /api/ai/debt-strategy           → Estrategia de pago de deudas
POST /api/ai/savings-advice          → Asesoría de meta de ahorro
POST /api/ai/anomalies               → Detección de gastos inusuales
```

Todos los Route Handlers de IA:
- Requieren `Authorization: Bearer <accessToken>` en el header
- Verifican el token → `GET ${NEXT_PUBLIC_API_URL}/auth/me`
- Retornan `401` si el token es inválido o ausente
- Sin rate limiting por ahora

---

## 🔒 SEGURIDAD Y PRIVACIDAD — REGLAS OBLIGATORIAS

```
1. SIEMPRE verificar JWT antes de cualquier llamada a Gemini.
2. NUNCA pasar datos de un userId diferente al autenticado.
3. NUNCA exponer GOOGLE_GENERATIVE_AI_API_KEY al cliente (solo en Route Handlers de servidor).
4. NUNCA incluir en el contexto de Gemini más datos de los necesarios para la consulta.
5. El historial del chat se almacena en BD pero solo accesible por el propio usuario.
6. Al eliminar un usuario, sus ChatMessages se eliminan en cascada (onDelete: Cascade).
```

---

## 📦 CAMBIOS EN VARIABLES DE ENTORNO

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
GOOGLE_GENERATIVE_AI_API_KEY="tu-api-key-de-google-ai-studio"
```
> Obtener API Key gratuita en Google AI Studio (https://aistudio.google.com/app/apikey)

---

## 📊 RESUMEN FINAL DE SPRINTS

| Sub-sprint | Funcionalidades | BD | Paquetes nuevos |
|-----------|----------------|-----|-----------------|
| **10A** | Chat con streaming + historial persistente | ✅ `ChatMessage` + 3 endpoints Express | `ai`, `@ai-sdk/google` |
| **10B** | Resumen mensual narrativo, auto-categorización, recomendaciones de presupuesto | No | — |
| **10C** | Estrategia de deudas, asesor de ahorros, detección de anomalías | No | — |

**Modelo:** `gemini-2.0-flash` en todos los endpoints.
**Idioma:** Multilingüe — Gemini detecta el idioma del mensaje del usuario y responde en el mismo.
**Rate limiting IA:** Sin límite (revisable en producción).
**Historial:** Persiste en BD, últimos 50 mensajes por usuario, limpiable por el usuario.

**Orden:** 10A → 10B → 10C
- 10A instala el stack IA completo + modelo de historial. Es el bloque más crítico.
- 10B reutiliza el stack y se integra en páginas existentes sin romper nada.
- 10C agrega profundidad analítica una vez que las bases estén probadas.

---

*Autor: Alexander Gomez — v1.0*
*Fecha: Marzo 2026*
