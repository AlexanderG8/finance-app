'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  Edit,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoanStatusBadge } from '@/components/loans/LoanStatusBadge';
import { InstallmentSchedule } from '@/components/loans/InstallmentSchedule';
import { useLoan, useLoanInstallments, useUpdateLoan } from '@/hooks/useLoans';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de crédito',
};

interface LoanDetailPageProps {
  params: { id: string };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = params;
  const { loan, isLoading, refetch } = useLoan(id);
  const { installments, isLoading: installmentsLoading, refetch: refetchInstallments } =
    useLoanInstallments(id);
  const { updateLoan, isLoading: updating } = useUpdateLoan();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  function openEdit() {
    setEditNotes(loan?.notes ?? '');
    setIsEditOpen(true);
  }

  async function handleSaveNotes() {
    if (!loan) return;
    await updateLoan({ id: loan.id, notes: editNotes });
    setIsEditOpen(false);
    refetch();
  }

  function handlePaymentSuccess() {
    refetch();
    refetchInstallments();
  }

  const paidInstallments = installments.filter((i) => i.status === 'PAID').length;

  if (isLoading) {
    return (
      <div>
        <Navbar title="Detalle de préstamo" />
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div>
        <Navbar title="Detalle de préstamo" />
        <div className="p-6">
          <Card>
            <CardContent className="py-16 text-center text-slate-500">
              Préstamo no encontrado.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const interestPercent = (loan.interestRate * 100).toFixed(0);

  const infoCards = [
    {
      label: 'Principal prestado',
      value: formatCurrency(loan.principal, loan.currency),
      icon: DollarSign,
      color: 'text-[#1E3A5F]',
      bg: 'bg-[#1E3A5F]/10',
    },
    {
      label: 'Total a cobrar',
      value: formatCurrency(loan.totalAmount, loan.currency),
      icon: TrendingUp,
      color: 'text-[#2E86AB]',
      bg: 'bg-[#2E86AB]/10',
    },
    {
      label: 'Tasa de interés',
      value: `${interestPercent}%`,
      icon: Percent,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Cuotas pagadas',
      value: `${paidInstallments} / ${loan.numberOfInstallments}`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Método de entrega',
      value: DELIVERY_METHOD_LABELS[loan.deliveryMethod] ?? loan.deliveryMethod,
      icon: CreditCard,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Fecha del préstamo',
      value: formatDate(loan.loanDate, 'long'),
      icon: Calendar,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" transition={{ duration: 0.3 }}>
      <Navbar title="Detalle de préstamo" />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/loans" className="hover:text-[#2E86AB] transition-colors">
            Préstamos
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#1E293B] font-medium">{loan.borrowerName}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold">
                {getInitials(loan.borrowerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#1E3A5F]">{loan.borrowerName}</h2>
                <LoanStatusBadge status={loan.status} />
              </div>
              {loan.borrowerContact && (
                <p className="text-sm text-slate-400 mt-0.5">{loan.borrowerContact}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-slate-600"
            onClick={openEdit}
          >
            <Edit className="h-4 w-4" />
            Editar notas
          </Button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {infoCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${card.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                    </div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </div>
                  <p className={`font-semibold text-base ${card.color}`}>{card.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notes */}
        {loan.notes && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Notas</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#1E293B]">{loan.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Installment schedule */}
        {installmentsLoading ? (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <InstallmentSchedule
            installments={installments}
            loanId={id}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>

      {/* Edit notes modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Editar notas</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="editNotes">Notas</Label>
            <textarea
              id="editNotes"
              rows={4}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 resize-none"
              placeholder="Observaciones del préstamo..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={updating}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={updating}
              className="bg-[#1E3A5F] hover:bg-[#2E86AB]"
            >
              {updating ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
