'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DebtCard } from '@/components/debts/DebtCard';
import { DebtFormModal } from '@/components/debts/DebtFormModal';
import { DebtPaymentModal } from '@/components/debts/DebtPaymentModal';
import { AIDebtStrategy } from '@/components/debts/AIDebtStrategy';
import { useDebts, useDeleteDebt } from '@/hooks/useDebts';
import { formatCurrency } from '@/lib/utils';
import type { PersonalDebt, DebtStatus } from '@finance-app/shared';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

type FilterStatus = 'ALL' | DebtStatus;

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Parcial', value: 'PARTIAL' },
  { label: 'Pagado', value: 'PAID' },
];

const PAGE_LIMIT = 10;

export default function DebtsPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [page, setPage] = useState(1);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<PersonalDebt | undefined>(undefined);
  const [payingDebt, setPayingDebt] = useState<PersonalDebt | undefined>(undefined);

  // Load all debts for stats (no status filter)
  const { debts: allDebts, refetch: refetchAll } = useDebts({ limit: 100 });

  // Load filtered debts for list
  const { deleteDebt } = useDeleteDebt();

  const {
    debts,
    pagination,
    isLoading,
    error,
    refetch,
  } = useDebts({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit: PAGE_LIMIT,
  });

  // Stats from all debts
  const totalDebt = allDebts.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPending = allDebts
    .filter((d) => d.status !== 'PAID')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalPaid = allDebts.reduce((sum, d) => sum + d.paidAmount, 0);

  function handleOpenCreate() {
    setEditingDebt(undefined);
    setFormModalOpen(true);
  }

  function handleOpenEdit(debt: PersonalDebt) {
    setEditingDebt(debt);
    setFormModalOpen(true);
  }

  function handleOpenPay(debt: PersonalDebt) {
    setPayingDebt(debt);
  }

  function handleSuccess() {
    refetch();
    refetchAll();
    setPage(1);
  }

  function handleFilterChange(filter: FilterStatus) {
    setStatusFilter(filter);
    setPage(1);
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Deudas" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 hidden sm:block">Gestiona tus deudas personales</p>
          <Button
            onClick={handleOpenCreate}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] ml-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva deuda</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Total deudas</p>
              <p className="text-xl font-bold text-[#1E3A5F]">
                {formatCurrency(totalDebt)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{allDebts.length} registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Por pagar</p>
              <p className="text-xl font-bold text-amber-500">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Monto pendiente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Pagado</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Monto abonado</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Debt Strategy */}
        <AIDebtStrategy />

        {/* Filters */}
        <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(opt.value)}
              className={
                statusFilter === opt.value
                  ? 'bg-[#1E3A5F] hover:bg-[#2E86AB]'
                  : 'text-slate-600'
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Debts list */}
        {!isLoading && !error && debts.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {debts.map((debt) => (
              <motion.div key={debt.id} variants={cardVariants}>
                <DebtCard
                  debt={debt}
                  onPay={() => handleOpenPay(debt)}
                  onEdit={() => handleOpenEdit(debt)}
                  onDelete={async () => {
                    const ok = await deleteDebt(debt.id);
                    if (ok) refetch();
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !error && debts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">
                {statusFilter === 'ALL'
                  ? 'No hay deudas registradas'
                  : `No hay deudas en estado "${filterOptions.find((f) => f.value === statusFilter)?.label}"`}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {statusFilter === 'ALL'
                  ? 'Agrega tu primera deuda para comenzar'
                  : 'Intenta con otro filtro'}
              </p>
              {statusFilter === 'ALL' && (
                <Button
                  className="mt-4 gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB]"
                  onClick={handleOpenCreate}
                >
                  <Plus className="h-4 w-4" />
                  Nueva deuda
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500">
              Página {page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <DebtFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        debt={editingDebt}
        onSuccess={handleSuccess}
      />

      {payingDebt && (
        <DebtPaymentModal
          open={Boolean(payingDebt)}
          onClose={() => setPayingDebt(undefined)}
          debt={payingDebt}
          onSuccess={handleSuccess}
        />
      )}
    </motion.div>
  );
}
