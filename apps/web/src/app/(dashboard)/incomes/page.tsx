'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { IncomeFormModal } from '@/components/incomes/IncomeFormModal';
import { useIncomes, useIncomeSummary, useDeleteIncome } from '@/hooks/useIncomes';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Income } from '@finance-app/shared';
import { INCOME_SOURCE_LABELS, INCOME_SOURCE_COLORS } from '@finance-app/shared';

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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function IncomesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);

  const { incomes, pagination, isLoading, refetch } = useIncomes({
    month,
    year,
    source: source || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { summary, isLoading: summaryLoading, refetch: refetchSummary } = useIncomeSummary(month, year);
  const deleteIncome = useDeleteIncome();

  function handleSuccess() {
    refetch();
    refetchSummary();
    setPage(1);
  }

  function handleEdit(income: Income) {
    setEditingIncome(income);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingIncome(undefined);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteTarget(null);
    const ok = await deleteIncome.execute(deleteTarget.id);
    setDeletingId(null);
    if (ok) handleSuccess();
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setPage(1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
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
      <Navbar title="Ingresos" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Navegación de mes */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[#1E293B] min-w-[130px] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtro fuente */}
          <Select value={source} onValueChange={(v) => { setSource(v === 'ALL' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas las fuentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las fuentes</SelectItem>
              {(Object.keys(INCOME_SOURCE_LABELS) as Array<keyof typeof INCOME_SOURCE_LABELS>).map((src) => (
                <SelectItem key={src} value={src}>{INCOME_SOURCE_LABELS[src]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => { setEditingIncome(undefined); setModalOpen(true); }}
            className="bg-[#28A745] hover:bg-[#1e7e34] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo ingreso
          </Button>
        </div>

        {/* ── Resumen cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total ingresos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total ingresos</p>
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-[#28A745]">
                      {formatCurrency(summary?.totalAmount ?? 0)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{MONTHS[month - 1]} {year}</p>
                </div>
                <div className="rounded-lg p-3 bg-green-50">
                  <TrendingUp className="h-6 w-6 text-[#28A745]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cantidad de registros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Registros</p>
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                      {summary?.bySource.reduce((s, b) => s + b.count, 0) ?? 0}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">ingresos este mes</p>
                </div>
                <div className="rounded-lg p-3 bg-blue-50">
                  <TrendingUp className="h-6 w-6 text-[#2E86AB]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Por fuente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Por fuente</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {summaryLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : summary && summary.bySource.length > 0 ? (
                <div className="space-y-2">
                  {summary.bySource.slice(0, 4).map((item) => (
                    <div key={item.source} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: INCOME_SOURCE_COLORS[item.source] }}
                        />
                        <span className="text-slate-600">{INCOME_SOURCE_LABELS[item.source]}</span>
                      </div>
                      <span className="font-medium text-[#1E293B]">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Sin ingresos este mes</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Lista de ingresos ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">
              Ingresos — {MONTHS[month - 1]} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div key={i} variants={cardVariants}>
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </motion.div>
                ))}
              </motion.div>
            ) : incomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-500">Sin ingresos registrados</p>
                <p className="text-sm text-slate-400 mt-1">
                  Registra tu primer ingreso para comenzar a hacer seguimiento.
                </p>
                <Button
                  className="mt-4 bg-[#28A745] hover:bg-[#1e7e34] text-white"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar ingreso
                </Button>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
                {incomes.map((income) => (
                  <motion.div key={income.id} variants={cardVariants}>
                    <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-3 md:p-4 hover:bg-slate-50 transition-colors gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: INCOME_SOURCE_COLORS[income.source] }}
                        >
                          {INCOME_SOURCE_LABELS[income.source].charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1E293B] truncate">{income.description}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className="text-xs">
                              {INCOME_SOURCE_LABELS[income.source]}
                            </Badge>
                            {income.isRecurring && (
                              <Badge variant="outline" className="text-xs text-[#2E86AB]">
                                Recurrente
                              </Badge>
                            )}
                            <span className="text-xs text-slate-400">
                              {format(new Date(income.date), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-bold text-[#28A745] text-base md:text-lg">
                          +{formatCurrency(income.amount)}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-[#2E86AB]"
                            onClick={() => handleEdit(income)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            disabled={deletingId === income.id}
                            onClick={() => setDeleteTarget(income)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-slate-500">
                  Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, pagination.total)} de {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <IncomeFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        income={editingIncome}
        onSuccess={handleSuccess}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar ingreso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el ingreso{' '}
              <span className="font-medium text-[#1E293B]">"{deleteTarget?.description}"</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
