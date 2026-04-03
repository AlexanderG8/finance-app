import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as categoriesController from '../controllers/categories.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', categoriesController.listCategories);
router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

export default router;
