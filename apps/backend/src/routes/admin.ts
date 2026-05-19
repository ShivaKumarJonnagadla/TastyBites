import { Router } from 'express';
import { generateWhatsAppMessage, generateFridayMenuImage } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { sendTestEmail } from '../services/emailService';

const router = Router();

router.get('/whatsapp-message', authenticate, generateWhatsAppMessage);
router.get('/friday-menu-image', authenticate, generateFridayMenuImage);

router.post('/test-email', authenticate, async (_req, res) => {
  const result = await sendTestEmail();
  res.json({ success: result.success, data: result });
});

export default router;
