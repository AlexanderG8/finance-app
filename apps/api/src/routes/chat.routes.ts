import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/history', chatController.getHistory);
router.post('/messages', chatController.saveMessages);
router.delete('/history', chatController.clearHistory);

export default router;
