'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoanSummaryCards } from '@/components/loans/LoanSummaryCards';
import { LoanCard } from '@/components/loans/LoanCard';
import { LoanFormModal } from '@/components/loans/LoanFormModal';
import { useLoans, useLoanSummary, useDeleteLoan } from '@/hooks/useLoans';
import type { LoanStatus } from '@finance-app/shared';

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

export default function LoansPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const filters = {
    borrowerName: searchName || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    limit: 12,
  };

  const { loans, pagination, isLoading, refetch } = useLoans(filters);
  const { summary, isLoading: summaryLoading, refetch: refetchSummary } = useLoanSummary();
  const { deleteLoan } = useDeleteLoan();

  const handleSuccess = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteLoan(id);
    if (ok) handleSuccess();
  }, [deleteLoan, handleSuccess]);

  const handleSearch = useCallback((value: string) => {
    setSearchName(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as LoanStatus | 'ALL');
    setPage(1);
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Préstamos" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 hidden sm:block">Gestiona los préstamos otorgados</p>
          <Button
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] ml-auto"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo préstamo</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>

        {/* Summary cards */}
        <LoanSummaryCards summary={summary} isLoading={summaryLoading} />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre..."
              className="pl-9"
              value={searchName}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="OVERDUE">En mora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loan list */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">No hay préstamos registrados</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchName || statusFilter !== 'ALL'
                  ? 'Prueba con otros filtros'
                  : 'Agrega tu primer préstamo para comenzar'}
              </p>
              {!searchName && statusFilter === 'ALL' && (
                <Button
                  className="mt-4 gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB]"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo préstamo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {loans.map((loan) => (
                <motion.div
                  key={loan.id}
                  variants={cardVariants}
                  transition={{ duration: 0.2 }}
                >
                  <LoanCard loan={loan} onDelete={() => handleDelete(loan.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 text-center sm:text-left">
              Mostrando {loans.length} de {pagination.total} préstamos
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <LoanFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </motion.div>
  );
}
