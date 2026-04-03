# Modificaciones — Lista de Tareas

---

## Feature 1: Tarjetas de Crédito con Ciclo de Facturación

### Análisis
Cuando el método de pago de un gasto es `CREDIT_CARD`, el usuario debe poder elegir a qué tarjeta pertenece el gasto (BCP, BBVA, Interbank, etc.). Cada tarjeta tiene un **ciclo de facturación** definido por el día de inicio (`cycleStartDay`) y un **día límite de pago** (`paymentDueDay`). El sistema acumula todos los gastos con esa tarjeta dentro del ciclo activo para mostrar cuánto debe pagar el usuario y cuándo.

**Ejemplo:** Tarjeta BCP, `cycleStartDay=11`, `paymentDueDay=5`.
- Ciclo activo: 11 Ene → 10 Feb
- Fecha límite de pago: 5 Mar
- El sistema suma todos los gastos con esa tarjeta entre 11 Ene y 10 Feb.

### Tareas — Backend (`apps/api`)
```
[ ] F1.1  Nuevo modelo `CreditCard` en schema.prisma:
          id, userId, entityName (String), cycleStartDay (Int 1-31),
          paymentDueDay (Int 1-31), currency (Currency), creditLimit (Decimal?),
          notes (String?), createdAt, updatedAt
          Relación: User → CreditCard[] (onDelete: Cascade)
[ ] F1.2  Campo opcional `creditCardId (String?)` en modelo `Expense`
          Relación: CreditCard → Expense[] (opcional, no cascade)
[ ] F1.3  Migración de BD: `add_credit_cards`
[ ] F1.4  Zod schema `credit-cards.schema.ts`:
          createCreditCardSchema, updateCreditCardSchema
[ ] F1.5  `credit-cards.service.ts`:
          - listCreditCards(userId)
          - createCreditCard(userId, input)
          - getCreditCardById(userId, cardId) — incluye gastos del ciclo activo
          - updateCreditCard(userId, cardId, input)
          - deleteCreditCard(userId, cardId)
          - getCurrentCycleExpenses(userId, cardId): calcula ciclo activo según
            cycleStartDay y acumula gastos con esa tarjeta en ese rango de fechas
[ ] F1.6  `credit-cards.controller.ts` + `credit-cards.routes.ts`
          Endpoints:
          GET    /credit-cards               → Listar tarjetas del usuario
          POST   /credit-cards               → Crear tarjeta
          GET    /credit-cards/:id           → Detalle + ciclo activo
          PUT    /credit-cards/:id           → Actualizar
          DELETE /credit-cards/:id           → Eliminar
          GET    /credit-cards/:id/cycle     → Resumen del ciclo actual (total gastado, fecha límite, días restantes)
[ ] F1.7  Actualizar `expenses.schema.ts`: agregar `creditCardId (z.string().optional())`
[ ] F1.8  Actualizar `expenses.service.ts`: pasar `creditCardId` a Prisma en create/update
```

### Tareas — Shared (`packages/shared`)
```
[ ] F1.9  Tipo `CreditCard` en `packages/shared/src/types/`:
          id, userId, entityName, cycleStartDay, paymentDueDay, currency,
          creditLimit?, notes?, createdAt, updatedAt
[ ] F1.10 Tipo `CreditCardCycleSummary`:
          totalSpent, cycleStart (Date), cycleEnd (Date), paymentDueDate (Date),
          daysUntilPayment (number), expenses: Expense[]
```

### Tareas — Web (`apps/web`)
```
[ ] F1.11 Hook `useCreditCards.ts`: listCreditCards, createCreditCard,
          updateCreditCard, deleteCreditCard, getCycleSummary
[ ] F1.12 Página `/credit-cards/page.tsx`: listado de tarjetas con resumen
          del ciclo activo de cada una (total gastado / límite, días para pago)
[ ] F1.13 Componente `CreditCardFormModal.tsx`: formulario crear/editar tarjeta
          Campos: entityName (texto libre), cycleStartDay (1-31),
          paymentDueDay (1-31), currency, creditLimit (opcional), notes (opcional)
[ ] F1.14 Componente `CreditCardCycleSummary.tsx`: card con total del ciclo,
          barra de progreso vs. límite, fecha límite de pago, días restantes
[ ] F1.15 Actualizar `ExpenseFormModal.tsx`: cuando `paymentMethod = CREDIT_CARD`,
          mostrar selector de tarjeta (dropdown con tarjetas del usuario)
[ ] F1.16 Sidebar: agregar ítem "Tarjetas de crédito" con ícono `CreditCard`
          (lucide-react) entre Gastos e Ingresos
```

### Tareas — Mobile (`apps/mobile`)
```
[ ] F1.17 Hook `useCreditCards.ts` (equivalente al de web)
[ ] F1.18 Pantalla `app/credit-cards/index.tsx`: listado de tarjetas con
          resumen del ciclo activo (total, fecha límite, días restantes)
[ ] F1.19 Componente `CreditCardFormSheet.tsx`: Bottom Sheet crear/editar tarjeta
[ ] F1.20 Componente `CreditCardCycleSummary.tsx`: card con detalle del ciclo
[ ] F1.21 Actualizar `ExpenseFormSheet.tsx`: cuando paymentMethod = CREDIT_CARD,
          mostrar selector de tarjeta del usuario
[ ] F1.22 Agregar acceso a tarjetas desde el menú de gastos o tab adicional
```

---

## Modificaciones Globales (api + web + mobile)

---

### Mod 1: Préstamos próximos a vencer en dashboard (igual que deudas)

**Contexto:** El endpoint `GET /dashboard/upcoming-payments` ya retorna tanto cuotas
de préstamos como deudas. El componente `UpcomingPayments` en web y mobile los muestra
juntos. La tarea es verificar y mejorar la paridad visual entre ambos tipos.

#### Tareas — Web
```
[ ] M1.1  Revisar `UpcomingPayments.tsx`: confirmar que las cuotas de préstamos
          tengan el mismo peso visual que las deudas (mismo tipo de card,
          misma información: nombre, monto, fecha, estado)
[ ] M1.2  Si hay diferencia visual, igualar el diseño de cards de préstamos
          al de las cards de deudas dentro del componente
[ ] M1.3  Asegurar que en el dashboard web los préstamos próximos a vencer
          aparezcan en la sección de upcoming payments sin condiciones adicionales
```

#### Tareas — Mobile
```
[ ] M1.4  Revisar sección "Próximos 7 días" en `app/(tabs)/index.tsx`:
          confirmar que cuotas de préstamos y deudas tengan el mismo
          estilo de card y la misma información mostrada
[ ] M1.5  Si hay diferencia visual, igualar el diseño de ambos tipos de ítem
```

---

### Mod 2: CRUD de Categorías de Usuario

**Contexto:** Actualmente las categorías (`ExpenseCategory`) son globales (sin userId)
y solo se crean por seed. Se permitirá a cada usuario crear sus propias categorías
personalizadas. Las categorías del sistema (seedeadas) permanecen para todos y no
son editables ni eliminables por el usuario.

#### Tareas — Backend (`apps/api`)
```
[ ] M2.1  Migración BD `add_user_categories`:
          Agregar `userId String?` a `ExpenseCategory`
          Agregar relación opcional: `user User? @relation(...)`
          (null = categoría del sistema, non-null = categoría del usuario)
[ ] M2.2  Actualizar `categories.service.ts`:
          - listCategories(userId): retorna categorías del sistema (userId=null)
            + categorías propias del usuario (userId=userId)
          - createUserCategory(userId, input): crea categoría con userId del usuario
          - updateUserCategory(userId, categoryId, input): solo si le pertenece al usuario
          - deleteUserCategory(userId, categoryId): solo si le pertenece al usuario
            y no tiene gastos asociados (o cascade, según decisión)
[ ] M2.3  Actualizar `categories.routes.ts` y controller:
          GET    /categories            → Listar (sistema + propias) [AUTH]
          POST   /categories            → Crear categoría propia [AUTH]
          PUT    /categories/:id        → Actualizar categoría propia [AUTH]
          DELETE /categories/:id        → Eliminar categoría propia [AUTH]
[ ] M2.4  Zod schema para crear/actualizar categoría de usuario:
          name (min 2), emoji (1 emoji), color (hex)
```

#### Tareas — Shared (`packages/shared`)
```
[ ] M2.5  Actualizar tipo `ExpenseCategory` o `Category` en shared:
          agregar `isUserCategory: boolean` (derivado de si userId está presente)
```

#### Tareas — Web (`apps/web`)
```
[ ] M2.6  Hook `useCategories.ts`: agregar createCategory, updateCategory, deleteCategory
[ ] M2.7  Sección "Mis categorías" en `/expenses` (tab o panel lateral) o página
          dedicada `/categories`: listado con categorías del usuario + botón agregar
[ ] M2.8  Componente `CategoryFormModal.tsx`:
          Campos: name, emoji (picker simple o texto), color (input hex o paleta)
[ ] M2.9  En el listado: categorías del sistema con badge "Sistema" (no editables),
          categorías propias con botones editar/eliminar
[ ] M2.10 Actualizar `ExpenseFormModal.tsx`: las categorías propias aparecen en el
          selector junto a las del sistema (misma lista combinada)
```

#### Tareas — Mobile (`apps/mobile`)
```
[ ] M2.11 Actualizar hook `useCategories.ts` (o crear si no existe):
          incluir create, update, delete de categorías propias
[ ] M2.12 Pantalla `app/categories/index.tsx`: listado de categorías propias
          + botón agregar + acciones editar/eliminar por swipe o long press
[ ] M2.13 Componente `CategoryFormSheet.tsx`: Bottom Sheet crear/editar categoría
[ ] M2.14 Actualizar `ExpenseFormSheet.tsx`: el selector de categoría ya incluye
          las del usuario automáticamente (misma API retorna todo combinado)
[ ] M2.15 Agregar acceso a "Mis categorías" desde la pantalla de Gastos o Ajustes
```

---

### Mod 3: Resumen IA en Dashboard — Global (no mensual)

**Contexto:** `AIMonthlySummary` en web envía `{ month, year }` al Route Handler
`POST /api/ai/monthly-summary`. Debe cambiarse para que el resumen sea del histórico
completo del usuario, sin filtro de fecha.

#### Tareas — Backend / Route Handler (`apps/web/src/app/api/ai/monthly-summary/route.ts`)
```
[ ] M3.1  Actualizar el Route Handler para NO recibir `month`/`year` en el body
[ ] M3.2  Usar `getGlobalExpensesSummary(userId)` y `getGlobalIncomeSummary(userId)`
          (ya existen en los services) en lugar de los métodos mensuales
[ ] M3.3  Actualizar el prompt del sistema: indicar a Gemini que los datos
          son históricos acumulados, no de un mes específico
```

#### Tareas — Web (`apps/web`)
```
[ ] M3.4  Actualizar `AIMonthlySummary.tsx`:
          - Quitar las props `month` y `year`
          - Quitar el selector de mes/año de la UI
          - Cambiar el label de "Resumen del mes" a "Resumen financiero global"
          - Actualizar la llamada al API: solo enviar `{ lang }`
[ ] M3.5  Actualizar `page.tsx` del dashboard: quitar las props `month`/`year`
          del componente AIMonthlySummary
```

#### Tareas — Mobile (`apps/mobile`)
```
[ ] M3.6  Localizar el hook/función que llama a monthly-summary (probablemente
          `useAIMonthlySummary.ts` o similar)
[ ] M3.7  Actualizar para no enviar `month`/`year` al endpoint
[ ] M3.8  Actualizar label en la UI: "Resumen global" en lugar de "Resumen del mes"
```

---

### Mod 4: Anomalías IA — Disparado por Botón (no automático)

**Contexto:** `AIAnomalyAlert.tsx` en web se carga automáticamente con `useEffect`
en background al entrar al dashboard. En mobile también se dispara automáticamente.
Debe cambiarse a que el usuario lo active manualmente con un botón para evitar
consumo innecesario de tokens de IA.

#### Tareas — Web (`apps/web`)
```
[ ] M4.1  Actualizar `AIAnomalyAlert.tsx`:
          - Eliminar el `useEffect` que dispara la carga automática
          - Cambiar al estado inicial: mostrar un card con botón
            "Detectar anomalías en mis gastos 🔍"
          - Al presionar el botón: ejecutar la llamada a `/api/ai/anomalies`
          - Loading state: spinner + texto "Analizando gastos..."
          - Resultado: mostrar card ámbar con anomalías (mismo diseño actual)
          - Sin anomalías: mostrar mensaje positivo "Sin anomalías detectadas ✅"
          - Mantener la lógica de dismiss por mes (localStorage)
          - Si ya fue generado en este mes y no fue descartado: mostrar resultado cacheado
```

#### Tareas — Mobile (`apps/mobile`)
```
[ ] M4.2  Localizar el componente/hook de anomalías en el dashboard mobile
          (probablemente useAIAnomalies.ts o AIAnomalyCard dentro de index.tsx)
[ ] M4.3  Eliminar el trigger automático (useEffect o llamada en mount)
[ ] M4.4  Agregar botón "Detectar anomalías" en el dashboard que dispare la llamada
[ ] M4.5  Mismo flujo: loading → resultado (card ámbar) o sin anomalías → dismiss
```

---

## Modificación Mobile

### Quitar card "Balance del mes"

**Contexto:** El dashboard mobile muestra el "Balance total" (global/histórico). Si
existe algún card adicional que muestre el balance mensual, debe eliminarse para
evitar duplicación y confusión.

```
[ ] MM1.1 Revisar `app/(tabs)/index.tsx`: identificar si existe un card o sección
          separada que muestre el balance mensual (filtrado por mes actual)
[ ] MM1.2 Si existe: eliminar dicho card o sección
[ ] MM1.3 Verificar que el "Balance total" global permanece como único indicador
          de balance en el dashboard mobile
```

---

## Resumen de Prioridades

| Prioridad | Feature | Complejidad |
|-----------|---------|-------------|
| Alta | Mod 3 — IA Resumen Global | Baja |
| Alta | Mod 4 — Anomalías por botón | Baja |
| Alta | MM1 — Quitar balance del mes mobile | Baja |
| Media | Mod 1 — Paridad visual préstamos/deudas | Baja |
| Media | Mod 2 — CRUD categorías de usuario | Media |
| Baja | Feature 1 — Tarjetas de crédito | Alta |
