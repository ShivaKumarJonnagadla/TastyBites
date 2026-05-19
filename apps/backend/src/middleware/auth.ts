import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  adminId?: string;
  adminUsername?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      adminId: string;
      username: string;
    };
    req.adminId = payload.adminId;
    req.adminUsername = payload.username;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
