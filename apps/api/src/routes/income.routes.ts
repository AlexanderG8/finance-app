import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as incomeController from '../controllers/income.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', incomeController.listIncomes);
router.post('/', incomeController.createIncome);
router.get('/summary/monthly', incomeController.getMonthlySummary);
router.get('/:id', incomeController.getIncomeById);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

export default router;
