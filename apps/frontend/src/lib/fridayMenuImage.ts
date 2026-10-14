import html2canvas from 'html2canvas';

export interface FridayDish {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  ingredientsSv: string;
  price: number | string;
  imageUrl: string | null;
  spiceLevel: string;
  isVegetarian: boolean;
  category?: string;
}

export const DELIVERY_LOCATIONS = [
  { id: 'kry', name: 'Kry Vårdcentral Älmhult Parkering', address: 'Gotthards gata 5, 343 36 Älmhult' },
  { id: 'grillen', name: 'Grillen Parkering', address: 'Ikeagatan 2, 343 36 Älmhult' },
];

export const FRIDAY_ORDER_STORAGE_KEY = 'tb_fridayDishOrder';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop';
const SITE = 'tastybites-almhult.vercel.app';
const PHONE = '+46 769677497';

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Today if it is Friday (the day isn't over yet), otherwise the coming Friday. */
export function upcomingFriday(from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  return d;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Value for an <input type="datetime-local"> — upcoming Friday at 17:00. */
export function upcomingFridayDatetimeLocal(): string {
  const d = upcomingFriday();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`;
}

/** "Friday, 9 October 2026" */
export function formatFridayDate(d: Date): string {
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday}, ${rest}`;
}

/** "Friday, 9 October 2026 · 17:00" */
export function formatDeliveryTime(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  const d = new Date(datetimeLocal);
  return `${formatFridayDate(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Apply the admin's saved Friday ordering (set on the Dishes page); unknown dishes go last. */
export function applySavedFridayOrder<T extends { id: string }>(dishes: T[]): T[] {
  let order: string[] = [];
  try { order = JSON.parse(localStorage.getItem(FRIDAY_ORDER_STORAGE_KEY) || '[]'); } catch { /* ignore */ }
  const rank = (id: string) => { const i = order.indexOf(id); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
  return [...dishes].sort((a, b) => rank(a.id) - rank(b.id));
}

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function toDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const FLAG_GB = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="60" height="40"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="13"/><path d="M30 0V40M0 20H60" stroke="#C8102E" stroke-width="8"/></svg>');
const FLAG_SE = svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" width="16" height="10"><rect width="16" height="10" fill="#006AA7"/><rect x="5" width="2" height="10" fill="#FECC00"/><rect y="4" width="16" height="2" fill="#FECC00"/></svg>');

const spiceLabel = (level: string) => {
  if (level === 'MILD') return '🟢 Mild';
  if (level === 'MEDIUM') return '🌶️ Medium';
  if (level === 'HOT') return '🌶️🌶️ Hot';
  return '🌶️🌶️🌶️ Extra Hot';
};

const MENU_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;}
.menu-root{font-family:'Inter',sans-serif;color:#1a1a1a;background:#fff;}
.header{background:linear-gradient(135deg,#C2185B 0%,#880E4F 100%);color:#fff;padding:18px 36px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.header-left{display:flex;align-items:center;gap:14px;}
.logo-wrap{background:rgba(255,255,255,0.92);border-radius:10px;padding:5px 10px;display:inline-flex;align-items:center;justify-content:center;}
.logo-img{height:48px;width:auto;object-fit:contain;}
.brand{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;margin-bottom:7px;}
.tagline{font-size:10px;opacity:.75;letter-spacing:2px;text-transform:uppercase;}
.header-right{text-align:right;flex-shrink:0;}
.week-label{font-family:'Playfair Display',serif;font-size:13px;font-style:italic;opacity:.8;margin-bottom:2px;}
.week-num{font-size:32px;font-weight:700;line-height:1.1;margin-bottom:3px;}
.friday-date{font-size:10px;opacity:.65;letter-spacing:1px;text-transform:uppercase;}
.info-strip{background:#FFF3F7;border-top:3px solid #C2185B;border-bottom:1px solid #F2D4DE;padding:8px 36px;display:flex;align-items:center;gap:28px;font-size:11.5px;color:#7A6055;}
.info-strip b{color:#C2185B;}
.info-sep{color:#F2D4DE;font-size:16px;}
.dishes-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:20px 36px;}
.dish-card{border:1.5px solid #F2E4E8;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 2px 10px rgba(194,24,91,.07);padding:14px;}
.dish-photo{display:block;width:100%;height:220px;object-fit:cover;border-radius:10px;margin-bottom:12px;}
.dish-info{margin-bottom:10px;}
.dish-name{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#1a1a1a;line-height:1.25;margin-bottom:3px;}
.dish-desc{font-size:11px;color:#7A6055;line-height:1.5;margin-bottom:5px;}
.dish-meta{font-size:11px;color:#555;}
.dish-price{font-size:14px;font-weight:800;color:#C2185B;}
.dish-dot{color:#ccc;}
.dish-spice{font-size:10px;color:#7A4F00;}
.dish-veg{font-size:10px;font-weight:700;color:#166534;}
.dish-nonveg{font-size:10px;font-weight:700;color:#991B1B;}
.ing-section{display:flex;flex-direction:column;gap:5px;padding-top:8px;border-top:1px solid #F2E4E8;}
.ing-row{display:flex;align-items:flex-start;gap:7px;}
.flag{width:18px;height:12px;flex-shrink:0;margin-top:2px;border-radius:1px;box-shadow:0 0 0 .5px rgba(0,0,0,.15);}
.ing-text{flex:1;min-width:0;font-size:10px;color:#444;line-height:1.55;}
.footer{margin:0 36px 22px;border:1.5px solid #F2E4E8;border-radius:10px;overflow:hidden;}
.footer-grid{display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr;background:#FFF3F7;}
.footer-divider{background:#F2E4E8;}
.footer-col{padding:14px 18px;}
.footer-col-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C2185B;margin-bottom:8px;}
.footer-step{display:flex;align-items:flex-start;gap:7px;margin-bottom:6px;}
.step-num{color:#C2185B;font-size:11px;font-weight:800;min-width:14px;display:inline-block;flex-shrink:0;}
.footer-step p{font-size:10.5px;color:#555;line-height:1.5;}
.footer-step p b{color:#1a1a1a;}
.footer-pay-row{display:flex;align-items:center;gap:6px;font-size:11px;color:#555;margin-bottom:5px;}
.footer-pay-row b{color:#1a1a1a;}
`;

export interface FridayMenuOptions {
  dishes: FridayDish[];
  locationId: string;
  /** datetime-local string, e.g. 2026-10-16T17:00 */
  deliveryDateTime: string;
}

export interface FridayMenuResult {
  blob: Blob;
  dataUrl: string;
  weekNum: number;
  fileName: string;
}

export async function generateFridayMenuImage(opts: FridayMenuOptions): Promise<FridayMenuResult> {
  const { dishes, locationId, deliveryDateTime } = opts;
  const loc = DELIVERY_LOCATIONS.find((l) => l.id === locationId) || DELIVERY_LOCATIONS[0];
  const deliveryDate = deliveryDateTime ? new Date(deliveryDateTime) : upcomingFriday();
  const deliveryTime = formatDeliveryTime(deliveryDateTime || upcomingFridayDatetimeLocal());
  const weekNum = getWeekNumber(deliveryDate);
  const fridayLabel = formatFridayDate(deliveryDate);

  // Inline all images as base64 so html2canvas isn't blocked by CORS taint
  let logoSrc = '';
  try { logoSrc = await toDataUrl('/logo.png'); } catch { /* logo is optional */ }

  const imageCache: Record<string, string> = {};
  await Promise.all(dishes.map(async (d) => {
    try { imageCache[d.id] = await toDataUrl(d.imageUrl || FALLBACK_IMG); }
    catch { imageCache[d.id] = FALLBACK_IMG; }
  }));

  const dishCards = dishes.map((d) => `
    <div class="dish-card">
      <img class="dish-photo" src="${imageCache[d.id] || FALLBACK_IMG}" alt="" />
      <div class="dish-top">
        <div class="dish-info">
          <h3 class="dish-name">${esc(d.name)}</h3>
          <p class="dish-desc">${esc(d.description)}</p>
          <p class="dish-meta">
            <span class="dish-price">SEK ${Number(d.price)}</span>
            <span class="dish-dot">&nbsp;&middot;&nbsp;</span>
            <span class="dish-spice">${spiceLabel(d.spiceLevel)}</span>
            <span class="dish-dot">&nbsp;&middot;&nbsp;</span>
            <span class="${d.isVegetarian ? 'dish-veg' : 'dish-nonveg'}">${d.isVegetarian ? '🌿 Veg' : '🍗 Non-Veg'}</span>
          </p>
        </div>
      </div>
      <div class="ing-section">
        <div class="ing-row">
          <img class="flag" src="${FLAG_GB}" alt="Ingredients" />
          <p class="ing-text">${esc(d.ingredients)}</p>
        </div>
        <div class="ing-row">
          <img class="flag" src="${FLAG_SE}" alt="Ingredienser" />
          <p class="ing-text">${esc(d.ingredientsSv)}</p>
        </div>
      </div>
    </div>`).join('');

  const body = `<div class="menu-root">
<div class="header">
  <div class="header-left">
    ${logoSrc ? `<div class="logo-wrap"><img class="logo-img" src="${logoSrc}" alt="Tasty Bites" /></div>` : ''}
    <div>
      <div class="brand">Tasty Bites</div>
      <div class="tagline">Authentic Indian &middot; &Auml;lmhult, Sweden</div>
    </div>
  </div>
  <div class="header-right">
    <div class="week-label">Friday Menu</div>
    <div class="week-num">Week ${weekNum}</div>
    <div class="friday-date">${esc(fridayLabel)}</div>
  </div>
</div>
<div class="info-strip">
  <span>&#128205; <b>${esc(loc.name)}</b> &mdash; ${esc(loc.address)}</span>
  <span class="info-sep">&bull;</span>
  <span>&#128336; Delivery: <b>${esc(deliveryTime)}</b></span>
  <span class="info-sep">&bull;</span>
  <span>&#128172; <b>${PHONE}</b></span>
  <span class="info-sep">&bull;</span>
  <span>&#127758; ${SITE}</span>
</div>
<div class="dishes-grid">${dishCards}</div>
<div class="footer">
  <div class="footer-grid">
    <div class="footer-col">
      <div class="footer-col-title">&#128203; How to Order Online</div>
      <div class="footer-step"><span class="step-num">1</span><p>Visit <b>${SITE}</b> and open <b>Friday Menu</b></p></div>
      <div class="footer-step"><span class="step-num">2</span><p>Choose your dishes &amp; portions, then <b>place the order</b> directly on the site</p></div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-col">
      <div class="footer-col-title">&#128172; Order via WhatsApp</div>
      <div class="footer-step"><span class="step-num">3</span><p>Send a message to <b>${PHONE}</b> with your dish selection</p></div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-col">
      <div class="footer-col-title">&#128205; Delivery</div>
      <div class="footer-pay-row" style="font-weight:600;">&#128205; ${esc(loc.name)}</div>
      <div style="font-size:10px;color:#888;margin:2px 0 6px 20px;">${esc(loc.address)}</div>
      <div class="footer-pay-row">&#128336; ${esc(deliveryTime)}</div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #F2E4E8;">
        <div class="footer-pay-row">&#128241; <b>Swish</b> &nbsp;${PHONE}</div>
        <div class="footer-pay-row">&#128181; <b>Cash</b> &nbsp;on pickup</div>
      </div>
    </div>
  </div>
</div>
</div>`;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;background:#fff;z-index:-9999;';
  container.innerHTML = `<style>${MENU_CSS}</style>${body}`;
  document.body.appendChild(container);

  try {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map((img) => new Promise<void>((resolve) => {
      if (img.complete) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })));
    await document.fonts.ready;

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 960,
      windowWidth: 960,
    });
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image export failed'))), 'image/png'));
    return {
      blob,
      dataUrl: canvas.toDataURL('image/png'),
      weekNum,
      fileName: `tastybites-friday-menu-week${weekNum}.png`,
    };
  } finally {
    document.body.removeChild(container);
  }
}

export function downloadFridayMenu(result: FridayMenuResult): void {
  const link = document.createElement('a');
  link.download = result.fileName;
  link.href = result.dataUrl;
  link.click();
}
