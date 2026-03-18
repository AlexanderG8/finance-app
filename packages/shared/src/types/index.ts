export * from './auth.types';
export * from './expense.types';
export * from './loan.types';
export * from './debt.types';
export * from './savings.types';
export * from './income.types';

// Common API response types
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiSuccessPaginated<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type ApiResponsePaginated<T> = ApiSuccessPaginated<T> | ApiError;
