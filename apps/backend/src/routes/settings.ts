import { Router } from 'express';
import { getSettings, updateSetting, getPickupMessages, createPickupMessage, updatePickupMessage } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public
router.get('/', getSettings);
router.get('/pickup-messages', getPickupMessages);

// Protected
router.put('/:key', authenticate, updateSetting);
router.post('/pickup-messages', authenticate, createPickupMessage);
router.put('/pickup-messages/:id', authenticate, updatePickupMessage);

export default router;
