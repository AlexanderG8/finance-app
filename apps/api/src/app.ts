import { config as loadEnv } from 'dotenv';
import { join } from 'path';
// Load .env from apps/api/ regardless of the working directory (turborepo runs from root)
loadEnv({ path: join(__dirname, '../.env') });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import expensesRoutes from './routes/expenses.routes';
import loansRoutes from './routes/loans.routes';
import debtsRoutes from './routes/debts.routes';
import savingsRoutes from './routes/savings.routes';
import incomeRoutes from './routes/income.routes';
import chatRoutes from './routes/chat.routes';
import aiRoutes from './routes/ai.routes';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { startNotificationJobs } from './jobs/notification.job';

// Additional routes for categories and budgets
import { Router } from 'express';
import * as expensesController from './controllers/expenses.controller';
const categoriesRouter = Router();
const budgetsRouter = Router();

categoriesRouter.use(authMiddleware);
categoriesRouter.get('/', expensesController.listCategories);

budgetsRouter.use(authMiddleware);
budgetsRouter.get('/', expensesController.listBudgets);
budgetsRouter.post('/', expensesController.upsertBudget);
budgetsRouter.get('/comparison', expensesController.getBudgetComparison);
budgetsRouter.delete('/:id', expensesController.deleteBudget);

// Dashboard route
const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

import * as loansService from './services/loans.service';
import * as expensesService from './services/expenses.service';
import * as debtsService from './services/debts.service';
import * as savingsService from './services/savings.service';
import * as incomeService from './services/income.service';
import { Request, Response, NextFunction } from 'express';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';
import { prisma } from './lib/prisma';

dashboardRouter.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [loanSummary, monthlySummary, incomeSummary, debtsList, savingGoals, debtPaymentsAggregate] = await Promise.all([
      loansService.getLoanSummary(req.user.id),
      expensesService.getMonthlySummary(req.user.id, month, year),
      incomeService.getMonthlyIncomeSummary(req.user.id, month, year),
      debtsService.listDebts(req.user.id, { page: 1, limit: 100 }),
      savingsService.listSavingGoals(req.user.id),
      prisma.debtPayment.aggregate({
        where: {
          debt: { userId: req.user.id },
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalDebts = debtsList.data.reduce(
      (sum: number, d: { totalAmount: number; paidAmount: number }) => sum + (d.totalAmount - d.paidAmount),
      0
    );
    const totalSavings = savingGoals.reduce(
      (sum: number, g: { currentAmount: number }) => sum + g.currentAmount,
      0
    );
    const debtPaymentsTotal = Number(debtPaymentsAggregate._sum.amount ?? 0);

    res.status(200).json({
      success: true,
      data: {
        currentMonth: { month, year },
        expenses: {
          total: monthlySummary.totalAmount,
          byCategory: monthlySummary.byCategory,
        },
        income: {
          total: incomeSummary.totalAmount,
          bySource: incomeSummary.bySource,
        },
        debtPayments: { total: debtPaymentsTotal },
        balance: incomeSummary.totalAmount - monthlySummary.totalAmount - debtPaymentsTotal,
        loans: loanSummary,
        debts: { totalPending: totalDebts },
        savings: { totalSaved: totalSavings, goalsCount: savingGoals.length },
      },
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get('/upcoming-payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const [upcomingLoanInstallments, upcomingDebts] = await Promise.all([
      prisma.loanInstallment.findMany({
        where: {
          loan: { userId: req.user.id },
          dueDate: { gte: now, lte: sevenDaysFromNow },
          status: { in: ['PENDING', 'PARTIAL'] },
        },
        include: { loan: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.personalDebt.findMany({
        where: {
          userId: req.user.id,
          dueDate: { gte: now, lte: sevenDaysFromNow },
          status: { in: ['PENDING', 'PARTIAL'] },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        loanInstallments: upcomingLoanInstallments.map((i) => ({
          ...i,
          amount: Number(i.amount),
          paidAmount: Number(i.paidAmount),
          loan: {
            ...i.loan,
            principal: Number(i.loan.principal),
            totalAmount: Number(i.loan.totalAmount),
            installmentAmount: Number(i.loan.installmentAmount),
            interestRate: Number(i.loan.interestRate),
          },
        })),
        debts: upcomingDebts.map((d) => ({
          ...d,
          totalAmount: Number(d.totalAmount),
          paidAmount: Number(d.paidAmount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

const app = express();

// ── Security Middleware (exact order required) ────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? [],
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde.' },
  })
);

app.use(express.json({ limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/budgets', budgetsRouter);
app.use('/api/v1/loans', loansRoutes);
app.use('/api/v1/debts', debtsRoutes);
app.use('/api/v1/savings', savingsRoutes);
app.use('/api/v1/incomes', incomeRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/dashboard', dashboardRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is running.' });
});

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorMiddleware);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

const server = app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] Environment: ${process.env['NODE_ENV'] ?? 'development'}`);

  if (process.env['NODE_ENV'] === 'production') {
    startNotificationJobs();
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[API] Error: El puerto ${PORT} ya está en uso.`);
    console.error(`[API] Solución: detén el proceso que usa el puerto ${PORT} y vuelve a iniciar.`);
  } else {
    console.error('[API] Error al iniciar el servidor:', error.message);
  }
  process.exit(1);
});

export default app;
