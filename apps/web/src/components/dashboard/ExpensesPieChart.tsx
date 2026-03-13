'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface CategoryExpense {
  category: { id: string; name: string; emoji: string; color: string };
  total: number;
  count: number;
}

interface ExpensesPieChartProps {
  byCategory: CategoryExpense[];
  totalExpenses: number;
  isLoading: boolean;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md">
      <p className="text-sm font-medium text-[#1E3A5F]">{entry.name}</p>
      <p className="text-sm font-semibold" style={{ color: entry.payload.color }}>
        {formatCurrency(entry.value)}
      </p>
    </div>
  );
}

interface LegendPayloadEntry {
  value: string;
  color: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadEntry[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {payload.map((entry, index) => (
        <li key={index} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-600 truncate max-w-[110px]" title={entry.value}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ExpensesPieChart({ byCategory, totalExpenses, isLoading }: ExpensesPieChartProps) {
  const data = byCategory.map((item) => ({
    name: `${item.category.emoji} ${item.category.name}`,
    value: item.total,
    color: item.category.color,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Skeleton className="h-52 w-52 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base text-[#1E3A5F]">Gastos por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-medium text-slate-500">Sin gastos este mes</p>
            <p className="text-xs text-slate-400 mt-1">
              Registra tu primer gasto para verlo aquí.
            </p>
          </div>
        ) : (
          /* Wrapper keeps the chart + center label in one stacking context */
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut center label — absolutely positioned over the chart */}
            <div
              className="pointer-events-none absolute flex flex-col items-center justify-center"
              style={{ top: 0, left: 0, right: 0, height: 200 }}
            >
              <p className="text-xs text-slate-400 leading-none">Total</p>
              <p className="mt-1 text-sm font-bold text-[#1E3A5F] leading-none">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
