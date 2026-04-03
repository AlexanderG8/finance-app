import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post('/monthly-summary', aiController.monthlySummary);
router.post('/budget-recommendations', aiController.budgetRecommendations);
router.post('/debt-strategy', aiController.debtStrategy);
router.post('/savings-advice', aiController.savingsAdvice);
router.post('/anomalies', aiController.detectAnomalies);

export default router;
