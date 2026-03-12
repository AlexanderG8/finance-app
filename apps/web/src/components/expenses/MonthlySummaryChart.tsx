'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { MonthlySummary } from '@finance-app/shared';

interface MonthlySummaryChartProps {
  summary: MonthlySummary | null;
  isLoading: boolean;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    color: string;
    name: string;
    value: number;
    percentage: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  if (!item) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-md text-sm">
      <p className="font-medium text-[#1E293B]">{item.name}</p>
      <p className="text-[#2E86AB]">{formatCurrency(item.value)}</p>
      <p className="text-slate-500">{item.payload.percentage.toFixed(1)}% del total</p>
    </div>
  );
}

interface LegendItem {
  emoji: string;
  name: string;
  total: number;
  percentage: number;
  color: string;
}

interface CustomLegendProps {
  items: LegendItem[];
}

function CustomLegend({ items }: CustomLegendProps) {
  return (
    <div className="space-y-2 mt-4">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-600">
              {item.emoji} {item.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{item.percentage.toFixed(1)}%</span>
            <span className="font-medium text-[#1E293B] w-24 text-right">
              {formatCurrency(item.total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthlySummaryChart({ summary, isLoading }: MonthlySummaryChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1E3A5F]">Resumen del mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-slate-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.byCategory.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1E3A5F]">Resumen del mes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-slate-400">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-sm">No hay gastos registrados este mes</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = summary.byCategory.map((item) => ({
    name: `${item.category.emoji} ${item.category.name}`,
    value: item.total,
    color: item.category.color,
    percentage: summary.totalAmount > 0 ? (item.total / summary.totalAmount) * 100 : 0,
    emoji: item.category.emoji,
  }));

  const legendItems: LegendItem[] = summary.byCategory.map((item) => ({
    emoji: item.category.emoji,
    name: item.category.name,
    total: item.total,
    percentage: summary.totalAmount > 0 ? (item.total / summary.totalAmount) * 100 : 0,
    color: item.category.color,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#1E3A5F]">Resumen del mes</CardTitle>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total gastado</p>
            <p className="text-lg font-bold text-[#E63946]">
              {formatCurrency(summary.totalAmount)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full">
            <CustomLegend items={legendItems} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
