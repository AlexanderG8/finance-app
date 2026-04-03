'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
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
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import type { ExpenseCategory } from '@finance-app/shared';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function CategoriesPage() {
  const { categories, isLoading, refetch } = useCategories();
  const { deleteCategory, isLoading: isDeleting } = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);

  const systemCategories = categories.filter((c) => !c.isUserCategory);
  const userCategories = categories.filter((c) => c.isUserCategory);

  function handleNew() {
    setEditingCategory(undefined);
    setFormOpen(true);
  }

  function handleEdit(cat: ExpenseCategory) {
    setEditingCategory(cat);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    const ok = await deleteCategory(deletingCategory.id);
    if (ok) {
      setDeletingCategory(null);
      refetch();
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Categorías" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500 hidden sm:block">
            Gestiona tus categorías personalizadas de gastos
          </p>
          <Button
            onClick={handleNew}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] ml-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva categoría</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Categorías del usuario */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Mis categorías ({userCategories.length})
              </h2>
              {userCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-slate-400 text-sm mb-3">Aún no tienes categorías personalizadas</p>
                  <Button
                    onClick={handleNew}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear primera categoría
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: cat.color + '30' }}
                      >
                        {cat.emoji}
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#2E86AB] hover:bg-slate-100 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categorías del sistema */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Categorías del sistema ({systemCategories.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 opacity-75"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: cat.color + '30' }}
                    >
                      {cat.emoji}
                    </div>
                    <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                      {cat.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">Sistema</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCategory(undefined); }}
        onSuccess={refetch}
        category={editingCategory}
      />

      <Dialog open={Boolean(deletingCategory)} onOpenChange={(o) => { if (!o) setDeletingCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría{' '}
              <strong>{deletingCategory?.emoji} {deletingCategory?.name}</strong>?{' '}
              Los gastos asociados perderán la referencia a esta categoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)} disabled={isDeleting}>
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
