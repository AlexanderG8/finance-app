'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface LoanStats {
  totalLent: number;
  totalCollected: number;
  totalPending: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
}

interface LoanStatusBarProps {
  loans: LoanStats;
  isLoading: boolean;
}

function LoanStatusBarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full rounded-full" />
        <div className="flex gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LoanStatusBar({ loans, isLoading }: LoanStatusBarProps) {
  if (isLoading) return <LoanStatusBarSkeleton />;

  const { totalLent, totalCollected, totalPending, activeLoans, completedLoans, overdueLoans } = loans;

  if (totalLent === 0) return null;

  const collectedPct = totalLent > 0 ? Math.min((totalCollected / totalLent) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#1E3A5F]">Estado de préstamos</CardTitle>
          <div className="flex items-center gap-2">
            {activeLoans > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">
                {activeLoans} activo{activeLoans !== 1 ? 's' : ''}
              </Badge>
            )}
            {overdueLoans > 0 && (
              <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs">
                {overdueLoans} en mora
              </Badge>
            )}
            {completedLoans > 0 && (
              <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                {completedLoans} completado{completedLoans !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>Cobrado: {formatCurrency(totalCollected)}</span>
            <span>{collectedPct.toFixed(0)}% del total</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${collectedPct}%`,
                background: 'linear-gradient(90deg, #2E86AB, #1E3A5F)',
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span className="text-[#28A745] font-medium">{formatCurrency(totalCollected)} cobrado</span>
            <span className="text-amber-600 font-medium">{formatCurrency(totalPending)} pendiente</span>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Total prestado</p>
            <p className="text-sm font-bold text-[#1E3A5F]">{formatCurrency(totalLent)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Cobrado</p>
            <p className="text-sm font-bold text-[#28A745]">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Pendiente</p>
            <p className="text-sm font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
