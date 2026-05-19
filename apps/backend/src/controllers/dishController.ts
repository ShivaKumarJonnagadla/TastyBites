import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getDishes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      search,
      menuType,
      isVegetarian,
      spiceLevel,
      category,
      isAvailable,
      page = '1',
      limit = '50',
    } = req.query;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { ingredients: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (menuType) where.menuType = { in: [menuType, 'BOTH'] };
    if (isVegetarian !== undefined) where.isVegetarian = isVegetarian === 'true';
    if (spiceLevel) where.spiceLevel = spiceLevel;
    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const skip = (pageNum - 1) * limitNum;

    const [dishes, total] = await Promise.all([
      prisma.dish.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ menuType: 'asc' }, { category: 'asc' }, { name: 'asc' }],
      }),
      prisma.dish.count({ where }),
    ]);

    res.json({
      success: true,
      data: dishes,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dish = await prisma.dish.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!dish) return next(new AppError('Dish not found', 404));
    res.json({ success: true, data: dish });
  } catch (err) {
    next(err);
  }
}

export async function createDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dish = await prisma.dish.create({ data: req.body });
    res.status(201).json({ success: true, data: dish, message: 'Dish created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.dish.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) return next(new AppError('Dish not found', 404));

    const dish = await prisma.dish.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: dish, message: 'Dish updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteDish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.dish.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) return next(new AppError('Dish not found', 404));

    await prisma.dish.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true, message: 'Dish deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function toggleAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dish = await prisma.dish.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!dish) return next(new AppError('Dish not found', 404));

    const updated = await prisma.dish.update({
      where: { id: req.params.id },
      data: { isAvailable: !dish.isAvailable },
    });
    res.json({
      success: true,
      data: updated,
      message: `Dish is now ${updated.isAvailable ? 'available' : 'unavailable'}`,
    });
  } catch (err) {
    next(err);
  }
}
