import { Router } from 'express';
import { ChatController } from '../controllers/chat';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const chatController = new ChatController();

// Rate limiting para chat
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo 10 mensagens por minuto
  message: { error: 'Muitas mensagens enviadas. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

router.post('/ask', chatLimiter, chatController.ask);
router.get('/suggestions', chatController.getSuggestions);

export default router;

