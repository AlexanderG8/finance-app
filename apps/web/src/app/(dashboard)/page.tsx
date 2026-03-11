'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  PiggyBank,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDashboard } from '@/hooks/useDashboard';

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

interface SummaryCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
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

  const summaryCards: SummaryCard[] = data
    ? [
        {
          title: 'Gastos del mes',
          value: formatCurrency(data.expenses.total),
          subtitle: `${data.currentMonth.month}/${data.currentMonth.year}`,
          icon: TrendingDown,
          color: 'text-[#E63946]',
          bgColor: 'bg-red-50',
        },
        {
          title: 'Préstamos activos',
          value: formatCurrency(data.loans.totalPending),
          subtitle: `${data.loans.activeLoans} préstamo(s) activo(s)`,
          icon: Users,
          color: 'text-[#2E86AB]',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Deudas pendientes',
          value: formatCurrency(data.debts.totalPending),
          subtitle: 'Total por pagar',
          icon: CreditCard,
          color: 'text-[#F4A261]',
          bgColor: 'bg-amber-50',
        },
        {
          title: 'Total ahorrado',
          value: formatCurrency(data.savings.totalSaved),
          subtitle: `${data.savings.goalsCount} meta(s) de ahorro`,
          icon: PiggyBank,
          color: 'text-[#28A745]',
          bgColor: 'bg-green-50',
        },
      ]
    : [];

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
        {/* Summary Cards */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            : summaryCards.map((card, index) => {
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
                          <div className={`rounded-lg p-3 ${card.bgColor}`}>
                            <Icon className={`h-6 w-6 ${card.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* Expenses by Category */}
        {data && data.expenses.byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#1E3A5F]">Gastos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.expenses.byCategory.map((item) => (
                  <div key={item.category.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.category.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">{item.category.name}</p>
                        <p className="text-xs text-slate-500">{item.count} transacción(es)</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#E63946]">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loan Status Summary */}
        {data && (data.loans.overdueLoans > 0) && (
          <Card className="border-[#F4A261]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-[#F4A261]" />
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">Préstamos en mora</p>
                  <p className="text-xs text-slate-500">
                    Tienes {data.loans.overdueLoans} préstamo(s) con cuotas vencidas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {data &&
          data.expenses.total === 0 &&
          data.loans.totalLent === 0 &&
          data.debts.totalPending === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-500">Bienvenido a FinanceApp</p>
                <p className="text-sm text-slate-400 mt-1">
                  Empieza registrando tus gastos o préstamos.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </motion.div>
  );
}
