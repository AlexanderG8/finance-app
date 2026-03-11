import { Request, Response, NextFunction } from 'express';
import * as expensesService from '../services/expenses.service';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  createBudgetSchema,
} from '../schemas/expenses.schema';
import { z } from 'zod';

export async function listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = expenseQuerySchema.parse(req.query);
    const result = await expensesService.listExpenses(req.user.id, query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createExpenseSchema.parse(req.body);
    const expense = await expensesService.createExpense(req.user.id, validated);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2000).max(2100),
    });
    const { month, year } = schema.parse(req.query);
    const summary = await expensesService.getMonthlySummary(req.user.id, month, year);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expensesService.getExpenseById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateExpenseSchema.parse(req.body);
    const expense = await expensesService.updateExpense(req.user.id, req.params['id'] as string, validated);

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expensesService.deleteExpense(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await expensesService.listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function listBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2000).max(2100),
    });
    const { month, year } = schema.parse(req.query);
    const budgets = await expensesService.listBudgets(req.user.id, month, year);

    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
}

export async function upsertBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createBudgetSchema.parse(req.body);
    const budget = await expensesService.upsertBudget(req.user.id, validated);

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
}

export async function getBudgetComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2000).max(2100),
    });
    const { month, year } = schema.parse(req.query);
    const comparison = await expensesService.getBudgetComparison(req.user.id, month, year);

    res.status(200).json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
}

export async function deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expensesService.deleteBudget(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
