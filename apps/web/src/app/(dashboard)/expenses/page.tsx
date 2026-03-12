'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { MonthlySummaryChart } from '@/components/expenses/MonthlySummaryChart';
import { BudgetProgress } from '@/components/expenses/BudgetProgress';
import { BudgetFormModal } from '@/components/expenses/BudgetFormModal';
import { useExpenses, useMonthlySummary, useDeleteExpense } from '@/hooks/useExpenses';
import { useBudgetComparison } from '@/hooks/useBudgets';
import type { Expense } from '@finance-app/shared';

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
  animate: { transition: { staggerChildren: 0.07 } },
};

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  const { expenses, pagination, isLoading, refetch } = useExpenses({
    month,
    year,
    categoryId: categoryId || undefined,
    paymentMethod: paymentMethod || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { summary, isLoading: summaryLoading } = useMonthlySummary(month, year);
  const { comparison, isLoading: comparisonLoading, refetch: refetchComparison } = useBudgetComparison(month, year);

  const deleteExpense = useDeleteExpense();

  const handleMonthChange = useCallback((m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId(id);
    setPage(1);
  }, []);

  const handlePaymentMethodChange = useCallback((method: string) => {
    setPaymentMethod(method);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setCategoryId('');
    setPaymentMethod('');
    setPage(1);
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteExpense.execute(id);
    if (success) {
      refetch();
    }
  };

  const handleExpenseModalClose = () => {
    setExpenseModalOpen(false);
    setEditingExpense(undefined);
  };

  const handleExpenseSuccess = () => {
    refetch();
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Gastos" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Gestiona tus gastos y presupuestos</p>
          <Button
            onClick={() => {
              setEditingExpense(undefined);
              setExpenseModalOpen(true);
            }}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
          >
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <Target className="h-4 w-4" />
              Presupuesto
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: GASTOS ─────────────────────────────────────────────── */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            {/* Gráfica resumen */}
            <MonthlySummaryChart summary={summary} isLoading={summaryLoading} />

            {/* Filtros */}
            <ExpenseFilters
              month={month}
              year={year}
              categoryId={categoryId}
              paymentMethod={paymentMethod}
              onMonthChange={handleMonthChange}
              onCategoryChange={handleCategoryChange}
              onPaymentMethodChange={handlePaymentMethodChange}
              onClearFilters={handleClearFilters}
            />

            {/* Lista de gastos */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-[#E2E8F0] bg-white">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Receipt className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-500">No hay gastos registrados</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Agrega tu primer gasto para comenzar
                  </p>
                  <Button
                    className="mt-4 gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
                    onClick={() => setExpenseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo gasto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {expenses.map((expense) => (
                    <motion.div key={expense.id} variants={cardVariants}>
                      <ExpenseCard
                        expense={expense}
                        onEdit={() => handleEdit(expense)}
                        onDelete={() => handleDelete(expense.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Paginación */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-slate-500">
                      Página {pagination.page} de {pagination.totalPages} · {pagination.total}{' '}
                      gastos en total
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="gap-1"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── TAB: PRESUPUESTO ─────────────────────────────────────── */}
          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Presupuesto vs. gasto real para{' '}
                <span className="font-medium text-[#1E3A5F]">
                  {new Date(year, month - 1).toLocaleDateString('es-PE', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
              <Button
                onClick={() => setBudgetModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Agregar presupuesto
              </Button>
            </div>

            {comparisonLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-[#E2E8F0] bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : comparison.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-500">Sin presupuestos definidos</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Crea presupuestos por categoría para controlar tus gastos
                  </p>
                  <Button
                    className="mt-4 gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
                    onClick={() => setBudgetModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar presupuesto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {comparison.map((item) => (
                  <motion.div key={item.budget.id} variants={cardVariants}>
                    <BudgetProgress comparison={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      <ExpenseFormModal
        open={expenseModalOpen}
        onClose={handleExpenseModalClose}
        expense={editingExpense}
        onSuccess={handleExpenseSuccess}
      />

      <BudgetFormModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSuccess={() => refetchComparison()}
        defaultMonth={month}
        defaultYear={year}
      />
    </motion.div>
  );
}
