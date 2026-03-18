import { Request, Response, NextFunction } from 'express';
import * as incomeService from '../services/income.service';
import {
  createIncomeSchema,
  updateIncomeSchema,
  incomeQuerySchema,
} from '../schemas/income.schema';
import { z } from 'zod';

export async function listIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = incomeQuerySchema.parse(req.query);
    const result = await incomeService.listIncomes(req.user.id, query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createIncomeSchema.parse(req.body);
    const income = await incomeService.createIncome(req.user.id, validated);

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlySummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schema = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2000).max(2100),
    });
    const { month, year } = schema.parse(req.query);
    const summary = await incomeService.getMonthlyIncomeSummary(req.user.id, month, year);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getIncomeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const income = await incomeService.getIncomeById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
}

export async function updateIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateIncomeSchema.parse(req.body);
    const income = await incomeService.updateIncome(
      req.user.id,
      req.params['id'] as string,
      validated
    );

    res.status(200).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
}

export async function deleteIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await incomeService.deleteIncome(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
