import { z } from 'zod';

export const dishSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  ingredients: z.string().min(3).max(1000),
  ingredientsSv: z.string().min(3).max(1000),
  pieces: z.number().int().positive().nullable().optional(),
  price: z.number().positive().max(10000),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
  menuType: z.enum(['DAILY', 'FRIDAY', 'BOTH']).default('DAILY'),
  isVegetarian: z.boolean().default(false),
  spiceLevel: z.enum(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']).default('MEDIUM'),
  category: z.string().min(2).max(50),
});

export const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  mobileNumber: z.string().min(8).max(20).regex(/^[+\d\s-]+$/),
  paymentMethod: z.enum(['SWISH', 'CASH']),
  items: z.array(
    z.object({
      dishId: z.string().uuid(),
      quantity: z.number().int().min(1).max(20),
      price: z.number().positive(),
    })
  ).min(1),
  notes: z.string().max(500).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

export const pickupMessageSchema = z.object({
  message: z.string().min(10).max(1000),
  messageSv: z.string().min(10).max(1000),
  isActive: z.boolean().default(true),
});

export type DishInput = z.infer<typeof dishSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type PickupMessageInput = z.infer<typeof pickupMessageSchema>;
