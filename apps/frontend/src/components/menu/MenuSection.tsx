import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DishCard from './DishCard';
import SkeletonCard from '../ui/SkeletonCard';
import EmptyState from '../ui/EmptyState';
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

interface Props {
  title: string;
  subtitle?: string;
  dishes: Dish[];
  isLoading?: boolean;
  showFilters?: boolean;
  emoji?: string;
  readOnly?: boolean;
}

export default function MenuSection({ title, subtitle, dishes, isLoading, showFilters = true, emoji = '🍛', readOnly = false }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const filtered = dishes.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
        !d.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && d.category !== selectedCategory) return false;
    if (vegOnly && !d.isVegetarian) return false;
    return true;
  });

  const categories = [...new Set(dishes.map((d) => d.category))];
  const hasActiveFilters = search || selectedCategory || vegOnly;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-5xl mb-3 block">{emoji}</span>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </motion.div>

        {/* Search & Filters */}
        {showFilters && (
          <div className="mb-8 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('menu.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 pr-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  hasActiveFilters
                    ? 'border-spice-500 bg-spice-50 text-spice-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal size={16} />
                {t('menu.filter')}
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-spice-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {[search, selectedCategory, vegOnly].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    {/* Categories */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory('')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            !selectedCategory ? 'bg-spice-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {t('menu.allCategories')}
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedCategory === cat ? 'bg-spice-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Veg filter */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setVegOnly(!vegOnly)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          vegOnly ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <Leaf size={15} />
                        {t('menu.vegetarian')} Only
                      </button>
                      {hasActiveFilters && (
                        <button
                          onClick={() => { setSearch(''); setSelectedCategory(''); setVegOnly(false); }}
                          className="text-sm text-gray-500 hover:text-spice-500 underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Dishes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={dishes.length === 0 ? 'Menu Coming Soon' : 'No results found'}
            description={
              dishes.length === 0
                ? t('menu.emptyState')
                : 'Try adjusting your search or filters'
            }
            emoji={dishes.length === 0 ? '🍛' : '🔍'}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((dish) => (
                <DishCard key={dish.id} dish={dish} readOnly={readOnly} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
