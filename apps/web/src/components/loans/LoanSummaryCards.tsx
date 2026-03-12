'use client';

import { DollarSign, Clock, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { LoanSummary } from '@finance-app/shared';

interface LoanSummaryCardsProps {
  summary: LoanSummary | null;
  isLoading: boolean;
}

export function LoanSummaryCards({ summary, isLoading }: LoanSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Prestado',
      value: formatCurrency(summary?.totalLent ?? 0),
      icon: DollarSign,
      color: 'text-[#1E3A5F]',
      bgColor: 'bg-[#1E3A5F]/10',
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(summary?.totalPending ?? 0),
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Cobrado',
      value: formatCurrency(summary?.totalCollected ?? 0),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Préstamos activos',
      value: String(summary?.activeLoans ?? 0),
      icon: Users,
      color: 'text-[#2E86AB]',
      bgColor: 'bg-[#2E86AB]/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
