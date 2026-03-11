import { Router } from 'express';
import * as debtsController from '../controllers/debts.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', debtsController.listDebts);
router.post('/', debtsController.createDebt);
router.get('/:id', debtsController.getDebtById);
router.put('/:id', debtsController.updateDebt);
router.post('/:id/pay', debtsController.payDebt);
router.delete('/:id', debtsController.deleteDebt);

export default router;
