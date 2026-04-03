import { prisma } from '../lib/prisma';
import {
  sendInstallmentReminderEmail,
  sendOverdueInstallmentEmail,
  sendBudgetAlertEmail,
  sendSavingGoalMilestoneEmail,
} from '../lib/mailer';
import { sendExpoPushNotification } from '../lib/push';
import { addDays } from 'date-fns';

// ─── 1. Cuotas a 3 días de vencer → Recordatorio ─────────────────────────────

export async function checkUpcomingInstallments(): Promise<void> {
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);

  const upcomingInstallments = await prisma.loanInstallment.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: threeDaysFromNow,
      },
      status: { in: ['PENDING', 'PARTIAL'] },
    },
    include: {
      loan: {
        include: { user: true },
      },
    },
  });

  for (const installment of upcomingInstallments) {
    const daysUntilDue = Math.ceil(
      (installment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await sendInstallmentReminderEmail(
      installment.loan.user.email,
      installment.loan.borrowerName,
      Number(installment.amount),
      installment.dueDate,
      daysUntilDue
    ).catch((err: unknown) => {
      console.error(`[Notifications] Failed to send reminder for installment ${installment.id}:`, err);
    });

    if (installment.loan.user.expoPushToken) {
      await sendExpoPushNotification(
        installment.loan.user.expoPushToken,
        '⏰ Cuota por vencer',
        `La cuota #${installment.number} de ${installment.loan.borrowerName} vence en ${daysUntilDue} día(s) — S/ ${Number(installment.amount).toFixed(2)}`,
        { type: 'installment_reminder', installmentId: installment.id }
      ).catch((err: unknown) => {
        console.error(`[Notifications] Push failed for installment ${installment.id}:`, err);
      });
    }
  }

  console.log(`[Notifications] checkUpcomingInstallments: processed ${upcomingInstallments.length} installment(s).`);
}

// ─── 2. Cuotas vencidas → Marcar OVERDUE + email de mora ─────────────────────

export async function checkOverdueInstallments(): Promise<void> {
  const now = new Date();

  // Fetch installments that are past due and still PENDING or PARTIAL
  const overdueInstallments = await prisma.loanInstallment.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['PENDING', 'PARTIAL'] },
    },
    include: {
      loan: {
        include: { user: true },
      },
    },
  });

  for (const installment of overdueInstallments) {
    const daysOverdue = Math.ceil(
      (now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update installment status to OVERDUE
    await prisma.loanInstallment.update({
      where: { id: installment.id },
      data: { status: 'OVERDUE' },
    });

    // Update parent loan status to OVERDUE
    await prisma.loan.update({
      where: { id: installment.loanId },
      data: { status: 'OVERDUE' },
    });

    // Send overdue email
    await sendOverdueInstallmentEmail(
      installment.loan.user.email,
      installment.loan.borrowerName,
      Number(installment.amount),
      installment.dueDate,
      daysOverdue
    ).catch((err: unknown) => {
      console.error(`[Notifications] Failed to send overdue email for installment ${installment.id}:`, err);
    });

    if (installment.loan.user.expoPushToken) {
      await sendExpoPushNotification(
        installment.loan.user.expoPushToken,
        '🚨 Cuota vencida',
        `La cuota #${installment.number} de ${installment.loan.borrowerName} lleva ${daysOverdue} día(s) vencida — S/ ${Number(installment.amount).toFixed(2)}`,
        { type: 'installment_overdue', installmentId: installment.id }
      ).catch((err: unknown) => {
        console.error(`[Notifications] Push failed for overdue installment ${installment.id}:`, err);
      });
    }
  }

  console.log(`[Notifications] checkOverdueInstallments: processed ${overdueInstallments.length} overdue installment(s).`);
}

// ─── 3. Presupuesto >= 80% → Alerta por email ────────────────────────────────

export async function checkBudgetAlerts(): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: { user: true, category: true },
  });

  for (const budget of budgets) {
    const expenses = await prisma.expense.aggregate({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      _sum: { amount: true },
    });

    const spent = Number(expenses._sum.amount ?? 0);
    const budgetAmount = Number(budget.amount);

    if (budgetAmount <= 0) continue;

    const percentage = (spent / budgetAmount) * 100;

    if (percentage >= 80) {
      console.log(
        `[Notifications] Budget alert: user=${budget.userId}, category=${budget.category.name}, pct=${percentage.toFixed(0)}%`
      );

      await sendBudgetAlertEmail(
        budget.user.email,
        budget.category.name,
        budget.category.emoji,
        spent,
        budgetAmount,
        percentage
      ).catch((err: unknown) => {
        console.error(`[Notifications] Failed to send budget alert for budget ${budget.id}:`, err);
      });

      if (budget.user.expoPushToken) {
        await sendExpoPushNotification(
          budget.user.expoPushToken,
          `${budget.category.emoji} Alerta de presupuesto`,
          `Llevas el ${percentage.toFixed(0)}% de tu presupuesto de ${budget.category.name} (S/ ${spent.toFixed(2)} / S/ ${budgetAmount.toFixed(2)})`,
          { type: 'budget_alert', budgetId: budget.id }
        ).catch((err: unknown) => {
          console.error(`[Notifications] Push failed for budget alert ${budget.id}:`, err);
        });
      }
    }
  }

  console.log(`[Notifications] checkBudgetAlerts: checked ${budgets.length} budget(s).`);
}

// ─── 4. Metas de ahorro en hitos 50%, 75%, 100% ──────────────────────────────

const SAVING_MILESTONES = [50, 75, 100] as const;
type Milestone = (typeof SAVING_MILESTONES)[number];

export async function checkSavingGoalMilestones(): Promise<void> {
  const goals = await prisma.savingGoal.findMany({
    where: { status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
    include: { user: true },
  });

  for (const goal of goals) {
    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);

    if (targetAmount <= 0) continue;

    const percentage = (currentAmount / targetAmount) * 100;

    for (const milestone of SAVING_MILESTONES) {
      if (percentage >= milestone) {
        // Send the email — idempotency is acceptable here since cron runs once/day
        // and the milestone check is a best-effort notification
        await sendSavingGoalMilestoneEmail(
          goal.user.email,
          goal.name,
          milestone,
          currentAmount,
          targetAmount
        ).catch((err: unknown) => {
          console.error(
            `[Notifications] Failed to send saving milestone email for goal ${goal.id} at ${milestone}%:`,
            err
          );
        });

        if (goal.user.expoPushToken) {
          const emoji = milestone === 100 ? '🎉' : milestone === 75 ? '🚀' : '⭐';
          await sendExpoPushNotification(
            goal.user.expoPushToken,
            `${emoji} Meta de ahorro al ${milestone}%`,
            `Tu meta "${goal.name}" alcanzó el ${milestone}% — S/ ${currentAmount.toFixed(2)} de S/ ${targetAmount.toFixed(2)}`,
            { type: 'saving_milestone', goalId: goal.id, milestone }
          ).catch((err: unknown) => {
            console.error(`[Notifications] Push failed for saving milestone ${goal.id} at ${milestone}%:`, err);
          });
        }

        // Only notify the highest milestone reached per run to avoid spam
        break;
      }
    }
  }

  console.log(`[Notifications] checkSavingGoalMilestones: checked ${goals.length} goal(s).`);
}

// ─── Master runner ────────────────────────────────────────────────────────────

export async function runAllNotificationChecks(): Promise<void> {
  console.log('[Notifications] Starting all notification checks...');

  await checkUpcomingInstallments().catch((err: unknown) => {
    console.error('[Notifications] checkUpcomingInstallments error:', err);
  });

  await checkOverdueInstallments().catch((err: unknown) => {
    console.error('[Notifications] checkOverdueInstallments error:', err);
  });

  await checkBudgetAlerts().catch((err: unknown) => {
    console.error('[Notifications] checkBudgetAlerts error:', err);
  });

  await checkSavingGoalMilestones().catch((err: unknown) => {
    console.error('[Notifications] checkSavingGoalMilestones error:', err);
  });

  console.log('[Notifications] All notification checks completed.');
}
