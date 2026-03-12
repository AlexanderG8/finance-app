import { calculateLoan } from '../lib/loan-calculator';

describe('calculateLoan', () => {
  // ─── Tests obligatorios del CLAUDE.md ────────────────────────────────────

  it('debe aplicar 15% para préstamos menores a S/1,000', () => {
    const result = calculateLoan({ principal: 800, numberOfInstallments: 4 }, new Date());
    expect(result.interestRate).toBe(0.15);
    expect(result.totalAmount).toBe(920);
    expect(result.installmentAmount).toBe(230);
  });

  it('debe aplicar 20% para préstamos de S/1,000 o más', () => {
    const result = calculateLoan({ principal: 1000, numberOfInstallments: 5 }, new Date());
    expect(result.interestRate).toBe(0.20);
    expect(result.totalAmount).toBe(1200);
    expect(result.installmentAmount).toBe(240);
  });

  // ─── Tests adicionales ────────────────────────────────────────────────────

  it('debe aplicar 15% cuando el principal es exactamente 999', () => {
    const result = calculateLoan({ principal: 999, numberOfInstallments: 3 }, new Date());
    expect(result.interestRate).toBe(0.15);
    expect(result.interestAmount).toBe(999 * 0.15);
    expect(result.totalAmount).toBe(999 + 999 * 0.15);
  });

  it('debe aplicar 20% cuando el principal es exactamente 1000', () => {
    const result = calculateLoan({ principal: 1000, numberOfInstallments: 4 }, new Date());
    expect(result.interestRate).toBe(0.20);
    expect(result.interestAmount).toBe(1000 * 0.20);
    expect(result.totalAmount).toBe(1200);
  });

  it('debe generar el número correcto de cuotas', () => {
    const result = calculateLoan({ principal: 500, numberOfInstallments: 6 }, new Date());
    expect(result.installments).toHaveLength(6);
  });

  it('debe calcular correctamente interestAmount = principal * interestRate (15%)', () => {
    const principal = 600;
    const result = calculateLoan({ principal, numberOfInstallments: 2 }, new Date());
    expect(result.interestAmount).toBeCloseTo(principal * 0.15, 10);
  });

  it('debe calcular correctamente interestAmount = principal * interestRate (20%)', () => {
    const principal = 2000;
    const result = calculateLoan({ principal, numberOfInstallments: 4 }, new Date());
    expect(result.interestAmount).toBeCloseTo(principal * 0.20, 10);
  });

  it('debe calcular correctamente totalAmount = principal + interestAmount (15%)', () => {
    const principal = 800;
    const result = calculateLoan({ principal, numberOfInstallments: 4 }, new Date());
    expect(result.totalAmount).toBeCloseTo(result.principal + result.interestAmount, 10);
  });

  it('debe calcular correctamente totalAmount = principal + interestAmount (20%)', () => {
    const principal = 1500;
    const result = calculateLoan({ principal, numberOfInstallments: 3 }, new Date());
    expect(result.totalAmount).toBeCloseTo(result.principal + result.interestAmount, 10);
  });

  it('debe generar fechas de cuotas mensuales consecutivas', () => {
    const loanDate = new Date('2026-01-15');
    const result = calculateLoan({ principal: 500, numberOfInstallments: 3 }, loanDate);

    expect(result.installments[0].dueDate.getMonth()).toBe(1); // Feb
    expect(result.installments[1].dueDate.getMonth()).toBe(2); // Mar
    expect(result.installments[2].dueDate.getMonth()).toBe(3); // Apr
  });

  it('debe numerar las cuotas desde 1 consecutivamente', () => {
    const result = calculateLoan({ principal: 800, numberOfInstallments: 4 }, new Date());
    result.installments.forEach((installment, index) => {
      expect(installment.number).toBe(index + 1);
    });
  });

  it('debe manejar cuota con decimal: principal=500, cuotas=3 → installmentAmount=191.67', () => {
    const result = calculateLoan({ principal: 500, numberOfInstallments: 3 }, new Date());
    // totalAmount = 500 + (500 * 0.15) = 500 + 75 = 575
    expect(result.totalAmount).toBe(575);
    // installmentAmount = Math.round((575 / 3) * 100) / 100 = Math.round(19166.67) / 100 = 191.67
    expect(result.installmentAmount).toBe(191.67);
  });

  it('debe preservar el principal en el resultado', () => {
    const principal = 1200;
    const result = calculateLoan({ principal, numberOfInstallments: 4 }, new Date());
    expect(result.principal).toBe(principal);
  });

  it('debe asignar el monto de cuota correcto a cada elemento del schedule', () => {
    const result = calculateLoan({ principal: 800, numberOfInstallments: 4 }, new Date());
    result.installments.forEach((installment) => {
      expect(installment.amount).toBe(result.installmentAmount);
    });
  });
});
