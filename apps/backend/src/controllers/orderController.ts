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
    const orderItems = items.map((item: { dishId: string; quantity: number; spiceLevel?: string }) => {
      const dish = dishMap.get(item.dishId)!;
      return {
        dishId: item.dishId,
        quantity: item.quantity,
        price: Number(dish.price),
        ...(item.spiceLevel ? { spiceLevel: item.spiceLevel } : {}),
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
      // Merge orders - update quantities or add new items (match by dishId + spiceLevel)
      for (const newItem of orderItems) {
        const existingItem = existingOrder.orderItems.find(
          (i) => i.dishId === newItem.dishId && (i.spiceLevel ?? null) === (newItem.spiceLevel ?? null)
        );
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

      // Build dish summary across all active orders (same as new-order path)
      const allActiveOrdersMerged = await prisma.order.findMany({
        where: { archivedAt: null },
        include: { orderItems: { include: { dish: { select: { name: true } } } } },
      });
      const mergedDishTotals = new Map<string, number>();
      for (const o of allActiveOrdersMerged) {
        for (const item of o.orderItems) {
          const name = item.dish.name;
          mergedDishTotals.set(name, (mergedDishTotals.get(name) ?? 0) + item.quantity);
        }
      }
      const mergedDishSummary = Array.from(mergedDishTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, totalQty]) => ({ name, totalQty }));

      // Send confirmation email for merged orders too
      sendOrderConfirmationEmail(
        updated as unknown as Parameters<typeof sendOrderConfirmationEmail>[0],
        email || null,
        mergedDishSummary,
      ).catch(() => {});

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

    // Build consolidated dish summary for the notification email
    const allActiveOrders = await prisma.order.findMany({
      where: { archivedAt: null },
      include: { orderItems: { include: { dish: { select: { name: true } } } } },
    });
    const dishTotals = new Map<string, number>();
    for (const o of allActiveOrders) {
      for (const item of o.orderItems) {
        const name = item.dish.name;
        dishTotals.set(name, (dishTotals.get(name) ?? 0) + item.quantity);
      }
    }
    const dishSummary = Array.from(dishTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, totalQty]) => ({ name, totalQty }));

    // Send email notifications asynchronously (don't block response)
    sendOrderConfirmationEmail(
      order as unknown as Parameters<typeof sendOrderConfirmationEmail>[0],
      email || null,
      dishSummary,
    ).catch(() => {});

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
    const { startDate, endDate, status, archived, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    // archived=true → show only archived; default → show only non-archived
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

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

    // Build dish+spiceLevel grouped summary for kitchen view
    const dishSpiceMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.orderItems) {
        const key = item.spiceLevel
          ? `${item.dish.name} (${item.spiceLevel})`
          : item.dish.name;
        dishSpiceMap.set(key, (dishSpiceMap.get(key) ?? 0) + item.quantity);
      }
    }
    const dishSpiceSummary = Array.from(dishSpiceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, totalQty]) => ({ label, totalQty }));

    res.json({
      success: true,
      data: orders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      dishSpiceSummary,
    });
  } catch (err) {
    next(err);
  }
}

export async function createManualOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { customerName, mobileNumber, paymentMethod, items, deliveryNote, notes } = req.body;

    const dishIds = items.map((i: { dishId: string }) => i.dishId);
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds }, deletedAt: null },
    });

    if (dishes.length !== dishIds.length) {
      return next(new AppError('One or more dishes not found', 400));
    }

    const dishMap = new Map(dishes.map((d) => [d.id, d]));
    const orderItems = items.map((item: { dishId: string; quantity: number }) => {
      const dish = dishMap.get(item.dishId)!;
      return { dishId: item.dishId, quantity: item.quantity, price: Number(dish.price) };
    });

    const totalAmount = orderItems.reduce(
      (sum: number, item: { quantity: number; price: number }) => sum + item.price * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        customerName,
        mobileNumber,
        totalAmount,
        paymentMethod,
        source: 'WHATSAPP',
        deliveryNote: deliveryNote || null,
        notes: notes || null,
        orderItems: { create: orderItems },
      },
      include: { orderItems: { include: { dish: true } } },
    });

    res.status(201).json({ success: true, data: order, message: 'WhatsApp order added successfully' });
  } catch (err) {
    next(err);
  }
}

export async function archiveFridayOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Find all non-archived orders that contain at least one FRIDAY or BOTH dish
    const activeOrders = await prisma.order.findMany({
      where: { archivedAt: null },
      include: { orderItems: { include: { dish: { select: { menuType: true } } } } },
    });

    const fridayOrderIds = activeOrders
      .filter((o) => o.orderItems.some((i) => i.dish.menuType === 'FRIDAY' || i.dish.menuType === 'BOTH'))
      .map((o) => o.id);

    if (fridayOrderIds.length === 0) {
      res.json({ success: true, archived: 0, message: 'No active Friday orders to archive' });
      return;
    }

    await prisma.order.updateMany({
      where: { id: { in: fridayOrderIds } },
      data: { archivedAt: new Date() },
    });

    res.json({ success: true, archived: fridayOrderIds.length, message: `${fridayOrderIds.length} Friday orders archived` });
  } catch (err) {
    next(err);
  }
}

export async function archiveSelectedOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'No order IDs provided' });
      return;
    }
    await prisma.order.updateMany({
      where: { id: { in: ids }, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    res.json({ success: true, archived: ids.length, message: `${ids.length} order(s) archived` });
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

    // ── Tab 1: Customer Orders (one row per order-item) ──────────────────────
    const ordersSheet = workbook.addWorksheet('Customer Orders', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ordersSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Mobile', key: 'mobileNumber', width: 20 },
      { header: 'Dish', key: 'dish', width: 35 },
      { header: 'Qty', key: 'qty', width: 8 },
      { header: 'Unit Price (SEK)', key: 'unitPrice', width: 18 },
      { header: 'Line Total (SEK)', key: 'lineTotal', width: 18 },
      { header: 'Order Total (SEK)', key: 'orderTotal', width: 18 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Source', key: 'source', width: 12 },
    ];

    const headerRow1 = ordersSheet.getRow(1);
    headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2185B' } };

    orders.forEach((order) => {
      order.orderItems.forEach((item, idx) => {
        ordersSheet.addRow({
          date: idx === 0 ? new Date(order.orderDate).toLocaleString('sv-SE') : '',
          customerName: idx === 0 ? order.customerName : '',
          mobileNumber: idx === 0 ? order.mobileNumber : '',
          dish: item.dish.name,
          qty: item.quantity,
          unitPrice: Number(item.price),
          lineTotal: Number(item.price) * item.quantity,
          orderTotal: idx === 0 ? Number(order.totalAmount) : '',
          payment: idx === 0 ? order.paymentMethod : '',
          status: idx === 0 ? order.status : '',
          source: idx === 0 ? (order.source ?? 'WEBSITE') : '',
        });
      });
    });

    // ── Tab 2: Dish Preparation Summary ──────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Dish Preparation Summary', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    summarySheet.columns = [
      { header: 'Dish Name', key: 'dish', width: 40 },
      { header: 'Total Qty Ordered', key: 'totalQty', width: 20 },
      { header: 'Total Revenue (SEK)', key: 'totalRevenue', width: 22 },
    ];

    const headerRow2 = summarySheet.getRow(1);
    headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2185B' } };

    const dishMap = new Map<string, { totalQty: number; totalRevenue: number }>();
    for (const order of orders) {
      for (const item of order.orderItems) {
        const existing = dishMap.get(item.dish.name) ?? { totalQty: 0, totalRevenue: 0 };
        dishMap.set(item.dish.name, {
          totalQty: existing.totalQty + item.quantity,
          totalRevenue: existing.totalRevenue + Number(item.price) * item.quantity,
        });
      }
    }

    Array.from(dishMap.entries())
      .sort((a, b) => b[1].totalQty - a[1].totalQty)
      .forEach(([dish, stats]) => {
        summarySheet.addRow({ dish, totalQty: stats.totalQty, totalRevenue: stats.totalRevenue });
      });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tastybites-orders-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}
