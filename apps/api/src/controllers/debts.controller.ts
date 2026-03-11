import { Request, Response, NextFunction } from 'express';
import * as debtsService from '../services/debts.service';
import {
  createDebtSchema,
  updateDebtSchema,
  payDebtSchema,
  debtQuerySchema,
} from '../schemas/debts.schema';

export async function listDebts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = debtQuerySchema.parse(req.query);
    const result = await debtsService.listDebts(req.user.id, query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDebt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createDebtSchema.parse(req.body);
    const debt = await debtsService.createDebt(req.user.id, validated);

    res.status(201).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
}

export async function getDebtById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const debt = await debtsService.getDebtById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
}

export async function updateDebt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateDebtSchema.parse(req.body);
    const debt = await debtsService.updateDebt(req.user.id, req.params['id'] as string, validated);

    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
}

export async function payDebt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = payDebtSchema.parse(req.body);
    const payment = await debtsService.payDebt(req.user.id, req.params['id'] as string, validated);

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function deleteDebt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await debtsService.deleteDebt(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
