import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export async function generateWhatsAppMessage(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [dishes, settings] = await Promise.all([
      prisma.dish.findMany({
        where: { deletedAt: null, isAvailable: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.setting.findMany(),
    ]);

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const whatsappNumber = settingsMap.WHATSAPP_NUMBER || '+46769677497';

    // Format date as e.g. "19May26"
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-GB', { month: 'short' });
    const year = now.getFullYear().toString().slice(2);
    const dateStr = `${day}${month}${year}`;

    // Group by category
    const grouped: Record<string, typeof dishes> = {};
    for (const dish of dishes) {
      const cat = dish.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(dish);
    }

    const divider = '━━━━━━━━━━━━━━━━━━━━';

    let body = '';
    for (const [category, catDishes] of Object.entries(grouped)) {
      body += `\n*${category.toUpperCase()}*\n${divider}\n\n`;
      for (const d of catDishes) {
        const price = Number(d.price);
        const piecesNote = d.pieces ? ` _(${d.pieces} pieces)_` : '';
        body += `*${d.name}*${piecesNote}\n`;
        body += `💰 *${price} kr*\n`;
        if (d.description) body += `_${d.description}_\n`;
        body += `\n📌 *Ingredients*\n`;
        body += `🇬🇧 ${d.ingredients}\n`;
        body += `🇸🇪 ${d.ingredientsSv}\n\n`;
      }
    }

    const message = `🍛 *TASTY BITES — FOOD MENU* 🍛
_Menu for ${dateStr}_
${divider}
${body}${divider}
📱 *For Pre-orders WhatsApp: ${whatsappNumber}*`;

    res.json({ success: true, data: { message, dishCount: dishes.length } });
  } catch (err) {
    next(err);
  }
}

export async function generateFridayMenuImage(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fridayDishes = await prisma.dish.findMany({
      where: {
        deletedAt: null,
        isAvailable: true,
        menuType: { in: ['FRIDAY', 'BOTH'] },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: {
        dishes: fridayDishes,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function purgeVercelCache(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Not named VERCEL_* because Vercel injects its own VERCEL_PROJECT_ID (the backend's) into every deployment.
    const token = process.env.PURGE_VERCEL_TOKEN;
    const projectId = process.env.PURGE_VERCEL_PROJECT_ID;
    if (!token || !projectId) {
      res.status(503).json({
        success: false,
        message: 'Cache purge is not configured. Add PURGE_VERCEL_TOKEN and PURGE_VERCEL_PROJECT_ID to the backend environment variables.',
      });
      return;
    }

    const params = new URLSearchParams({ projectIdOrName: projectId });
    if (process.env.PURGE_VERCEL_TEAM_ID) params.set('teamId', process.env.PURGE_VERCEL_TEAM_ID);

    // "*" purges every cache tag for the project (same as the Vercel dashboard's wildcard purge).
    const vercelRes = await fetch(`https://api.vercel.com/v1/edge-cache/invalidate-by-tags?${params}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['*'] }),
    });

    if (!vercelRes.ok) {
      const detail = await vercelRes.text().catch(() => '');
      res.status(502).json({
        success: false,
        message: `Vercel rejected the purge request (HTTP ${vercelRes.status}). ${detail.slice(0, 300)}`,
      });
      return;
    }

    res.json({ success: true, data: { purgedAt: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
}
