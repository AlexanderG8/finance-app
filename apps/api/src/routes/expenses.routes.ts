import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Expenses
router.get('/', expensesController.listExpenses);
router.post('/', expensesController.createExpense);
router.get('/summary/monthly', expensesController.getMonthlySummary);
router.get('/:id', expensesController.getExpenseById);
router.put('/:id', expensesController.updateExpense);
router.delete('/:id', expensesController.deleteExpense);

export default router;
