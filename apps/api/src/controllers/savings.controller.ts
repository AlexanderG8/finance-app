import { Request, Response, NextFunction } from 'express';
import * as savingsService from '../services/savings.service';
import {
  createSavingGoalSchema,
  updateSavingGoalSchema,
  contributeSchema,
} from '../schemas/savings.schema';

export async function listSavingGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goals = await savingsService.listSavingGoals(req.user.id);
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
}

export async function createSavingGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createSavingGoalSchema.parse(req.body);
    const goal = await savingsService.createSavingGoal(req.user.id, validated);

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
}

export async function getSavingGoalById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await savingsService.getSavingGoalById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
}

export async function updateSavingGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateSavingGoalSchema.parse(req.body);
    const goal = await savingsService.updateSavingGoal(req.user.id, req.params['id'] as string, validated);

    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
}

export async function contribute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = contributeSchema.parse(req.body);
    const contribution = await savingsService.contribute(req.user.id, req.params['id'] as string, validated);

    res.status(201).json({ success: true, data: contribution });
  } catch (error) {
    next(error);
  }
}

export async function getSavingGoalProjection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projection = await savingsService.getSavingGoalProjection(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: projection });
  } catch (error) {
    next(error);
  }
}

export async function deleteSavingGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await savingsService.deleteSavingGoal(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
