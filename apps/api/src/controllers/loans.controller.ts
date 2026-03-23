import { Request, Response, NextFunction } from 'express';
import * as loansService from '../services/loans.service';
import {
  createLoanSchema,
  updateLoanSchema,
  payInstallmentSchema,
  loanQuerySchema,
} from '../schemas/loans.schema';
import { z } from 'zod';

export async function listLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = loanQuerySchema.parse(req.query);
    const result = await loansService.listLoans(req.user.id, query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createLoanSchema.parse(req.body);
    const loan = await loansService.createLoan(req.user.id, validated);

    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingInstallments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ days: z.coerce.number().int().min(1).max(30).default(7) });
    const { days } = schema.parse(req.query);
    const installments = await loansService.getUpcomingInstallments(req.user.id, days);

    res.status(200).json({ success: true, data: installments });
  } catch (error) {
    next(error);
  }
}

export async function getLoanSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await loansService.getLoanSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getLoanById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const loan = await loansService.getLoanById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
}

export async function updateLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateLoanSchema.parse(req.body);
    const loan = await loansService.updateLoan(req.user.id, req.params['id'] as string, validated);

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
}

export async function getLoanInstallments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const installments = await loansService.getLoanInstallments(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: installments });
  } catch (error) {
    next(error);
  }
}

export async function payInstallment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = payInstallmentSchema.parse(req.body);
    const payment = await loansService.payInstallment(
      req.user.id,
      req.params['id'] as string,
      req.params['installmentId'] as string,
      validated
    );

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await loansService.deleteLoan(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
