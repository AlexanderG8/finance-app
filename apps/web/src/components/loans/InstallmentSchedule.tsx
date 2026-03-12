'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InstallmentStatusBadge } from './LoanStatusBadge';
import { PaymentModal } from './PaymentModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LoanInstallment } from '@finance-app/shared';

interface InstallmentScheduleProps {
  installments: LoanInstallment[];
  loanId: string;
  onPaymentSuccess: () => void;
}

export function InstallmentSchedule({
  installments,
  loanId,
  onPaymentSuccess,
}: InstallmentScheduleProps) {
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);

  const canPay = (status: LoanInstallment['status']) =>
    status === 'PENDING' || status === 'PARTIAL' || status === 'OVERDUE';

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-base font-semibold text-[#1E3A5F]">Cronograma de cuotas</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Pagado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {installments.map((installment) => {
                  const remaining = installment.amount - installment.paidAmount;
                  return (
                    <tr
                      key={installment.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#1E293B]">
                        #{installment.number}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(installment.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#1E293B]">
                        {formatCurrency(installment.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {installment.paidAmount > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(installment.paidAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {installment.status === 'PARTIAL' && (
                          <p className="text-xs text-amber-500 mt-0.5">
                            Falta: {formatCurrency(remaining)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <InstallmentStatusBadge status={installment.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canPay(installment.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-[#2E86AB] text-[#2E86AB] hover:bg-[#2E86AB] hover:text-white"
                            onClick={() => setSelectedInstallment(installment)}
                          >
                            Registrar pago
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {installments.length === 0 && (
              <div className="py-10 text-center text-slate-400">
                No hay cuotas registradas.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedInstallment && (
        <PaymentModal
          open={selectedInstallment !== null}
          onClose={() => setSelectedInstallment(null)}
          loanId={loanId}
          installment={selectedInstallment}
          onSuccess={() => {
            setSelectedInstallment(null);
            onPaymentSuccess();
          }}
        />
      )}
    </>
  );
}
