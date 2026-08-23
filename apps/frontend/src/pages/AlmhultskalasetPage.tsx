import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Megaphone, MessageCircle } from 'lucide-react';
import { dishApi } from '../lib/api';
import DishCard from '../components/menu/DishCard';
import SkeletonCard from '../components/ui/SkeletonCard';

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
  availableSpiceLevels: string[];
  category: string;
}

// Exact dish names per slot (case-insensitive)
const SLOT_CONFIG = [
  {
    id: 'morning',
    label: 'Morning Snacks',
    time: '10 AM – 12 PM',
    icon: '☀️',
    color: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-800',
    timeBg: 'bg-amber-500',
    names: ['vegetable puffs', 'egg puffs', 'chicken puffs', 'rasmalai'],
  },
  {
    id: 'lunch',
    label: 'Lunch',
    time: '12 PM – 2 PM',
    icon: '🍽️',
    color: 'from-rose-50 to-pink-50',
    border: 'border-rose-200',
    headerBg: 'bg-rose-100',
    headerText: 'text-rose-800',
    timeBg: 'bg-rose-500',
    names: [
      'dindigul chicken biriyani',
      'rice with creamy butter chicken',
      'rice with creamy paneer butter masala',
      'veg fried rice with gobi manchurian',
      'ghee rice with pepper chicken',
    ],
  },
  {
    id: 'evening',
    label: 'Evening Snacks',
    time: '2 PM – 4 PM',
    icon: '🌙',
    color: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-200',
    headerBg: 'bg-indigo-100',
    headerText: 'text-indigo-800',
    timeBg: 'bg-indigo-500',
    names: ['bajjis', 'pani puri', 'dahi puri', 'gobi 65', 'mango lassi', 'paneer frankie'],
  },
];

function matchSlot(dishName: string): string | null {
  const lower = dishName.toLowerCase().trim();
  for (const slot of SLOT_CONFIG) {
    if (slot.names.some((n) => lower === n || lower.includes(n) || n.includes(lower))) return slot.id;
  }
  return null;
}

export default function AlmhultskalasetPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dishApi.getAll({ isAvailable: 'true' })
      .then((res) => setDishes(res.data.data || []))
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, []);

  const slottedDishes = SLOT_CONFIG.map((slot) => ({
    ...slot,
    dishes: dishes.filter((d) => matchSlot(d.name) === slot.id),
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#5c1a3a] pt-20 pb-10 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <p className="text-amber-300 font-bold text-xs tracking-[0.3em] uppercase mb-2">Tasty Bites presents</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-1 tracking-tight">
            ÄLMHULTSKALASET
          </h1>
          <p className="text-amber-200 text-lg font-medium mb-6">2026</p>

          {/* Event details pill row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-amber-400 text-[#5c1a3a] font-bold text-sm px-4 py-2 rounded-full">
              📅 29 AUG 2026
            </div>
            <div className="flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full border border-white/20">
              🕙 10 AM – 16 PM
            </div>
            <div className="flex items-center gap-2 bg-white/15 text-white text-sm px-4 py-2 rounded-full border border-white/20">
              <MapPin size={14} className="text-amber-300" /> Älmhult Centrum
            </div>
          </div>

          {/* Pre-orders banner */}
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="max-w-xl mx-auto bg-amber-400 rounded-2xl px-5 py-4 text-[#5c1a3a]"
          >
            <div className="flex items-center justify-center gap-2 font-bold text-base mb-1">
              <Megaphone size={18} /> PRE-ORDERS TAKEN!
            </div>
            <p className="text-sm font-medium opacity-90">
              Skip the queue — order your favourites in advance!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-2 text-sm font-semibold">
              <a
                href="https://wa.me/46769677497"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#5c1a3a] text-white px-4 py-2 rounded-xl hover:bg-[#7a2150] transition-colors"
              >
                <MessageCircle size={15} /> WhatsApp +46 769 677 497
              </a>
              <span className="text-xs opacity-75">Send: Your Name • Dish • Quantity</span>
            </div>
            <p className="text-xs opacity-70 mt-2">or order directly through the website below ↓</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Time slot sections */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {slottedDishes.map((slot, idx) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            {/* Slot header */}
            <div className={`flex items-center gap-4 mb-6 p-4 rounded-2xl bg-gradient-to-r ${slot.color} border ${slot.border}`}>
              <div className="text-4xl">{slot.icon}</div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">{slot.label}</h2>
                <span className={`inline-block text-xs font-bold text-white ${slot.timeBg} px-3 py-1 rounded-full mt-1`}>
                  {slot.time}
                </span>
              </div>
            </div>

            {/* Dishes grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : slot.dishes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Dishes coming soon…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {slot.dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} readOnly={false} />
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Bottom pre-order reminder */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
        >
          <div className="text-2xl mb-2">📢</div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">PRE-ORDERS TAKEN!</h3>
          <p className="text-gray-600 text-sm mb-3">
            Skip the queue — WhatsApp <strong>+46 769 677 497</strong>
          </p>
          <p className="text-xs text-gray-500">Send Your Name • Dish • Quantity or order through website</p>
          <a
            href="https://wa.me/46769677497"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-green-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={16} /> Message us on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
