# 🤖 CLAUDE.md — Personal Finance App
## Instrucciones Maestras para Claude Code Agent

> **LEER COMPLETAMENTE ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO.**
> Este archivo es la única fuente de verdad del proyecto. Ante cualquier duda, consulta aquí primero.

---

## 📌 REGLAS ABSOLUTAS (NO NEGOCIABLES)

```
1. NUNCA inventes librerías, funciones o APIs que no estén explícitamente listadas aquí.
2. NUNCA uses `any` en TypeScript. Siempre tipado estricto.
3. NUNCA hagas raw SQL. Solo Prisma ORM.
4. NUNCA hardcodees credenciales, URLs o secrets. Solo variables de entorno.
5. NUNCA omitas manejo de errores en operaciones async.
6. NUNCA cambies el stack tecnológico sin instrucción explícita del usuario.
7. SIEMPRE valida los inputs con Zod antes de procesar en el backend.
8. SIEMPRE usa los nombres de archivos, carpetas y variables exactamente como se definen aquí.
9. SIEMPRE escribe en TypeScript estricto (strict: true en tsconfig).
10. ANTE LA DUDA: pregunta al usuario antes de asumir.
```

---

## 🎯 QUÉ ES ESTE PROYECTO

**Personal Finance App** — Aplicación web (Fase 1) para gestión de finanzas personales de un único usuario (Alexander Gomez), con capacidad futura de escalar a multi-usuario.

### Módulos del sistema:
| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | **Auth** | Login/registro con JWT + recuperación de contraseña por email |
| 2 | **Gastos** | Registro de gastos con categorías y presupuesto |
| 3 | **Préstamos** | Préstamos otorgados con cuotas e intereses |
| 4 | **Deudas** | Deudas personales con historial de pagos |
| 5 | **Ahorros** | Metas de ahorro con progreso y proyección |
| 6 | **Ingresos** | Registro de ingresos por fuente con resumen mensual |
| 7 | **Dashboard** | Resumen financiero con balance real (ingresos − gastos − pagos de deudas) |
| 8 | **Notificaciones** | Alertas por email (Fase 1) |

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────┐
│     Next.js 14 (Frontend Web)   │  → Puerto 3000
│  TypeScript + Tailwind + Framer │
└──────────────┬──────────────────┘
               │ HTTP (fetch / axios)
               ▼
┌─────────────────────────────────┐
│   Node.js + Express (API REST)  │  → Puerto 4000
│      TypeScript + Zod           │
└──────────────┬──────────────────┘
               │ Prisma Client
               ▼
┌─────────────────────────────────┐
│   PostgreSQL — NeonDB            │
│   (Serverless PostgreSQL)        │
└─────────────────────────────────┘
```

### Decisión de arquitectura importante:
- El **frontend (Next.js)** NO usa API Routes de Next.js para la lógica de negocio.
- Toda la lógica vive en el **backend Express dedicado** (`/apps/api`).
- Razón: React Native (Fase 2) necesita consumir la misma API sin dependencia de Next.js.

---

## 📁 ESTRUCTURA DE CARPETAS (MONOREPO)

```
finance-app/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router de Next.js
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── register/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx              # Dashboard principal
│   │   │   │   │   ├── expenses/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── loans/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── debts/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── savings/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   │   │   ├── layout/           # Sidebar, Navbar, etc.
│   │   │   │   ├── dashboard/        # Componentes del dashboard
│   │   │   │   ├── expenses/
│   │   │   │   ├── loans/
│   │   │   │   ├── debts/
│   │   │   │   └── savings/
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts     # Cliente HTTP (axios/fetch wrapper)
│   │   │   │   ├── auth.ts           # Helpers de autenticación
│   │   │   │   └── utils.ts          # Utilidades generales
│   │   │   ├── stores/               # Zustand stores (estado global)
│   │   │   └── types/                # Tipos TypeScript del frontend
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Node.js + Express Backend
│       ├── src/
│       │   ├── controllers/          # Lógica de cada endpoint
│       │   │   ├── auth.controller.ts
│       │   │   ├── expenses.controller.ts
│       │   │   ├── loans.controller.ts
│       │   │   ├── debts.controller.ts
│       │   │   └── savings.controller.ts
│       │   ├── routes/               # Definición de rutas Express
│       │   │   ├── auth.routes.ts
│       │   │   ├── expenses.routes.ts
│       │   │   ├── loans.routes.ts
│       │   │   ├── debts.routes.ts
│       │   │   └── savings.routes.ts
│       │   ├── middlewares/
│       │   │   ├── auth.middleware.ts      # Verificación JWT
│       │   │   ├── validate.middleware.ts  # Validación Zod
│       │   │   └── error.middleware.ts     # Manejo global de errores
│       │   ├── services/             # Lógica de negocio pura
│       │   │   ├── auth.service.ts
│       │   │   ├── expenses.service.ts
│       │   │   ├── loans.service.ts
│       │   │   ├── debts.service.ts
│       │   │   ├── savings.service.ts
│       │   │   └── notifications.service.ts
│       │   ├── schemas/              # Schemas de validación Zod
│       │   │   ├── auth.schema.ts
│       │   │   ├── expenses.schema.ts
│       │   │   ├── loans.schema.ts
│       │   │   ├── debts.schema.ts
│       │   │   └── savings.schema.ts
│       │   ├── lib/
│       │   │   ├── prisma.ts         # Singleton de Prisma Client
│       │   │   ├── jwt.ts            # Helpers JWT
│       │   │   ├── mailer.ts         # Configuración Nodemailer
│       │   │   └── loan-calculator.ts # Motor de cálculo de cuotas
│       │   ├── jobs/                 # Cron jobs para notificaciones
│       │   │   └── notification.job.ts
│       │   ├── types/
│       │   │   └── express.d.ts      # Extensión de tipos de Express
│       │   └── app.ts                # Entry point del servidor
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Tipos compartidos entre web y api
│       ├── src/
│       │   └── types/
│       │       ├── index.ts
│       │       ├── auth.types.ts
│       │       ├── expense.types.ts
│       │       ├── loan.types.ts
│       │       ├── debt.types.ts
│       │       └── savings.types.ts
│       ├── tsconfig.json
│       └── package.json
│
├── .env.example                      # Template de variables de entorno
├── .gitignore
├── turbo.json                        # Config Turborepo
└── package.json                      # Root package.json del monorepo
```

---

## 🛠️ STACK TECNOLÓGICO EXACTO

### Frontend (`apps/web`)
```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "tailwindcss": "3.x",
  "framer-motion": "11.x",
  "axios": "1.x",
  "zustand": "4.x",
  "react-hook-form": "7.x",
  "zod": "3.x",
  "@hookform/resolvers": "3.x",
  "recharts": "2.x",
  "date-fns": "3.x",
  "lucide-react": "latest"
}
```

### Backend (`apps/api`)
```json
{
  "express": "4.x",
  "typescript": "5.x",
  "@prisma/client": "5.x",
  "prisma": "5.x",
  "zod": "3.x",
  "jsonwebtoken": "9.x",
  "bcryptjs": "2.x",
  "nodemailer": "6.x",
  "node-cron": "3.x",
  "cors": "2.x",
  "helmet": "7.x",
  "express-rate-limit": "7.x",
  "dotenv": "16.x",
  "date-fns": "3.x"
}
```

### DevDependencies (ambos)
```json
{
  "@types/node": "20.x",
  "@types/express": "4.x",
  "@types/jsonwebtoken": "9.x",
  "@types/bcryptjs": "2.x",
  "@types/nodemailer": "6.x",
  "@types/cors": "2.x",
  "tsx": "4.x",
  "nodemon": "3.x"
}
```

### Herramienta de Monorepo
```
turborepo — gestor de monorepo
```

> ⚠️ **NO instales ninguna librería que no esté en esta lista sin consultarlo primero.**

---

## 🗄️ SCHEMA PRISMA COMPLETO

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

enum Currency {
  PEN
  USD
}

enum PaymentMethod {
  CREDIT_CARD
  YAPE
  PLIN
  BANK_TRANSFER
  CASH
}

enum LoanStatus {
  ACTIVE
  COMPLETED
  OVERDUE
}

enum InstallmentStatus {
  PENDING
  PAID
  OVERDUE
  PARTIAL
}

enum DebtStatus {
  PENDING
  PARTIAL
  PAID
}

enum SavingGoalType {
  OBJECTIVE
  EMERGENCY
  CUSTOM
}

enum SavingGoalStatus {
  IN_PROGRESS
  COMPLETED
  PAUSED
}

enum IncomeSource {
  SALARY
  FREELANCE
  BUSINESS
  INVESTMENT
  RENTAL
  OTHER
}

// ─── MODELOS ─────────────────────────────────────────────────────────────────

model User {
  id                     String    @id @default(cuid())
  email                  String    @unique
  passwordHash           String
  name                   String
  avatarUrl              String?
  preferredCurrency      Currency  @default(PEN)
  timezone               String    @default("America/Lima")
  emailVerified          Boolean   @default(false)
  refreshToken           String?
  resetPasswordToken     String?
  resetPasswordExpires   DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  expenses          Expense[]
  budgets           Budget[]
  loans             Loan[]
  personalDebts     PersonalDebt[]
  savingGoals       SavingGoal[]
  incomes           Income[]

  @@map("users")
}

model ExpenseCategory {
  id        String    @id @default(cuid())
  name      String    @unique
  emoji     String
  color     String    // Hex color para UI
  createdAt DateTime  @default(now())

  expenses  Expense[]
  budgets   Budget[]

  @@map("expense_categories")
}

model Expense {
  id            String        @id @default(cuid())
  userId        String
  categoryId    String
  description   String
  amount        Decimal       @db.Decimal(12, 2)
  currency      Currency      @default(PEN)
  paymentMethod PaymentMethod
  date          DateTime
  isRecurring   Boolean       @default(false)
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  category      ExpenseCategory @relation(fields: [categoryId], references: [id])

  @@map("expenses")
}

model Budget {
  id          String          @id @default(cuid())
  userId      String
  categoryId  String
  amount      Decimal         @db.Decimal(12, 2)
  currency    Currency        @default(PEN)
  month       Int             // 1-12
  year        Int
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    ExpenseCategory @relation(fields: [categoryId], references: [id])

  @@unique([userId, categoryId, month, year])
  @@map("budgets")
}

model Loan {
  id               String      @id @default(cuid())
  userId           String
  borrowerName     String
  borrowerContact  String?
  principal        Decimal     @db.Decimal(12, 2)  // Monto original prestado
  currency         Currency    @default(PEN)
  interestRate     Decimal     @db.Decimal(5, 4)   // 0.1500 o 0.2000
  totalAmount      Decimal     @db.Decimal(12, 2)  // principal + interés
  numberOfInstallments Int
  installmentAmount Decimal    @db.Decimal(12, 2)  // totalAmount / numberOfInstallments
  deliveryMethod   PaymentMethod
  loanDate         DateTime
  status           LoanStatus  @default(ACTIVE)
  notes            String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  installments     LoanInstallment[]

  @@map("loans")
}

model LoanInstallment {
  id          String            @id @default(cuid())
  loanId      String
  number      Int               // Número de cuota (1, 2, 3...)
  amount      Decimal           @db.Decimal(12, 2)
  dueDate     DateTime
  status      InstallmentStatus @default(PENDING)
  paidAmount  Decimal           @db.Decimal(12, 2) @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  loan        Loan          @relation(fields: [loanId], references: [id], onDelete: Cascade)
  payments    LoanPayment[]

  @@map("loan_installments")
}

model LoanPayment {
  id             String        @id @default(cuid())
  installmentId  String
  amount         Decimal       @db.Decimal(12, 2)
  paymentMethod  PaymentMethod
  paidAt         DateTime
  notes          String?
  createdAt      DateTime      @default(now())

  installment    LoanInstallment @relation(fields: [installmentId], references: [id], onDelete: Cascade)

  @@map("loan_payments")
}

model PersonalDebt {
  id            String      @id @default(cuid())
  userId        String
  creditorName  String
  totalAmount   Decimal     @db.Decimal(12, 2)
  paidAmount    Decimal     @db.Decimal(12, 2) @default(0)
  currency      Currency    @default(PEN)
  numberOfInstallments Int?
  dueDate       DateTime?
  paymentMethod PaymentMethod
  status        DebtStatus  @default(PENDING)
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments      DebtPayment[]

  @@map("personal_debts")
}

model DebtPayment {
  id            String        @id @default(cuid())
  debtId        String
  amount        Decimal       @db.Decimal(12, 2)
  paymentMethod PaymentMethod
  paidAt        DateTime
  notes         String?
  createdAt     DateTime      @default(now())

  debt          PersonalDebt  @relation(fields: [debtId], references: [id], onDelete: Cascade)

  @@map("debt_payments")
}

model SavingGoal {
  id               String           @id @default(cuid())
  userId           String
  name             String
  type             SavingGoalType   @default(CUSTOM)
  targetAmount     Decimal          @db.Decimal(12, 2)
  currentAmount    Decimal          @db.Decimal(12, 2) @default(0)
  currency         Currency         @default(PEN)
  targetDate       DateTime?
  monthlyContribution Decimal?      @db.Decimal(12, 2)
  status           SavingGoalStatus @default(IN_PROGRESS)
  notes            String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user             User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  contributions    SavingContribution[]

  @@map("saving_goals")
}

model SavingContribution {
  id            String        @id @default(cuid())
  goalId        String
  amount        Decimal       @db.Decimal(12, 2)
  paymentMethod PaymentMethod
  contributedAt DateTime
  notes         String?
  createdAt     DateTime      @default(now())

  goal SavingGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@map("saving_contributions")
}

model Income {
  id            String        @id @default(cuid())
  userId        String
  description   String
  amount        Decimal       @db.Decimal(12, 2)
  currency      Currency      @default(PEN)
  source        IncomeSource  @default(OTHER)
  paymentMethod PaymentMethod
  date          DateTime
  isRecurring   Boolean       @default(false)
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("incomes")
}
```

---

## 🔐 VARIABLES DE ENTORNO

### `apps/api/.env`
```env
# Base de datos
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT
JWT_ACCESS_SECRET="super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
PORT=4000
NODE_ENV="development"

# CORS - Orígenes permitidos
ALLOWED_ORIGINS="http://localhost:3000"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="Personal Finance <tu-email@gmail.com>"

# App
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

---

## 🌐 CONTRATOS DE API

### Formato de Respuesta Estándar

**Éxito:**
```typescript
{
  success: true,
  data: T,              // El payload específico
  message?: string
}
```

**Éxito con paginación:**
```typescript
{
  success: true,
  data: T[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: string,        // Mensaje legible para el usuario
  code?: string         // Código de error interno (opcional)
}
```

### HTTP Status Codes
```
200 OK            → GET exitoso
201 Created       → POST exitoso
204 No Content    → DELETE exitoso
400 Bad Request   → Validación fallida (Zod)
401 Unauthorized  → Sin token o token inválido
403 Forbidden     → Sin permisos
404 Not Found     → Recurso no encontrado
409 Conflict      → Email ya registrado
500 Internal      → Error del servidor
```

---

## 🔢 LÓGICA DE NEGOCIO CRÍTICA

### ⚠️ Motor de Cálculo de Préstamos (`loan-calculator.ts`)
Este es el módulo más crítico. Implementarlo EXACTAMENTE así:

```typescript
// apps/api/src/lib/loan-calculator.ts

interface LoanCalculationInput {
  principal: number;    // Monto original prestado
  numberOfInstallments: number;
}

interface LoanCalculationResult {
  principal: number;
  interestRate: number;       // 0.15 o 0.20
  interestAmount: number;     // Monto del interés
  totalAmount: number;        // principal + interestAmount
  installmentAmount: number;  // totalAmount / numberOfInstallments
  installments: InstallmentSchedule[];
}

interface InstallmentSchedule {
  number: number;
  amount: number;
  dueDate: Date;
}

export function calculateLoan(
  input: LoanCalculationInput,
  loanDate: Date
): LoanCalculationResult {
  const { principal, numberOfInstallments } = input;

  // REGLA DE NEGOCIO: Tasa según monto
  // < 1000 soles → 15% | >= 1000 soles → 20%
  const interestRate = principal < 1000 ? 0.15 : 0.20;

  const interestAmount = principal * interestRate;
  const totalAmount = principal + interestAmount;

  // Redondear a 2 decimales para evitar errores de punto flotante
  const installmentAmount = Math.round((totalAmount / numberOfInstallments) * 100) / 100;

  // Generar schedule de cuotas (mensual por defecto)
  const installments: InstallmentSchedule[] = Array.from(
    { length: numberOfInstallments },
    (_, index) => {
      const dueDate = new Date(loanDate);
      dueDate.setMonth(dueDate.getMonth() + index + 1);
      return {
        number: index + 1,
        amount: installmentAmount,
        dueDate,
      };
    }
  );

  return {
    principal,
    interestRate,
    interestAmount,
    totalAmount,
    installmentAmount,
    installments,
  };
}
```

### Reglas de validación de métodos de pago:
```
Gasto personal:   CREDIT_CARD, YAPE, PLIN, CASH  (NO BANK_TRANSFER)
Préstamo entrega: YAPE, PLIN, BANK_TRANSFER, CASH (NO CREDIT_CARD)
Préstamo cobro:   YAPE, PLIN, BANK_TRANSFER, CASH (NO CREDIT_CARD)
Deuda pago:       YAPE, PLIN, BANK_TRANSFER, CASH (NO CREDIT_CARD)
Ahorro depósito:  BANK_TRANSFER, CASH             (NO CREDIT_CARD, YAPE, PLIN)
```

---

## 🛣️ ENDPOINTS COMPLETOS

### Auth — `/api/v1/auth`
```
POST   /register           → Crear cuenta
POST   /login              → Obtener tokens
POST   /refresh            → Renovar access token
POST   /logout             → Invalidar refresh token
POST   /forgot-password    → Solicitar reset
POST   /reset-password     → Confirmar reset
GET    /me                 → Perfil del usuario autenticado [AUTH]
PUT    /profile            → Actualizar perfil [AUTH]
```

### Gastos — `/api/v1/expenses` [AUTH en todos]
```
GET    /                   → Listar (query: month, year, categoryId, paymentMethod, page, limit)
POST   /                   → Crear gasto
GET    /summary/monthly    → Resumen mensual por categoría (query: month, year)
GET    /:id                → Detalle
PUT    /:id                → Actualizar
DELETE /:id                → Eliminar
```

### Categorías — `/api/v1/categories` [AUTH en todos]
```
GET    /                   → Listar todas las categorías
POST   /                   → Crear categoría (admin)
```

### Presupuesto — `/api/v1/budgets` [AUTH en todos]
```
GET    /                   → Listar presupuestos (query: month, year)
POST   /                   → Crear/actualizar presupuesto de categoría
GET    /comparison         → Comparativa presupuesto vs gasto real (query: month, year)
DELETE /:id                → Eliminar presupuesto
```

### Préstamos — `/api/v1/loans` [AUTH en todos]
```
GET    /                   → Listar (query: status, borrowerName, page, limit)
POST   /                   → Crear préstamo (genera cuotas automáticamente)
GET    /upcoming           → Cuotas a vencer en los próximos N días (query: days=7)
GET    /summary            → Resumen: total prestado, cobrado, pendiente
GET    /:id                → Detalle con cuotas
PUT    /:id                → Actualizar datos del préstamo
GET    /:id/installments   → Listar cuotas del préstamo
POST   /:id/installments/:installmentId/pay → Registrar pago de cuota
```

### Deudas — `/api/v1/debts` [AUTH en todos]
```
GET    /                   → Listar (query: status, page, limit)
POST   /                   → Crear deuda
GET    /:id                → Detalle
PUT    /:id                → Actualizar
POST   /:id/pay            → Registrar pago
DELETE /:id                → Eliminar
```

### Ahorros — `/api/v1/savings` [AUTH en todos]
```
GET    /                   → Listar metas
POST   /                   → Crear meta
GET    /:id                → Detalle con aportes
PUT    /:id                → Actualizar meta
POST   /:id/contribute     → Registrar aporte
GET    /:id/projection     → Proyección de fecha de cumplimiento
DELETE /:id                → Eliminar meta
```

### Ingresos — `/api/v1/incomes` [AUTH en todos]
```
GET    /                   → Listar (query: month, year, source, page, limit)
POST   /                   → Crear ingreso
GET    /summary            → Resumen mensual por fuente (query: month, year)
GET    /:id                → Detalle
PUT    /:id                → Actualizar
DELETE /:id                → Eliminar
```

### Dashboard — `/api/v1/dashboard` [AUTH en todos]
```
GET    /summary            → Resumen general:
                             - expenses: total + byCategory del mes
                             - income: total + bySource del mes
                             - debtPayments: total pagos a deudas del mes (por paidAt)
                             - balance: income.total − expenses.total − debtPayments.total
                             - loans, debts, savings
GET    /upcoming-payments  → Próximos vencimientos (loans + debts, próximos 7 días)
```

---

## 🎨 GUÍA DE UI/UX

### Paleta de Colores (Tailwind)
```
Primary:   #1E3A5F  (navy)    → text-[#1E3A5F]
Accent:    #2E86AB  (teal)    → text-[#2E86AB]
Success:   #28A745  (green)   → text-green-600
Warning:   #F4A261  (amber)   → text-amber-500
Danger:    #E63946  (red)     → text-red-600
Background:#F8FAFC            → bg-slate-50
Card:      #FFFFFF            → bg-white
```

### Componentes Obligatorios a usar (shadcn/ui)
```
Button, Input, Label, Card, CardHeader, CardContent,
Badge, Select, Dialog, Sheet, Table, Skeleton,
Tabs, Progress, Tooltip, Avatar
```

### Íconos — Solo Lucide React
```typescript
import { 
  TrendingUp, TrendingDown, Wallet, CreditCard, 
  PiggyBank, Users, Bell, Settings, LogOut,
  Plus, Edit, Trash2, Eye, ChevronRight,
  DollarSign, Calendar, AlertTriangle, CheckCircle
} from 'lucide-react';
```

### Patrones de Animación (Framer Motion)
```typescript
// Entrada de página
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Entrada de cards en lista
const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 }
};

// Stagger para listas
const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

---

## 🔒 SEGURIDAD — IMPLEMENTACIÓN OBLIGATORIA

### En la API (Express):
```typescript
// En app.ts — configurar en este orden exacto
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde.' }
}));

app.use(express.json({ limit: '10kb' })); // Limitar payload
```

### Contraseñas (bcryptjs):
```typescript
const SALT_ROUNDS = 12; // Nunca menos de 12
const hash = await bcrypt.hash(password, SALT_ROUNDS);
const valid = await bcrypt.compare(password, hash);
```

### JWT:
```typescript
// Access token: expira en 15 minutos
// Refresh token: expira en 7 días, guardado en DB (campo refreshToken del User)
// Al logout: limpiar refreshToken en DB
// Al refresh: verificar que el refreshToken de la DB coincida
```

### Validación Zod (obligatorio en TODOS los endpoints):
```typescript
// En cada controller, SIEMPRE validar con el schema antes de procesar
const validated = schema.parse(req.body); // Lanza ZodError si falla
// El error.middleware.ts captura ZodError y retorna 400
```

---

## 📧 NOTIFICACIONES POR EMAIL

### Eventos que disparan emails:
```
1. Registro de usuario → Email de bienvenida
2. Recuperación de contraseña → Email con link de reset
3. Cuota de préstamo a 3 días de vencer → Recordatorio
4. Cuota de préstamo vencida hoy → Alerta
5. Cuota en mora (1 día después) → Alerta de mora
6. Presupuesto al 80% de una categoría → Advertencia
7. Meta de ahorro al 50%, 75%, 100% → Celebración/Alerta
```

### Cron Jobs (node-cron):
```typescript
// Ejecutar diariamente a las 8:00 AM hora Lima
cron.schedule('0 8 * * *', checkUpcomingInstallments, {
  timezone: 'America/Lima'
});
```

---

## 🧪 TESTING

### Prioridades de testing (en orden):
```
1. loan-calculator.ts → Tests unitarios OBLIGATORIOS (es la lógica más crítica)
2. Middlewares de autenticación
3. Controllers de préstamos
4. Cálculo de proyección de ahorros
```

### Framework: Jest + Supertest
```typescript
// Ejemplo de test para loan-calculator
describe('calculateLoan', () => {
  it('debe aplicar 15% para préstamos menores a S/1,000', () => {
    const result = calculateLoan({ principal: 800, numberOfInstallments: 4 }, new Date());
    expect(result.interestRate).toBe(0.15);
    expect(result.totalAmount).toBe(920);
    expect(result.installmentAmount).toBe(230);
  });

  it('debe aplicar 20% para préstamos de S/1,000 o más', () => {
    const result = calculateLoan({ principal: 1000, numberOfInstallments: 5 }, new Date());
    expect(result.interestRate).toBe(0.20);
    expect(result.totalAmount).toBe(1200);
    expect(result.installmentAmount).toBe(240);
  });
});
```

---

## 🚀 COMANDOS DEL PROYECTO

### Setup inicial
```bash
# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
cd apps/api && npx prisma generate

# 3. Ejecutar migraciones
npx prisma migrate dev --name init

# 4. Seed de categorías iniciales
npx prisma db seed
```

### Desarrollo
```bash
# Desde la raíz del monorepo
npm run dev          # Arranca todo (web + api) en paralelo con Turborepo

# O individualmente:
npm run dev --filter=web    # Solo frontend (puerto 3000)
npm run dev --filter=api    # Solo backend (puerto 4000)
```

### Scripts en `package.json` (raíz)
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:studio": "cd apps/api && npx prisma studio",
    "db:seed": "cd apps/api && npx prisma db seed"
  }
}
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN (SPRINTS)

### Sprint 1 — Fundamentos (Semana 1-2)
```
[x] 1.1 Inicializar monorepo con Turborepo
[x] 1.2 Crear apps/api con Express + TypeScript
[x] 1.3 Configurar Prisma + NeonDB + schema completo
[x] 1.4 Ejecutar migración inicial
[x] 1.5 Crear apps/web con Next.js 14 + TypeScript
[x] 1.6 Configurar TailwindCSS + shadcn/ui
[x] 1.7 Implementar Auth completo (backend + frontend)
[x] 1.8 Crear layout del dashboard con sidebar
[x] 1.9 Seed de categorías de gastos
```

### Sprint 2 — Gastos (Semana 3-4)
```
[x] 2.1 CRUD de gastos (backend)
[x] 2.2 Schemas Zod de gastos
[x] 2.3 UI: Listado de gastos con filtros
[x] 2.4 UI: Modal de crear/editar gasto
[x] 2.5 CRUD de presupuestos (backend + frontend)
[x] 2.6 Resumen mensual por categoría
```

### Sprint 3 — Préstamos (Semana 5-6)
```
[x] 3.1 Implementar loan-calculator.ts con tests
[x] 3.2 CRUD de préstamos (backend)
[x] 3.3 Endpoint de registro de pago de cuota
[x] 3.4 UI: Listado de préstamos con estados
[x] 3.5 UI: Detalle de préstamo con cronograma de cuotas
[x] 3.6 UI: Modal de registro de pago
```

### Sprint 4 — Deudas y Ahorros (Semana 7)
```
[x] 4.1 CRUD de deudas (backend + frontend)
[x] 4.2 CRUD de metas de ahorro (backend + frontend)
[x] 4.3 Lógica de proyección de ahorros
[x] 4.4 UI: Progreso visual de metas
```

### Sprint 5 — Dashboard y Notificaciones (Semana 8-9) ✅ COMPLETADO
```
[x] 5.1 Endpoint de resumen del dashboard
[x] 5.2 UI: Cards del dashboard con datos reales
[x] 5.3 Gráficas con Recharts (gastos por categoría)
[x] 5.4 Configurar Nodemailer
[x] 5.5 Implementar cron jobs de notificaciones
[x] 5.6 Templates de emails
```

### Sprint 6 — Ingresos y Balance Financiero ✅ COMPLETADO
```
[x] 6.1 Agregar enum IncomeSource y modelo Income al schema Prisma
[x] 6.2 Migración de BD (add_income)
[x] 6.3 Schema Zod income.schema.ts
[x] 6.4 income.service.ts (CRUD + resumen mensual por fuente)
[x] 6.5 income.controller.ts + income.routes.ts
[x] 6.6 Actualizar dashboard/summary: income.total, income.bySource, balance
[x] 6.7 Tipos compartidos Income en packages/shared
[x] 6.8 Hook useIncomes.ts
[x] 6.9 Página /incomes con listado, filtros por mes/fuente, paginación
[x] 6.10 IncomeFormModal (crear/editar), IncomeCard, IncomeSummaryCard
[x] 6.11 Sidebar: ítem "Ingresos" con ícono TrendingUp
[x] 6.12 Dashboard: card Ingresos del mes + BalanceBarChart (ingresos vs gastos)
```

### Sprint 7 — Detalle de Deuda con Historial de Pagos ✅ COMPLETADO
```
[x] 7.1 Página /debts/[id]/page.tsx con resumen de deuda y listado de pagos
[x] 7.2 Usar modelo debt_payments existente (NO se creó DebtInstallment)
[x] 7.3 Botón "Ver pagos" (ícono Eye) en DebtCard → navega a /debts/:id
[x] 7.4 getDebtById incluye payments[] ordenados por paidAt desc
```

### Sprint 8 — Forgot / Reset Password ✅ COMPLETADO
```
[x] 8.1 Campos resetPasswordToken y resetPasswordExpires en modelo User
[x] 8.2 Migración de BD (add_reset_password_fields)
[x] 8.3 forgotPassword: crypto.randomBytes(32) + SHA-256 hash en DB, expira 1h
[x] 8.4 resetPassword: verifica hash + expiración, actualiza password, limpia token
[x] 8.5 sendPasswordResetSuccessEmail en mailer.ts
[x] 8.6 Rutas POST /auth/forgot-password y POST /auth/reset-password
[x] 8.7 forgotPasswordRequest y resetPasswordRequest en apps/web/src/lib/auth.ts
[x] 8.8 Página /forgot-password (form email + estado de éxito genérico)
[x] 8.9 Página /reset-password (lee ?token, form nueva contraseña, redirect a login)
```

### Sprint 9 — Balance Real del Dashboard ✅ COMPLETADO
```
[x] 9.1 Dashboard /summary: agregar aggregate de DebtPayment del mes por paidAt
[x] 9.2 Fórmula: balance = income.total − expenses.total − debtPaymentsTotal
[x] 9.3 Respuesta incluye debtPayments: { total }
[x] 9.4 DashboardSummary tipo actualizado con debtPayments: { total: number }
[x] 9.5 BalanceBarChart: nueva prop debtPayments, tercera barra ámbar (#F4A261)
[x] 9.6 Desglose textual debajo del gráfico: Ingresos / Gastos / Pagos de deudas / Balance
```

### Sprint 10 — Inteligencia Artificial (A FUTURO)
```
[ ] 
```

### Sprint 11 — QA y Deploy (Pendiente)
```
[ ] 11.1 Revisar y completar tests unitarios
[ ] 11.2 Deploy API en Railway
[ ] 11.3 Deploy Web en Vercel
[ ] 11.4 Configurar variables de entorno en producción
[ ] 11.5 Smoke testing en producción
```

---

## ⚠️ ERRORES COMUNES A EVITAR

```
❌ Usar `Decimal` de Prisma directamente en el frontend sin convertir a number
   ✅ Convertir en el service: Number(prismaDecimal)

❌ Guardar el access token en localStorage
   ✅ Guardar en memoria (Zustand) y el refresh token en httpOnly cookie

❌ Exponer el passwordHash en las respuestas de la API
   ✅ Siempre excluir con: const { passwordHash, ...user } = dbUser

❌ Calcular fechas con operaciones manuales de milisegundos
   ✅ Siempre usar date-fns para operaciones de fecha

❌ Mutación directa del estado en Zustand
   ✅ Crear un nuevo objeto: set((state) => ({ ...state, user: newUser }))

❌ Fetch directo en componentes React
   ✅ Siempre usar custom hooks que encapsulen la llamada a la API

❌ Dejar console.log en código de producción
   ✅ Usar solo en desarrollo, remover antes de commit

❌ Números con punto flotante para montos financieros
   ✅ Usar Decimal en Prisma y parsear correctamente con toFixed(2)
```

---

## 📝 CONVENCIONES DE CÓDIGO

### Nombrado
```typescript
// Archivos: kebab-case
loan-calculator.ts
auth.middleware.ts

// Componentes React: PascalCase
LoanCard.tsx
ExpenseSummary.tsx

// Funciones y variables: camelCase
const calculateInstallment = () => {}
const totalAmount = 0

// Constantes: UPPER_SNAKE_CASE
const MAX_LOAN_AMOUNT = 50000
const SALT_ROUNDS = 12

// Tipos e interfaces: PascalCase
interface LoanCalculationResult {}
type PaymentStatus = 'PENDING' | 'PAID'
```

### Estructura de un Controller
```typescript
// Siempre seguir este patrón:
export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;           // Del middleware de auth
    const validated = loanSchema.parse(req.body);  // Validación Zod

    const result = await loanService.create(userId, validated); // Lógica en service

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error); // Siempre pasar al error handler global
  }
};
```

---

## 🌱 SEED DE CATEGORÍAS INICIALES

```typescript
// apps/api/prisma/seed.ts
const categories = [
  { name: 'Alimentación',       emoji: '🍕', color: '#FF6B6B' },
  { name: 'Transporte',         emoji: '🚗', color: '#4ECDC4' },
  { name: 'Salud',              emoji: '💊', color: '#45B7D1' },
  { name: 'Entretenimiento',    emoji: '🎮', color: '#96CEB4' },
  { name: 'Suscripciones',      emoji: '📱', color: '#FFEAA7' },
  { name: 'Servicios del hogar',emoji: '🏠', color: '#DDA0DD' },
  { name: 'Educación',          emoji: '📚', color: '#98D8C8' },
  { name: 'Ropa y accesorios',  emoji: '👕', color: '#F7DC6F' },
  { name: 'Otros',              emoji: '💼', color: '#BDC3C7' },
];
```

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

| Tecnología | URL |
|-----------|-----|
| Next.js 14 App Router | https://nextjs.org/docs/app |
| Prisma ORM | https://www.prisma.io/docs |
| NeonDB PostgreSQL | https://neon.tech/docs |
| Turborepo | https://turbo.build/repo/docs |
| TailwindCSS | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Framer Motion | https://www.framer.com/motion |
| Zod | https://zod.dev |
| Recharts | https://recharts.org/en-US |
| date-fns | https://date-fns.org |
| Zustand | https://zustand-demo.pmnd.rs |
| Nodemailer | https://nodemailer.com/about |
| node-cron | https://github.com/node-cron/node-cron |

---

*Última actualización: Marzo 2026 — v1.0*
*Autor: Alexander Gomez*
