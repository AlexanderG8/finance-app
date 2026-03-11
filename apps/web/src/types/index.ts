export type { User, AuthTokens, LoginResponse } from '@finance-app/shared';
export type { Expense, ExpenseCategory, Budget, MonthlySummary, BudgetComparison } from '@finance-app/shared';
export type { Loan, LoanInstallment, LoanPayment, LoanSummary } from '@finance-app/shared';
export type { PersonalDebt, DebtPayment } from '@finance-app/shared';
export type { SavingGoal, SavingContribution, SavingGoalProjection } from '@finance-app/shared';
export type { ApiResponse, ApiResponsePaginated, ApiSuccess, ApiError } from '@finance-app/shared';
export type { Currency, PaymentMethod } from '@finance-app/shared';

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
}
