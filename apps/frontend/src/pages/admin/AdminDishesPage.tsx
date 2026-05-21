import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Upload, CheckSquare, Square, CalendarDays, Star, Layers, XCircle, FileDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { dishApi, uploadApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { DISH_CATEGORIES } from '../../lib/constants';

interface Dish {
  id: string;
  name: string;
  description: string;
  descriptionSv: string;
  ingredients: string;
  ingredientsSv: string;
  pieces: number | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  menuType: string;
  isVegetarian: boolean;
  spiceLevel: string;
  category: string;
}

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  descriptionSv: z.string().optional().default(''),
  ingredients: z.string().min(3),
  ingredientsSv: z.string().min(3),
  pieces: z.number().nullable().optional(),
  price: z.number().positive(),
  imageUrl: z.string().nullable().optional().or(z.literal('')),
  isAvailable: z.boolean(),
  menuType: z.enum(['DAILY', 'FRIDAY', 'BOTH']),
  isVegetarian: z.boolean(),
  spiceLevel: z.enum(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT']),
  category: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  name: '',
  description: '',
  descriptionSv: '',
  ingredients: '',
  ingredientsSv: '',
  pieces: null,
  price: 0,
  imageUrl: '',
  isAvailable: true,
  menuType: 'DAILY',
  isVegetarian: false,
  spiceLevel: 'MEDIUM',
  category: 'Curry',
};

const statusColors: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  FRIDAY: 'bg-purple-100 text-purple-700',
  BOTH: 'bg-green-100 text-green-700',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop';

const DELIVERY_LOCATIONS = [
  { id: 'kry', name: 'Kry Vårdcentral Älmhult Parkering', address: 'Gotthards gata 5, 343 36 Älmhult' },
  { id: 'grillen', name: 'Grillen Parkering', address: 'Ikeagatan 2, 343 36 Älmhult' },
];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function nextFridayLabel(): string {
  const d = new Date();
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toLocaleDateString('en-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function nextFridayDatetimeLocal(): string {
  const d = new Date();
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  d.setHours(12, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDeliveryTime(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  const d = new Date(datetimeLocal);
  const dateStr = d.toLocaleDateString('en-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} · ${timeStr}`;
}

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [menuTypeFilter, setMenuTypeFilter] = useState<'ALL' | 'DAILY' | 'FRIDAY' | 'BOTH'>('ALL');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfLocationId, setPdfLocationId] = useState('kry');
  const [pdfDeliveryTime, setPdfDeliveryTime] = useState(nextFridayDatetimeLocal);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const imageUrl = watch('imageUrl');

  const fetchDishes = async () => {
    try {
      const res = await dishApi.getAll({ limit: 100 });
      setDishes(res.data.data || []);
    } catch {
      toast.error('Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDishes(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setShowForm(true);
  };

  const openEdit = (dish: Dish) => {
    setEditing(dish);
    reset({
      name: dish.name,
      description: dish.description,
      descriptionSv: dish.descriptionSv || '',
      ingredients: dish.ingredients,
      ingredientsSv: dish.ingredientsSv,
      price: Number(dish.price),
      imageUrl: dish.imageUrl || '',
      pieces: dish.pieces || null,
      isAvailable: dish.isAvailable,
      menuType: dish.menuType as 'DAILY' | 'FRIDAY' | 'BOTH',
      isVegetarian: dish.isVegetarian,
      spiceLevel: dish.spiceLevel as 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT',
      category: dish.category,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, imageUrl: data.imageUrl || null, pieces: data.pieces || null };
      if (editing) {
        await dishApi.update(editing.id, payload);
        toast.success('Dish updated!');
      } else {
        await dishApi.create(payload);
        toast.success('Dish created!');
      }
      setShowForm(false);
      fetchDishes();
    } catch {
      toast.error('Failed to save dish');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await dishApi.delete(id);
      toast.success('Dish deleted');
      fetchDishes();
    } catch {
      toast.error('Failed to delete dish');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await dishApi.toggleAvailability(id);
      fetchDishes();
      toast.success('Availability updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setValue('imageUrl', res.data.data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filtered = dishes.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    const matchesMenu = menuTypeFilter === 'ALL' || d.menuType === menuTypeFilter;
    return matchesSearch && matchesMenu;
  });

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));
  const someSelected = filtered.some((d) => selectedIds.has(d.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  const handleBulkMenuType = async (menuType: 'DAILY' | 'FRIDAY' | 'BOTH') => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all([...selectedIds].map((id) => dishApi.update(id, { menuType })));
      const label = menuType === 'DAILY' ? 'Daily Menu' : menuType === 'FRIDAY' ? 'Friday Special' : 'Both Menus';
      toast.success(`${selectedIds.size} dish${selectedIds.size > 1 ? 'es' : ''} set to ${label}`);
      setSelectedIds(new Set());
      fetchDishes();
    } catch {
      toast.error('Failed to update some dishes');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExportMenu = async (locationId: string, deliveryTime: string) => {
    const selectedDishes = dishes.filter((d) => selectedIds.has(d.id));
    if (selectedDishes.length === 0) return;
    const loc = DELIVERY_LOCATIONS.find((l) => l.id === locationId) || DELIVERY_LOCATIONS[0];

    // Fetch logo as base64 so it renders without CORS issues
    let logoSrc = '';
    try {
      const res = await fetch('/logo.png');
      const blob = await res.blob();
      logoSrc = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { /* logo unavailable — will hide gracefully */ }

    // Pre-fetch all dish images as base64 to avoid CORS taint issues
    const imageCache: Record<string, string> = {};
    await Promise.all(selectedDishes.map(async (dish) => {
      const src = dish.imageUrl || FALLBACK_IMG;
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        imageCache[dish.id] = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        imageCache[dish.id] = FALLBACK_IMG;
      }
    }));

    const weekNum = getWeekNumber(new Date());
    const fridayLabel = nextFridayLabel();

    const spiceLabel = (level: string) => {
      if (level === 'MILD') return '🟢 Mild';
      if (level === 'MEDIUM') return '🌶️ Medium';
      if (level === 'HOT') return '🌶️🌶️ Hot';
      return '🌶️🌶️🌶️ Extra Hot';
    };

    const dishCards = selectedDishes.map((dish) => `
      <div class="dish-card">
        <div class="dish-top">
          <img class="dish-thumb" src="${imageCache[dish.id] || FALLBACK_IMG}" alt="${dish.name.replace(/"/g, '&quot;')}" />
          <div class="dish-info">
            <div class="dish-title-row">
              <h3 class="dish-name">${dish.name}</h3>
              <span class="price-badge">SEK ${Number(dish.price)}</span>
            </div>
            <p class="dish-desc">${dish.description}</p>
            <div class="dish-tags">
              <span class="spice-tag">${spiceLabel(dish.spiceLevel)}</span>
              <span class="${dish.isVegetarian ? 'veg-badge' : 'nonveg-badge'}">${dish.isVegetarian ? '🌿 Veg' : '🍗 Non-Veg'}</span>
            </div>
          </div>
        </div>
        <div class="ing-section">
          <div class="ing-row">
            <span class="ing-lang">🇬🇧 Ingredients</span>
            <p class="ing-text">${dish.ingredients}</p>
          </div>
          <div class="ing-row">
            <span class="ing-lang">🇸🇪 Ingredienser</span>
            <p class="ing-text">${dish.ingredientsSv}</p>
          </div>
        </div>
      </div>
    `).join('');

    const menuCss = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
/* HEADER */
.header{background:linear-gradient(135deg,#C2185B 0%,#880E4F 100%);color:#fff;padding:18px 36px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.header-left{display:flex;align-items:center;gap:14px;}
.logo-wrap{background:rgba(255,255,255,0.92);border-radius:10px;padding:5px 10px;display:inline-flex;align-items:center;justify-content:center;}
.logo-img{height:48px;width:auto;object-fit:contain;}
.brand{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;}
.tagline{font-size:10px;opacity:.75;letter-spacing:2px;text-transform:uppercase;margin-top:3px;}
.header-right{text-align:right;flex-shrink:0;}
.week-label{font-family:'Playfair Display',serif;font-size:13px;font-style:italic;opacity:.8;margin-bottom:2px;}
.week-num{font-size:32px;font-weight:700;line-height:1.1;margin-bottom:3px;}
.friday-date{font-size:10px;opacity:.65;letter-spacing:1px;text-transform:uppercase;}
/* INFO STRIP */
.info-strip{background:#FFF3F7;border-top:3px solid #C2185B;border-bottom:1px solid #F2D4DE;padding:8px 36px;display:flex;align-items:center;gap:28px;font-size:11.5px;color:#7A6055;}
.info-strip b{color:#C2185B;}
.info-sep{color:#F2D4DE;font-size:16px;}
/* DISHES */
.dishes-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:20px 36px;}
.dish-card{border:1.5px solid #F2E4E8;border-radius:12px;overflow:hidden;break-inside:avoid;page-break-inside:avoid;background:#fff;box-shadow:0 2px 10px rgba(194,24,91,.07);padding:14px;}
.dish-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
.dish-thumb{width:72px;height:72px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2.5px solid #F2E4E8;}
.dish-info{flex:1;min-width:0;}
.dish-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;}
.dish-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.25;flex:1;}
.price-badge{background:#C2185B;color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;flex-shrink:0;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;line-height:1;}
.dish-desc{font-size:10.5px;color:#7A6055;line-height:1.5;margin-bottom:6px;}
.dish-tags{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.veg-badge,.nonveg-badge{font-size:9.5px;font-weight:700;padding:3px 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;line-height:1;}
.veg-badge{background:#f0fdf4;color:#166534;border:1px solid #BBF7D0;}
.nonveg-badge{background:#fef2f2;color:#991B1B;border:1px solid #FECACA;}
.spice-tag{display:inline-flex;align-items:center;justify-content:center;line-height:1;font-size:9.5px;background:#FFF3F7;border:1px solid #F9C6D8;color:#880E4F;padding:3px 7px;border-radius:4px;font-weight:600;}
.ing-section{display:flex;flex-direction:column;gap:5px;padding-top:8px;border-top:1px solid #F2E4E8;}
.ing-lang{display:block;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#C2185B;margin-bottom:2px;}
.ing-text{font-size:10px;color:#444;line-height:1.55;}
/* FOOTER */
.footer{margin:0 36px 22px;border:1.5px solid #F2E4E8;border-radius:10px;overflow:hidden;}
.footer-grid{display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr;background:#FFF3F7;}
.footer-divider{background:#F2E4E8;}
.footer-col{padding:14px 18px;}
.footer-col-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C2185B;margin-bottom:8px;}
.footer-step{display:flex;align-items:flex-start;gap:7px;margin-bottom:6px;}
.step-num{background:#C2185B;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;font-weight:700;line-height:16px;text-align:center;display:inline-block;flex-shrink:0;}
.footer-step p{font-size:10.5px;color:#555;line-height:1.5;}
.footer-step p b{color:#1a1a1a;}
.footer-contact-row{display:flex;align-items:center;gap:6px;font-size:11px;color:#555;margin-bottom:5px;}
.footer-contact-row b{color:#C2185B;}
.footer-pay-row{display:flex;align-items:center;gap:6px;font-size:11px;color:#555;margin-bottom:5px;}
.footer-pay-row b{color:#1a1a1a;}
`;

    const menuBody = `<div class="header">
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
    <div class="friday-date">${fridayLabel}</div>
  </div>
</div>
<div class="info-strip">
  <span>&#128205; <b>${loc.name}</b> &mdash; ${loc.address}</span>
  <span class="info-sep">&bull;</span>
  <span>&#128336; Delivery: <b>${deliveryTime}</b></span>
  <span class="info-sep">&bull;</span>
  <span>&#128172; <b>+46 769677497</b></span>
  <span class="info-sep">&bull;</span>
  <span>&#127758; tastybites-almhult.vercel.app</span>
</div>
<div class="dishes-grid">${dishCards}</div>
<div class="footer">
  <div class="footer-grid">
    <div class="footer-col">
      <div class="footer-col-title">&#128203; How to Order Online</div>
      <div class="footer-step"><span class="step-num">1</span><p>Visit <b>tastybites-almhult.vercel.app</b> and open <b>Friday Menu</b></p></div>
      <div class="footer-step"><span class="step-num">2</span><p>Choose your dishes &amp; portions, then <b>place the order</b> directly on the site</p></div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-col">
      <div class="footer-col-title">&#128172; Order via WhatsApp</div>
      <div class="footer-step"><span class="step-num">3</span><p>Send a message to <b>+46 769677497</b> with your dish selection</p></div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-col">
      <div class="footer-col-title">&#128205; Delivery</div>
      <div class="footer-pay-row" style="font-weight:600;">&#128205; ${loc.name}</div>
      <div style="font-size:10px;color:#888;margin:2px 0 6px 20px;">${loc.address}</div>
      <div class="footer-pay-row">&#128336; ${deliveryTime}</div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #F2E4E8;">
        <div class="footer-pay-row">&#128241; <b>Swish</b> &nbsp;+46 769677497</div>
        <div class="footer-pay-row">&#128181; <b>Cash</b> &nbsp;on pickup</div>
      </div>
    </div>
  </div>
</div>
`;

    const toastId = toast.loading('Generating menu image…');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;background:#fff;z-index:-9999;';
    container.innerHTML = `<style>${menuCss}</style>${menuBody}`;
    document.body.appendChild(container);

    // Wait for all images inside the container to load
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map(img => new Promise<void>(resolve => {
      if (img.complete) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })));

    // Ensure fonts are ready
    await document.fonts.ready;

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 960,
        windowWidth: 960,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tastybites-menu-week${weekNum}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Menu exported as PNG!', { id: toastId });
    } catch {
      toast.error('Failed to generate image', { id: toastId });
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dishes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{dishes.length} dishes total</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Add Dish
        </button>
      </div>

      {/* Search + Menu Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="input-field pl-9 py-2.5 w-56"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          {(['ALL', 'DAILY', 'FRIDAY', 'BOTH'] as const).map((type) => {
            const labels: Record<string, string> = { ALL: 'All', DAILY: 'Daily', FRIDAY: 'Friday', BOTH: 'Both' };
            const activeColors: Record<string, string> = {
              ALL: 'bg-white text-gray-900 shadow-sm',
              DAILY: 'bg-blue-500 text-white shadow-sm',
              FRIDAY: 'bg-purple-500 text-white shadow-sm',
              BOTH: 'bg-green-500 text-white shadow-sm',
            };
            const count = type === 'ALL' ? dishes.length : dishes.filter((d) => d.menuType === type).length;
            return (
              <button
                key={type}
                onClick={() => setMenuTypeFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  menuTypeFilter === type ? activeColors[type] : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[type]}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  menuTypeFilter === type ? 'bg-white/25 text-inherit' : 'bg-gray-200 text-gray-600'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 flex-wrap px-4 py-3 bg-spice-50 border border-spice-200 rounded-xl"
          >
            <span className="text-sm font-semibold text-spice-700 mr-1">
              {selectedIds.size} dish{selectedIds.size > 1 ? 'es' : ''} selected
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500 font-medium">Set menu type:</span>
            <button
              onClick={() => handleBulkMenuType('DAILY')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all disabled:opacity-50"
            >
              <CalendarDays size={13} /> Daily Menu
            </button>
            <button
              onClick={() => handleBulkMenuType('FRIDAY')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all disabled:opacity-50"
            >
              <Star size={13} /> Friday Special
            </button>
            <button
              onClick={() => handleBulkMenuType('BOTH')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all disabled:opacity-50"
            >
              <Layers size={13} /> Both Menus
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle size={14} /> Clear
            </button>
            <button
              onClick={() => setShowPDFModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-spice-500 text-white hover:bg-spice-600 transition-all shadow-sm"
              title="Export selected dishes as a Friday Menu PNG image"
            >
              <FileDown size={13} /> Export Menu
            </button>
            {bulkUpdating && (
              <motion.div
                className="w-4 h-4 border-2 border-spice-300 border-t-spice-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dishes Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <motion.div className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="pl-4 pr-2 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-spice-500 transition-colors"
                      title={allSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allSelected
                        ? <CheckSquare size={17} className="text-spice-500" />
                        : someSelected
                          ? <CheckSquare size={17} className="text-spice-300" />
                          : <Square size={17} />}
                    </button>
                  </th>
                  {['Image', 'Dish', 'Category', 'Menu', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((dish) => (
                  <tr
                    key={dish.id}
                    className={`transition-colors ${
                      selectedIds.has(dish.id)
                        ? 'bg-spice-50/60 hover:bg-spice-50'
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="pl-4 pr-2 py-3">
                      <button
                        onClick={() => toggleSelect(dish.id)}
                        className="text-gray-300 hover:text-spice-500 transition-colors"
                      >
                        {selectedIds.has(dish.id)
                          ? <CheckSquare size={17} className="text-spice-500" />
                          : <Square size={17} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80'}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{dish.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{dish.description}</p>
                      <div className="flex gap-1 mt-1">
                        {dish.isVegetarian && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">🌿 Veg</span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          🌶️ {dish.spiceLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{dish.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[dish.menuType]}`}>
                        {dish.menuType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">SEK {Number(dish.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(dish.id)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                          dish.isAvailable
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {dish.isAvailable ? <Eye size={12} /> : <EyeOff size={12} />}
                        {dish.isAvailable ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(dish)}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(dish.id, dish.name)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No dishes found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-8 lg:inset-16 bg-white rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit Dish' : 'Add New Dish'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
                    <input {...register('name')} className="input-field" placeholder="e.g. Chicken Biryani" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Description EN */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (English) *</label>
                    <textarea {...register('description')} rows={2} className="input-field resize-none"
                      placeholder="Short description of the dish" />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  {/* Description SV */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Swedish)</label>
                    <textarea {...register('descriptionSv')} rows={2} className="input-field resize-none"
                      placeholder="Kort beskrivning av rätten" />
                  </div>

                  {/* Ingredients EN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (English) *</label>
                    <textarea {...register('ingredients')} rows={2} className="input-field resize-none"
                      placeholder="Chicken, rice, spices..." />
                    {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients.message}</p>}
                  </div>

                  {/* Ingredients SV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (Swedish) *</label>
                    <textarea {...register('ingredientsSv')} rows={2} className="input-field resize-none"
                      placeholder="Kyckling, ris, kryddor..." />
                    {errors.ingredientsSv && <p className="text-red-500 text-xs mt-1">{errors.ingredientsSv.message}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (SEK) *</label>
                    <input {...register('price', { valueAsNumber: true })} type="number" min="0" step="5"
                      className="input-field" placeholder="120" />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>

                  {/* Pieces */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pieces (optional)</label>
                    <input {...register('pieces', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                      type="number" min="1" className="input-field" placeholder="e.g. 4" />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select {...register('category')} className="input-field">
                      {DISH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Menu Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Menu Type *</label>
                    <select {...register('menuType')} className="input-field">
                      <option value="DAILY">Daily Menu</option>
                      <option value="FRIDAY">Friday Special</option>
                      <option value="BOTH">Both Menus</option>
                    </select>
                  </div>

                  {/* Spice Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level *</label>
                    <select {...register('spiceLevel')} className="input-field">
                      <option value="MILD">🌿 Mild</option>
                      <option value="MEDIUM">🌶️ Medium</option>
                      <option value="HOT">🌶️🌶️ Hot</option>
                      <option value="EXTRA_HOT">🌶️🌶️🌶️ Extra Hot</option>
                    </select>
                  </div>

                  {/* Image */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dish Image</label>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input {...register('imageUrl')} className="input-field" placeholder="https://..." />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="btn-secondary cursor-pointer text-sm py-3">
                          <Upload size={16} />
                          {uploading ? 'Uploading...' : 'Upload'}
                          <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register('isVegetarian')} type="checkbox" className="w-4 h-4 text-spice-500 rounded" />
                      <span className="text-sm font-medium text-gray-700">🌿 Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register('isAvailable')} type="checkbox" className="w-4 h-4 text-spice-500 rounded" />
                      <span className="text-sm font-medium text-gray-700">✅ Available</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Saving...' : editing ? 'Update Dish' : 'Create Dish'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PDF Export Modal */}
      <AnimatePresence>
        {showPDFModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowPDFModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-2xl z-50 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-spice-50 flex items-center justify-center">
                    <FileDown size={16} className="text-spice-500" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Export Menu</h2>
                </div>
                <button onClick={() => setShowPDFModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Location</label>
                  <select
                    value={pdfLocationId}
                    onChange={(e) => setPdfLocationId(e.target.value)}
                    className="input-field"
                  >
                    {DELIVERY_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5 ml-0.5">
                    {DELIVERY_LOCATIONS.find((l) => l.id === pdfLocationId)?.address}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={pdfDeliveryTime}
                    onChange={(e) => setPdfDeliveryTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="input-field"
                  />
                  {pdfDeliveryTime && (
                    <p className="text-xs text-spice-600 font-medium mt-1.5 ml-0.5">
                      {formatDeliveryTime(pdfDeliveryTime)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-spice-50 rounded-xl p-3">
                  <span className="text-xs text-spice-700">
                    <strong>{selectedIds.size}</strong> dish{selectedIds.size !== 1 ? 'es' : ''} selected for this PDF
                  </span>
                </div>

                {/* Export button — slides in after time is chosen */}
                <AnimatePresence>
                  {pdfDeliveryTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-spice-200 bg-gradient-to-br from-spice-50 to-pink-50 p-4 space-y-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-spice-700 uppercase tracking-wide">Ready to export</p>
                        <p className="text-sm font-medium text-gray-800">
                          {DELIVERY_LOCATIONS.find((l) => l.id === pdfLocationId)?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {DELIVERY_LOCATIONS.find((l) => l.id === pdfLocationId)?.address}
                        </p>
                        <p className="text-sm font-semibold text-spice-600 mt-1">
                          🕐 {formatDeliveryTime(pdfDeliveryTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowPDFModal(false);
                          handleExportMenu(pdfLocationId, formatDeliveryTime(pdfDeliveryTime));
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-spice-500 hover:bg-spice-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        <FileDown size={16} /> Export Menu
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowPDFModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
