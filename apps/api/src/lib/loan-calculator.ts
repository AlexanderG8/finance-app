interface LoanCalculationInput {
  principal: number;
  interestRate: number;        // decimal: 0.15 for 15%
  numberOfInstallments: number;
}

interface InstallmentSchedule {
  number: number;
  amount: number;
  dueDate: Date;
}

interface LoanCalculationResult {
  principal: number;
  interestRate: number;        // decimal: 0.15 for 15%
  interestAmount: number;      // interés fijo por cuota (principal * interestRate)
  totalAmount: number;         // installmentAmount * numberOfInstallments
  installmentAmount: number;   // (principal / numberOfInstallments) + interestAmount
  totalProfit: number;         // interestAmount * numberOfInstallments (ganancia total)
  installments: InstallmentSchedule[];
}

export function calculateLoan(
  input: LoanCalculationInput,
  loanDate: Date
): LoanCalculationResult {
  const { principal, interestRate, numberOfInstallments } = input;

  // Interés total que se cobra en CADA cuota (no se divide entre cuotas)
  const interestAmount = Math.round(principal * interestRate * 100) / 100;

  // Capital por cuota
  const principalPerInstallment = Math.round((principal / numberOfInstallments) * 100) / 100;

  // Cuota = capital/n + interés total
  const installmentAmount = Math.round((principalPerInstallment + interestAmount) * 100) / 100;

  // Total a cobrar = cuota × n
  const totalAmount = Math.round(installmentAmount * numberOfInstallments * 100) / 100;

  // Ganancia total = interés cobrado en todas las cuotas
  const totalProfit = Math.round(interestAmount * numberOfInstallments * 100) / 100;

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
    totalProfit,
    installments,
  };
}
