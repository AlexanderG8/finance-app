import { Request, Response, NextFunction } from 'express';
import * as creditCardsService from '../services/credit-cards.service';
import { createCreditCardSchema, updateCreditCardSchema } from '../schemas/credit-cards.schema';

export async function listCreditCards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cards = await creditCardsService.listCreditCards(req.user.id);
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
}

export async function createCreditCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createCreditCardSchema.parse(req.body);
    const card = await creditCardsService.createCreditCard(req.user.id, validated);
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
}

export async function getCreditCardById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await creditCardsService.getCreditCardById(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentCycleSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await creditCardsService.getCurrentCycleSummary(req.user.id, req.params['id'] as string);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function updateCreditCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateCreditCardSchema.parse(req.body);
    const card = await creditCardsService.updateCreditCard(req.user.id, req.params['id'] as string, validated);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
}

export async function deleteCreditCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await creditCardsService.deleteCreditCard(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
