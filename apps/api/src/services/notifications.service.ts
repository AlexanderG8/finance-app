import { prisma } from '../lib/prisma';
import { sendInstallmentReminderEmail } from '../lib/mailer';
import { addDays, isToday, isPast } from 'date-fns';

export async function checkUpcomingInstallments(): Promise<void> {
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);

  // Get installments due in 3 days
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
    ).catch((err) => {
      console.error(`Failed to send reminder for installment ${installment.id}:`, err);
    });
  }

  // Check overdue installments and update loan status
  const overdueInstallments = await prisma.loanInstallment.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ['PENDING', 'PARTIAL'] },
    },
    include: { loan: true },
  });

  for (const installment of overdueInstallments) {
    await prisma.loanInstallment.update({
      where: { id: installment.id },
      data: { status: 'OVERDUE' },
    });

    await prisma.loan.update({
      where: { id: installment.loanId },
      data: { status: 'OVERDUE' },
    });
  }
}

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
    const percentage = (spent / budgetAmount) * 100;

    if (percentage >= 80) {
      console.log(
        `Budget alert for user ${budget.userId}: ${budget.category.name} at ${percentage.toFixed(0)}%`
      );
      // Email notification would go here
    }
  }
}
