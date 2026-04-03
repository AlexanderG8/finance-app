import { Router } from 'express';
import * as creditCardsController from '../controllers/credit-cards.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', creditCardsController.listCreditCards);
router.post('/', creditCardsController.createCreditCard);
router.get('/:id', creditCardsController.getCreditCardById);
router.get('/:id/cycle', creditCardsController.getCurrentCycleSummary);
router.put('/:id', creditCardsController.updateCreditCard);
router.delete('/:id', creditCardsController.deleteCreditCard);

export default router;
