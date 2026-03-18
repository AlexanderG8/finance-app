'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface BalanceBarChartProps {
  income: number;
  expenses: number;
  debtPayments: number;
  balance: number;
  month: number;
  year: number;
  isLoading: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 shadow-lg">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium text-[#1E293B]">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function BalanceBarChart({ income, expenses, debtPayments, balance, month, year, isLoading }: BalanceBarChartProps) {
  const data = [
    {
      name: MONTHS[month - 1] + ' ' + year,
      Ingresos: income,
      Gastos: expenses,
      'Pagos de deudas': debtPayments,
    },
  ];

  const isPositive = balance >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#1E3A5F]">Balance del mes</CardTitle>
          {!isLoading && (
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isPositive ? '+' : ''}{formatCurrency(balance)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value) => <span style={{ color: '#64748B' }}>{value}</span>}
                />
                <Bar dataKey="Ingresos" fill="#28A745" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Gastos" fill="#E63946" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Pagos de deudas" fill="#F4A261" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>

            {/* Desglose textual */}
            <div className="mt-3 space-y-1 border-t border-[#E2E8F0] pt-3 text-xs text-slate-500">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#28A745]" />
                  Ingresos
                </span>
                <span className="font-medium text-[#1E293B]">+{formatCurrency(income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#E63946]" />
                  Gastos
                </span>
                <span className="font-medium text-[#1E293B]">−{formatCurrency(expenses)}</span>
              </div>
              {debtPayments > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#F4A261]" />
                    Pagos de deudas
                  </span>
                  <span className="font-medium text-[#1E293B]">−{formatCurrency(debtPayments)}</span>
                </div>
              )}
              <div className={`flex justify-between border-t border-[#E2E8F0] pt-1 font-semibold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
                <span>Balance</span>
                <span>{isPositive ? '+' : ''}{formatCurrency(balance)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
