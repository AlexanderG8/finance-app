import { Router } from 'express';
import * as loansController from '../controllers/loans.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', loansController.listLoans);
router.post('/', loansController.createLoan);
router.get('/upcoming', loansController.getUpcomingInstallments);
router.get('/summary', loansController.getLoanSummary);
router.get('/:id', loansController.getLoanById);
router.put('/:id', loansController.updateLoan);
router.delete('/:id', loansController.deleteLoan);
router.get('/:id/installments', loansController.getLoanInstallments);
router.post('/:id/installments/:installmentId/pay', loansController.payInstallment);

export default router;
