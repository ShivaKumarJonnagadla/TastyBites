import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  exportOrders,
  getOrderStats,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  mobileNumber: z.string().min(8).max(20).regex(/^[+\d\s-]+$/),
  email: z.string().email().optional().or(z.literal('')).or(z.undefined()),
  paymentMethod: z.enum(['SWISH', 'CASH']),
  items: z.array(
    z.object({
      dishId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).max(20),
      price: z.coerce.number().positive(),
    })
  ).min(1),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// Public routes
router.post('/', validate(orderSchema), createOrder);

// Protected admin routes
router.get('/', authenticate, getOrders);
router.get('/stats', authenticate, getOrderStats);
router.get('/export', authenticate, exportOrders);
router.get('/:id', authenticate, getOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);

export default router;
