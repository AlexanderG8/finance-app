'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <Navbar title="Detalle de gasto" />
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/expenses" className="hover:text-[#2E86AB]">Gastos</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#1E293B]">Detalle</span>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500">Cargando gasto {params.id}...</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
