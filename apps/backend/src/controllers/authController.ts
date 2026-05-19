import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminId },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!admin) return next(new AppError('Admin not found', 404));
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId } });
    if (!admin) return next(new AppError('Admin not found', 404));

    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) return next(new AppError('Current password is incorrect', 400));

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({ where: { id: req.adminId }, data: { password: hashed } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}
