'use client';

import { PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SavingContribution } from '@finance-app/shared';

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo',
};

interface ContributionHistoryProps {
  contributions: SavingContribution[];
  currency?: 'PEN' | 'USD';
}

export function ContributionHistory({ contributions, currency = 'PEN' }: ContributionHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
          <PiggyBank className="h-4 w-4" />
          Historial de aportes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-5">
            <PiggyBank className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No hay aportes registrados</p>
            <p className="text-xs text-slate-400 mt-1">
              Los aportes que realices aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs text-right">Monto</TableHead>
                  <TableHead className="text-xs">Método</TableHead>
                  <TableHead className="text-xs">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(contribution.contributedAt)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-green-600 text-right">
                      +{formatCurrency(contribution.amount, currency)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {contribution.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
