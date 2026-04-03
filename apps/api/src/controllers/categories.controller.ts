import { Request, Response, NextFunction } from 'express';
import * as categoriesService from '../services/categories.service';
import { createCategorySchema, updateCategorySchema } from '../schemas/categories.schema';

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoriesService.listCategories(req.user.id);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createCategorySchema.parse(req.body);
    const category = await categoriesService.createUserCategory(req.user.id, validated);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateCategorySchema.parse(req.body);
    const category = await categoriesService.updateUserCategory(
      req.user.id,
      req.params['id'] as string,
      validated
    );
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await categoriesService.deleteUserCategory(req.user.id, req.params['id'] as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
