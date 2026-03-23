import { calculateLoan } from '../lib/loan-calculator';

describe('calculateLoan', () => {
  // ─── Ejemplo base del requerimiento ──────────────────────────────────────
  // principal=900, interestRate=15%, 3 cuotas
  // interestAmount = 900 * 0.15 = 135 (fijo por cuota)
  // installmentAmount = (900/3) + 135 = 300 + 135 = 435
  // totalAmount = 435 * 3 = 1305
  // totalProfit = 135 * 3 = 405

  it('debe calcular correctamente: principal=900, tasa=15%, 3 cuotas', () => {
    const result = calculateLoan({ principal: 900, interestRate: 0.15, numberOfInstallments: 3 }, new Date());
    expect(result.interestRate).toBe(0.15);
    expect(result.interestAmount).toBe(135);
    expect(result.installmentAmount).toBe(435);
    expect(result.totalAmount).toBe(1305);
    expect(result.totalProfit).toBe(405);
  });

  it('debe calcular correctamente: principal=1000, tasa=20%, 5 cuotas', () => {
    const result = calculateLoan({ principal: 1000, interestRate: 0.20, numberOfInstallments: 5 }, new Date());
    expect(result.interestRate).toBe(0.20);
    expect(result.interestAmount).toBe(200);          // 1000 * 0.20
    expect(result.installmentAmount).toBe(400);       // (1000/5) + 200 = 200 + 200
    expect(result.totalAmount).toBe(2000);            // 400 * 5
    expect(result.totalProfit).toBe(1000);            // 200 * 5
  });

  it('debe aplicar interestRate del input (no tasa fija por monto)', () => {
    const result = calculateLoan({ principal: 500, interestRate: 0.10, numberOfInstallments: 2 }, new Date());
    expect(result.interestRate).toBe(0.10);
    expect(result.interestAmount).toBe(50);           // 500 * 0.10
    expect(result.installmentAmount).toBe(300);       // (500/2) + 50 = 250 + 50
    expect(result.totalAmount).toBe(600);             // 300 * 2
    expect(result.totalProfit).toBe(100);             // 50 * 2
  });

  it('debe preservar el principal en el resultado', () => {
    const result = calculateLoan({ principal: 1200, interestRate: 0.15, numberOfInstallments: 4 }, new Date());
    expect(result.principal).toBe(1200);
  });

  it('debe generar el número correcto de cuotas', () => {
    const result = calculateLoan({ principal: 500, interestRate: 0.15, numberOfInstallments: 6 }, new Date());
    expect(result.installments).toHaveLength(6);
  });

  it('debe asignar el mismo monto a cada cuota del schedule', () => {
    const result = calculateLoan({ principal: 800, interestRate: 0.15, numberOfInstallments: 4 }, new Date());
    result.installments.forEach((installment) => {
      expect(installment.amount).toBe(result.installmentAmount);
    });
  });

  it('debe numerar las cuotas desde 1 consecutivamente', () => {
    const result = calculateLoan({ principal: 800, interestRate: 0.15, numberOfInstallments: 4 }, new Date());
    result.installments.forEach((installment, index) => {
      expect(installment.number).toBe(index + 1);
    });
  });

  it('debe generar fechas de cuotas mensuales consecutivas', () => {
    const loanDate = new Date('2026-01-15');
    const result = calculateLoan({ principal: 500, interestRate: 0.15, numberOfInstallments: 3 }, loanDate);
    expect(result.installments[0].dueDate.getMonth()).toBe(1); // Feb
    expect(result.installments[1].dueDate.getMonth()).toBe(2); // Mar
    expect(result.installments[2].dueDate.getMonth()).toBe(3); // Apr
  });

  it('debe calcular totalAmount = installmentAmount * numberOfInstallments', () => {
    const result = calculateLoan({ principal: 600, interestRate: 0.15, numberOfInstallments: 3 }, new Date());
    expect(result.totalAmount).toBeCloseTo(result.installmentAmount * 3, 2);
  });

  it('debe calcular totalProfit = interestAmount * numberOfInstallments', () => {
    const result = calculateLoan({ principal: 600, interestRate: 0.15, numberOfInstallments: 3 }, new Date());
    expect(result.totalProfit).toBeCloseTo(result.interestAmount * 3, 2);
  });

  it('debe manejar decimales redondeados a 2 cifras', () => {
    // principal=700, tasa=15%, 3 cuotas
    // interestAmount = 700 * 0.15 = 105
    // principalPerInstallment = 700/3 = 233.33
    // installmentAmount = 233.33 + 105 = 338.33
    const result = calculateLoan({ principal: 700, interestRate: 0.15, numberOfInstallments: 3 }, new Date());
    expect(result.interestAmount).toBe(105);
    expect(result.installmentAmount).toBe(338.33);
  });
});
