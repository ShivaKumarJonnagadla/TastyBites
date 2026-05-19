import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json({ success: true, data: settingsMap });
  } catch (err) {
    next(err);
  }
}

export async function updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: req.body.value },
      create: { key: req.params.key, value: req.body.value },
    });
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
}

export async function getPickupMessages(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await prisma.pickupMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
}

export async function createPickupMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const msg = await prisma.pickupMessage.create({ data: req.body });
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
}

export async function updatePickupMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.pickupMessage.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new AppError('Pickup message not found', 404));

    const msg = await prisma.pickupMessage.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
}
