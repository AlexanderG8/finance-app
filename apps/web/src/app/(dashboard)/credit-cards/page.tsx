'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CreditCard, Wallet } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCardFormModal } from '@/components/credit-cards/CreditCardFormModal';
import { CreditCardCycleSummary } from '@/components/credit-cards/CreditCardCycleSummary';
import { useCreditCards, useDeleteCreditCard } from '@/hooks/useCreditCards';
import { formatCurrency } from '@/lib/utils';
import type { CreditCard as CreditCardType } from '@finance-app/shared';

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

export default function CreditCardsPage() {
  const { cards, isLoading, refetch } = useCreditCards();
  const { deleteCreditCard, isLoading: isDeleting } = useDeleteCreditCard();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | undefined>(undefined);
  const [deletingCard, setDeletingCard] = useState<CreditCardType | null>(null);

  function handleEdit(card: CreditCardType) {
    setEditingCard(card);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingCard(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deletingCard) return;
    const ok = await deleteCreditCard(deletingCard.id);
    if (ok) {
      setDeletingCard(null);
      refetch();
    }
  }

  const totalLimit = cards.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0);
  const cardsWithLimit = cards.filter((c) => c.creditLimit !== null).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Tarjetas de crédito" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 hidden sm:block">
            Controla el consumo por ciclo de facturación
          </p>
          <Button
            onClick={handleNew}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] ml-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva tarjeta</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Tarjetas registradas</p>
              <p className="text-xl font-bold text-[#1E3A5F]">
                {isLoading ? '—' : cards.length}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">en total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Límite total</p>
              <p className="text-xl font-bold text-[#1E3A5F]">
                {isLoading ? '—' : totalLimit > 0 ? formatCurrency(totalLimit) : 'Sin límite'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {cardsWithLimit} {cardsWithLimit === 1 ? 'tarjeta con límite' : 'tarjetas con límite'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Monedas</p>
              <p className="text-xl font-bold text-[#1E3A5F]">
                {isLoading
                  ? '—'
                  : [...new Set(cards.map((c) => c.currency))].join(' · ') || '—'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">utilizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wallet className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm mb-4">No tienes tarjetas de crédito registradas</p>
            <Button onClick={handleNew} className="bg-[#1E3A5F] hover:bg-[#2E86AB]">
              Agregar tarjeta
            </Button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {cards.map((card) => (
              <motion.div key={card.id} variants={cardVariants}>
                <Card className="border border-slate-100 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-[#1E3A5F]" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-[#1E293B]">
                            {card.entityName}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {card.currency}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#2E86AB] hover:bg-slate-100 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCard(card)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Ciclo inicia día {card.cycleStartDay} · Pago límite día {card.paymentDueDay}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CreditCardCycleSummary cardId={card.id} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Form Modal */}
      <CreditCardFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCard(undefined); }}
        card={editingCard}
        onSuccess={refetch}
      />

      {/* Delete confirmation */}
      <Dialog open={Boolean(deletingCard)} onOpenChange={(open) => { if (!open) setDeletingCard(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tarjeta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la tarjeta{' '}
              <strong>{deletingCard?.entityName}</strong>?{' '}
              Los gastos asociados perderán el vínculo con esta tarjeta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCard(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
