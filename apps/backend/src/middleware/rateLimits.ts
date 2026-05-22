import rateLimit from 'express-rate-limit';

// Applied only to public order creation (POST /api/orders)
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, error: 'Too many orders placed, please try again later.' },
});
