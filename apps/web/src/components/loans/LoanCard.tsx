'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Calendar, Percent, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoanStatusBadge } from './LoanStatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { Loan } from '@finance-app/shared';

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const router = useRouter();

  const interestPercent = (loan.interestRate * 100).toFixed(0);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F] text-sm font-semibold">
                {getInitials(loan.borrowerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-[#1E293B] truncate">{loan.borrowerName}</p>
              {loan.borrowerContact && (
                <p className="text-xs text-slate-400 truncate">{loan.borrowerContact}</p>
              )}
            </div>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Principal</p>
            <p className="text-lg font-bold text-[#1E3A5F]">
              {formatCurrency(loan.principal, loan.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Total a cobrar</p>
            <p className="text-lg font-semibold text-[#1E293B]">
              {formatCurrency(loan.totalAmount, loan.currency)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Tasa {interestPercent}%
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {loan.numberOfInstallments} cuotas de {formatCurrency(loan.installmentAmount, loan.currency)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(loan.loanDate)}
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-[#2E86AB] hover:text-[#1E3A5F] hover:bg-[#2E86AB]/10"
            onClick={() => router.push(`/loans/${loan.id}`)}
          >
            Ver detalle
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
