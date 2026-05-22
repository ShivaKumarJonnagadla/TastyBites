import { Router } from 'express';
import {
  createOrder,
  createManualOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  exportOrders,
  getOrderStats,
  archiveFridayOrders,
  archiveSelectedOrders,
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
      spiceLevel: z.enum(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']).optional(),
    })
  ).min(1),
  notes: z.string().max(500).optional().or(z.literal('')),
});

const manualOrderSchema = z.object({
  customerName: z.string().min(2).max(100),
  mobileNumber: z.string().min(8).max(20).regex(/^[+\d\s-]+$/),
  paymentMethod: z.enum(['SWISH', 'CASH']),
  items: z.array(
    z.object({
      dishId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).max(50),
    })
  ).min(1),
  deliveryNote: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// Public routes
router.post('/', validate(orderSchema), createOrder);

// Protected admin routes
router.get('/', authenticate, getOrders);
router.get('/stats', authenticate, getOrderStats);
router.get('/export', authenticate, exportOrders);
router.post('/manual', authenticate, validate(manualOrderSchema), createManualOrder);
router.post('/archive-friday', authenticate, archiveFridayOrders);
router.post('/archive-selected', authenticate, archiveSelectedOrders);
router.get('/:id', authenticate, getOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);

export default router;
