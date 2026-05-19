import { Router } from 'express';
import {
  getDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
  toggleAvailability,
} from '../controllers/dishController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const dishSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  ingredients: z.string().min(3).max(1000),
  ingredientsSv: z.string().min(3).max(1000),
  pieces: z.number().int().positive().nullable().optional(),
  price: z.number().positive(),
  imageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean().default(true),
  menuType: z.enum(['DAILY', 'FRIDAY', 'BOTH']).default('DAILY'),
  isVegetarian: z.boolean().default(false),
  spiceLevel: z.enum(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']).default('MEDIUM'),
  category: z.string().min(2).max(50),
});

// Public routes
router.get('/', getDishes);
router.get('/:id', getDish);

// Protected admin routes
router.post('/', authenticate, validate(dishSchema), createDish);
router.put('/:id', authenticate, validate(dishSchema.partial()), updateDish);
router.delete('/:id', authenticate, deleteDish);
router.patch('/:id/availability', authenticate, toggleAvailability);

export default router;
