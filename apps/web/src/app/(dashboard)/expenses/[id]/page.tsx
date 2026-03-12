'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  RefreshCw,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { useExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { formatCurrency, formatDate } from '@/lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta de crédito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
};

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E2E8F0] last:border-0">
      <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-[#1E293B]">{value}</div>
      </div>
    </div>
  );
}

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { expense, isLoading, error, refetch } = useExpense(params.id);
  const deleteExpense = useDeleteExpense();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    const success = await deleteExpense.execute(params.id);
    if (success) {
      router.push('/expenses');
    }
    setDeleteDialogOpen(false);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" transition={{ duration: 0.3 }}>
      <Navbar title="Detalle de gasto" />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/expenses" className="hover:text-[#2E86AB] transition-colors">
            Gastos
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#1E293B] font-medium">Detalle</span>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-[#E2E8F0]">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-slate-500">Gasto no encontrado</p>
              <p className="text-sm text-slate-400 mt-1">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/expenses')}
              >
                Volver a gastos
              </Button>
            </CardContent>
          </Card>
        ) : expense ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${expense.category.color}20` }}
                  >
                    {expense.category.emoji}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#1E3A5F]">
                      {expense.description}
                    </CardTitle>
                    <p className="text-2xl font-bold text-[#E63946] mt-1">
                      -{formatCurrency(expense.amount, expense.currency)}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <DetailRow
                icon={<Tag className="h-4 w-4" />}
                label="Categoría"
                value={
                  <Badge
                    style={{
                      backgroundColor: `${expense.category.color}20`,
                      color: expense.category.color,
                    }}
                  >
                    {expense.category.emoji} {expense.category.name}
                  </Badge>
                }
              />
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Método de pago"
                value={PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Fecha"
                value={formatDate(expense.date, 'long')}
              />
              <DetailRow
                icon={<DollarSign className="h-4 w-4" />}
                label="Moneda"
                value={expense.currency === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)'}
              />
              <DetailRow
                icon={<RefreshCw className="h-4 w-4" />}
                label="Tipo"
                value={
                  expense.isRecurring ? (
                    <Badge variant="outline" className="text-[#2E86AB] border-[#2E86AB]">
                      Recurrente mensual
                    </Badge>
                  ) : (
                    <span className="text-slate-500">Gasto único</span>
                  )
                }
              />
              {expense.notes && (
                <DetailRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Notas"
                  value={<span className="text-slate-600">{expense.notes}</span>}
                />
              )}

              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <p className="text-xs text-slate-400">
                  Creado el {formatDate(expense.createdAt, 'long')}
                  {expense.updatedAt !== expense.createdAt &&
                    ` · Actualizado el ${formatDate(expense.updatedAt, 'long')}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Modal de edición */}
      {expense && (
        <ExpenseFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          expense={expense}
          onSuccess={() => {
            refetch();
            setEditModalOpen(false);
          }}
        />
      )}

      {/* Confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteExpense.isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteExpense.isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
