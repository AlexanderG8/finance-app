import { Router } from 'express';
import * as savingsController from '../controllers/savings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', savingsController.listSavingGoals);
router.post('/', savingsController.createSavingGoal);
router.get('/:id', savingsController.getSavingGoalById);
router.put('/:id', savingsController.updateSavingGoal);
router.post('/:id/contribute', savingsController.contribute);
router.get('/:id/projection', savingsController.getSavingGoalProjection);
router.delete('/:id', savingsController.deleteSavingGoal);

export default router;
