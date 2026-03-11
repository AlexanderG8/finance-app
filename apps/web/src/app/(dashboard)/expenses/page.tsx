'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ExpensesPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Gastos" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">Gestiona tus gastos mensuales</p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No hay gastos registrados</p>
            <p className="text-sm text-slate-400 mt-1">Agrega tu primer gasto para comenzar</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
