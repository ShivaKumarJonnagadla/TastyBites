import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { dishApi } from '../lib/api';
import MenuSection from '../components/menu/MenuSection';

interface Dish {
  id: string;
  name: string;
  description: string;
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

type Tab = 'all' | 'daily' | 'friday';

export default function MenuPage() {
  const { t } = useTranslation();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = await dishApi.getAll({ isAvailable: 'true' });
        setDishes(res.data.data || []);
      } catch {
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDishes();
  }, []);

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'all', label: 'All Dishes', emoji: '🍽️' },
    { id: 'daily', label: t('menu.daily'), emoji: '☀️' },
    { id: 'friday', label: t('menu.friday'), emoji: '🎉' },
  ];

  const filtered = dishes.filter((d) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'daily') return d.menuType === 'DAILY' || d.menuType === 'BOTH';
    if (activeTab === 'friday') return d.menuType === 'FRIDAY' || d.menuType === 'BOTH';
    return true;
  });

  return (
    <div className="pt-16 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-950 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-white mb-2"
          >
            Our Menu
          </motion.h1>
          <p className="text-white/80">Freshly prepared with authentic Indian spices</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-spice-500 text-white shadow-warm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                {!loading && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.id === 'all'
                      ? dishes.length
                      : dishes.filter((d) =>
                          tab.id === 'daily'
                            ? d.menuType === 'DAILY' || d.menuType === 'BOTH'
                            : d.menuType === 'FRIDAY' || d.menuType === 'BOTH'
                        ).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MenuSection
        title={tabs.find((t) => t.id === activeTab)?.label || 'Menu'}
        dishes={filtered}
        isLoading={loading}
        emoji={tabs.find((t) => t.id === activeTab)?.emoji || '🍛'}
        readOnly={activeTab === 'all'}
      />
    </div>
  );
}
