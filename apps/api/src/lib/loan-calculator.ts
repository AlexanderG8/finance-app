interface LoanCalculationInput {
  principal: number;
  numberOfInstallments: number;
}

interface InstallmentSchedule {
  number: number;
  amount: number;
  dueDate: Date;
}

interface LoanCalculationResult {
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;
  installmentAmount: number;
  installments: InstallmentSchedule[];
}

export function calculateLoan(
  input: LoanCalculationInput,
  loanDate: Date
): LoanCalculationResult {
  const { principal, numberOfInstallments } = input;

  // REGLA DE NEGOCIO: Tasa según monto
  // < 1000 soles → 15% | >= 1000 soles → 20%
  const interestRate = principal < 1000 ? 0.15 : 0.20;

  const interestAmount = principal * interestRate;
  const totalAmount = principal + interestAmount;

  // Redondear a 2 decimales para evitar errores de punto flotante
  const installmentAmount = Math.round((totalAmount / numberOfInstallments) * 100) / 100;

  // Generar schedule de cuotas (mensual por defecto)
  const installments: InstallmentSchedule[] = Array.from(
    { length: numberOfInstallments },
    (_, index) => {
      const dueDate = new Date(loanDate);
      dueDate.setMonth(dueDate.getMonth() + index + 1);
      return {
        number: index + 1,
        amount: installmentAmount,
        dueDate,
      };
    }
  );

  return {
    principal,
    interestRate,
    interestAmount,
    totalAmount,
    installmentAmount,
    installments,
  };
}
