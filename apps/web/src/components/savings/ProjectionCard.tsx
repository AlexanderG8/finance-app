'use client';

import { CheckCircle, AlertTriangle, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SavingGoalProjection } from '@finance-app/shared';

interface ProjectionCardProps {
  projection: SavingGoalProjection;
  currency?: 'PEN' | 'USD';
}

export function ProjectionCard({ projection, currency = 'PEN' }: ProjectionCardProps) {
  if (projection.isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-5 flex flex-col items-center text-center gap-2 py-8">
          <CheckCircle className="h-10 w-10 text-green-600" />
          <p className="text-lg font-bold text-green-700">¡Meta alcanzada!</p>
          <p className="text-sm text-green-600">
            Has logrado tu objetivo de ahorro. ¡Felicitaciones!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!projection.monthlyContribution || projection.monthlyContribution === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Proyección de cumplimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <Clock className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              Define una contribución mensual para ver la proyección de cumplimiento de esta meta.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Proyección de cumplimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {/* On track badge */}
        {projection.isOnTrack !== null && projection.isOnTrack !== undefined && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              projection.isOnTrack
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {projection.isOnTrack ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            {projection.isOnTrack ? 'En camino a cumplir la meta' : 'Con retraso respecto al objetivo'}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Contribución mensual</p>
            <p className="text-sm font-semibold text-[#1E293B]">
              {formatCurrency(projection.monthlyContribution, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Monto restante</p>
            <p className="text-sm font-semibold text-amber-600">
              {formatCurrency(projection.remaining, currency)}
            </p>
          </div>
          {projection.monthsToComplete !== null && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Meses restantes</p>
              <p className="text-sm font-semibold text-[#1E293B]">
                {projection.monthsToComplete} {projection.monthsToComplete === 1 ? 'mes' : 'meses'}
              </p>
            </div>
          )}
          {projection.projectedCompletionDate && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha estimada
              </p>
              <p className="text-sm font-semibold text-[#1E3A5F]">
                {formatDate(projection.projectedCompletionDate, 'long')}
              </p>
            </div>
          )}
          {projection.targetDate && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Fecha objetivo</p>
              <p className="text-sm font-semibold text-[#1E293B]">
                {formatDate(projection.targetDate, 'long')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
