'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingDown,
  Users,
  CreditCard,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDashboard, useUpcomingPayments } from '@/hooks/useDashboard';
import { ExpensesPieChart } from '@/components/dashboard/ExpensesPieChart';
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments';
import { LoanStatusBar } from '@/components/dashboard/LoanStatusBar';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } },
};

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingPayments();

  const statCards: StatCard[] = data
    ? [
        {
          title: 'Gastos del mes',
          value: formatCurrency(data.expenses.total),
          subtitle: `${data.currentMonth.month}/${data.currentMonth.year}`,
          icon: TrendingDown,
          iconColor: 'text-[#E63946]',
          iconBg: 'bg-red-50',
        },
        {
          title: 'Por cobrar',
          value: formatCurrency(data.loans.totalPending),
          subtitle: `${data.loans.activeLoans} préstamo(s) activo(s)`,
          icon: Users,
          iconColor: 'text-[#2E86AB]',
          iconBg: 'bg-blue-50',
        },
        {
          title: 'Deudas pendientes',
          value: formatCurrency(data.debts.totalPending),
          subtitle: 'Total por pagar',
          icon: CreditCard,
          iconColor: 'text-[#F4A261]',
          iconBg: 'bg-amber-50',
        },
        {
          title: 'Total ahorrado',
          value: formatCurrency(data.savings.totalSaved),
          subtitle: `${data.savings.goalsCount} meta(s) de ahorro`,
          icon: PiggyBank,
          iconColor: 'text-[#28A745]',
          iconBg: 'bg-green-50',
        },
      ]
    : [];

  const isAllEmpty =
    data &&
    data.expenses.total === 0 &&
    data.loans.totalLent === 0 &&
    data.debts.totalPending === 0 &&
    data.savings.totalSaved === 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* ── Section 1: Stat Cards ── */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            : statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div key={index} variants={cardVariants}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                            <p className="mt-1 text-2xl font-bold text-[#1E293B]">{card.value}</p>
                            <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
                          </div>
                          <div className={`rounded-lg p-3 ${card.iconBg}`}>
                            <Icon className={`h-6 w-6 ${card.iconColor}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* ── Section 2: PieChart + Upcoming Payments ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <ExpensesPieChart
            byCategory={data?.expenses.byCategory ?? []}
            totalExpenses={data?.expenses.total ?? 0}
            isLoading={isLoading}
          />

          <UpcomingPayments
            loanInstallments={upcomingData?.loanInstallments ?? []}
            debts={upcomingData?.debts ?? []}
            isLoading={upcomingLoading}
          />
        </motion.div>

        {/* ── Section 3: Loan Status Bar ── */}
        {(isLoading || (data && data.loans.totalLent > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <LoanStatusBar loans={data?.loans ?? { totalLent: 0, totalCollected: 0, totalPending: 0, activeLoans: 0, completedLoans: 0, overdueLoans: 0 }} isLoading={isLoading} />
          </motion.div>
        )}

        {/* ── Empty State ── */}
        {isAllEmpty && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">Bienvenido a FinanceApp</p>
              <p className="text-sm text-slate-400 mt-1">
                Empieza registrando tus gastos, préstamos o metas de ahorro.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
