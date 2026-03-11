'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function DebtsPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Deudas" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">Gestiona tus deudas personales</p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva deuda
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No hay deudas registradas</p>
            <p className="text-sm text-slate-400 mt-1">Agrega tu primera deuda para comenzar</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
