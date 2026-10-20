import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const WHATSAPP_LOCATIONS: Record<string, string> = {
  kry: 'Kry Vårdcentral Älmhult Parking',
  grillen: 'Grillen Parking',
};

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th'}`;
}

/** Upcoming Friday (today if it is Friday) in Swedish time, as a plain y/m/d. */
function upcomingFridayStockholm(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  date.setUTCDate(date.getUTCDate() + ((5 - date.getUTCDay() + 7) % 7));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

export async function generateWhatsAppMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [dishes, settings] = await Promise.all([
      prisma.dish.findMany({
        where: { deletedAt: null, isAvailable: true, menuType: { in: ['FRIDAY', 'BOTH'] } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.setting.findMany(),
    ]);

    // Same dish order as the Friday menu image (the admin's order is sent from the browser)
    const order = String(req.query.order || '').split(',').filter(Boolean);
    const rank = (id: string) => { const i = order.indexOf(id); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
    dishes.sort((a, b) => rank(a.id) - rank(b.id));

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const rawNumber = settingsMap.WHATSAPP_NUMBER || '+46769677497';
    const phone = rawNumber.replace(/\s+/g, '').replace(/^\+46/, '0');

    // Delivery date/time from the page (YYYY-MM-DDTHH:mm), else upcoming Friday at 17:00
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(String(req.query.deliveryDateTime || ''));
    const fri = upcomingFridayStockholm();
    const y = match ? Number(match[1]) : fri.y;
    const m = match ? Number(match[2]) : fri.m;
    const d = match ? Number(match[3]) : fri.d;
    const time = match ? match[4] : '17:00';
    const day = new Date(Date.UTC(y, m - 1, d));
    const weekday = day.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
    const monthName = day.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
    const location = WHATSAPP_LOCATIONS[String(req.query.locationId)] || WHATSAPP_LOCATIONS.kry;

    const list = dishes
      .map((dish, i) => `${i + 1}. ${dish.name}${dish.pieces ? ` (${dish.pieces})` : ''} – ${Number(dish.price)} kr`)
      .join('\n');

    const message = `🌸🍽️ TASTY BITES – FRIDAY MENU 🍽️🌸
📅 ${weekday}, ${ordinal(d)} ${monthName}

Hello everyone! ❤️ Our delicious Friday menu is here! 😊

${list}

📲 Pre-order: ${phone}

📍 Pickup/Delivery: ${location}
🕔 ${weekday} at ${time}

❤️ Freshly prepared with love! Thank you for supporting Tasty Bites! 🙏😊`;

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
