import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { sendOrderConfirmationEmail } from '../services/emailService';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { customerName, mobileNumber, email, paymentMethod, items, notes } = req.body;

    // Verify dishes exist and get prices
    const dishIds = items.map((i: { dishId: string }) => i.dishId);
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds }, deletedAt: null, isAvailable: true },
    });

    if (dishes.length !== dishIds.length) {
      return next(new AppError('One or more dishes are unavailable', 400));
    }

    // Calculate total using actual prices
    const dishMap = new Map(dishes.map((d) => [d.id, d]));
    const orderItems = items.map((item: { dishId: string; quantity: number }) => {
      const dish = dishMap.get(item.dishId)!;
      return {
        dishId: item.dishId,
        quantity: item.quantity,
        price: Number(dish.price),
      };
    });

    const totalAmount = orderItems.reduce(
      (sum: number, item: { quantity: number; price: number }) => sum + item.price * item.quantity,
      0
    );

    // Get active pickup message
    const pickupMsg = await prisma.pickupMessage.findFirst({ where: { isActive: true } });

    // Check if same customer ordered today (merge orders)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingOrder = await prisma.order.findFirst({
      where: {
        mobileNumber,
        orderDate: { gte: today, lt: tomorrow },
        status: { in: ['PENDING', 'PREPARING'] },
      },
      include: { orderItems: true },
    });

    if (existingOrder) {
      // Merge orders - update quantities or add new items
      for (const newItem of orderItems) {
        const existingItem = existingOrder.orderItems.find((i) => i.dishId === newItem.dishId);
        if (existingItem) {
          await prisma.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + newItem.quantity },
          });
        } else {
          await prisma.orderItem.create({
            data: { orderId: existingOrder.id, ...newItem },
          });
        }
      }

      // Recalculate total
      const updatedItems = await prisma.orderItem.findMany({ where: { orderId: existingOrder.id } });
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );

      const updated = await prisma.order.update({
        where: { id: existingOrder.id },
        data: { totalAmount: newTotal, notes: notes || existingOrder.notes },
        include: { orderItems: { include: { dish: true } } },
      });

      res.json({
        success: true,
        data: updated,
        message: 'Your order has been updated with new items!',
        merged: true,
      });
      return;
    }

    // Create new order
    const order = await prisma.order.create({
      data: {
        customerName,
        mobileNumber,
        totalAmount,
        paymentMethod,
        pickupMessage: pickupMsg?.message || null,
        notes,
        orderItems: { create: orderItems },
      },
      include: { orderItems: { include: { dish: true } } },
    });

    // Send email notifications asynchronously (don't block response)
    sendOrderConfirmationEmail(order as unknown as Parameters<typeof sendOrderConfirmationEmail>[0], email || null).catch(() => {});

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully! 🎉',
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate, status, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) (where.orderDate as Record<string, unknown>).gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        (where.orderDate as Record<string, unknown>).lte = end;
      }
    }

    if (status) where.status = status;

    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { orderDate: 'desc' },
        include: { orderItems: { include: { dish: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: { include: { dish: true } } },
    });
    if (!order) return next(new AppError('Order not found', 404));
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { orderItems: { include: { dish: true } } },
    });

    res.json({ success: true, data: order, message: `Order status updated to ${status}` });
  } catch (err) {
    next(err);
  }
}

export async function getOrderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const [totalOrders, pendingOrders, completedOrders, todayOrders, weekOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.findMany({ where: { orderDate: { gte: today } } }),
      prisma.order.findMany({ where: { orderDate: { gte: weekStart } } }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalRevenue = (await prisma.order.findMany({ select: { totalAmount: true } }))
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    res.json({
      success: true,
      data: { totalOrders, totalRevenue, pendingOrders, completedOrders, todayRevenue, weekRevenue },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) (where.orderDate as Record<string, unknown>).gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        (where.orderDate as Record<string, unknown>).lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: { orderItems: { include: { dish: true } } },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tasty Bites';
    workbook.created = new Date();

    // Orders sheet
    const ordersSheet = workbook.addWorksheet('Orders', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ordersSheet.columns = [
      { header: 'Order ID', key: 'id', width: 38 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Mobile', key: 'mobileNumber', width: 20 },
      { header: 'Items', key: 'items', width: 50 },
      { header: 'Total (SEK)', key: 'total', width: 15 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    ordersSheet.getRow(1).font = { bold: true };
    ordersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8521A' },
    };
    ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    orders.forEach((order) => {
      const itemsStr = order.orderItems
        .map((i) => `${i.dish.name} x${i.quantity} (${Number(i.price) * i.quantity} SEK)`)
        .join(', ');

      ordersSheet.addRow({
        id: order.id,
        date: new Date(order.orderDate).toLocaleString('sv-SE'),
        customerName: order.customerName,
        mobileNumber: order.mobileNumber,
        items: itemsStr,
        total: Number(order.totalAmount),
        payment: order.paymentMethod,
        status: order.status,
      });
    });

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    summarySheet.addRow(['Total Orders', orders.length]);
    summarySheet.addRow(['Total Revenue (SEK)', totalRevenue]);
    summarySheet.addRow(['Swish Orders', orders.filter((o) => o.paymentMethod === 'SWISH').length]);
    summarySheet.addRow(['Cash Orders', orders.filter((o) => o.paymentMethod === 'CASH').length]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tastybites-orders-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}
