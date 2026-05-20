import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Flame, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

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
  dish: Dish;
  readOnly?: boolean;
}

const spiceLevelColors: Record<string, string> = {
  MILD: 'text-green-600 bg-green-50',
  MEDIUM: 'text-orange-500 bg-orange-50',
  HOT: 'text-red-500 bg-red-50',
  EXTRA_HOT: 'text-red-700 bg-red-100',
};

const spiceLevelKeys: Record<string, string> = {
  MILD: 'dish.spice.mild',
  MEDIUM: 'dish.spice.medium',
  HOT: 'dish.spice.hot',
  EXTRA_HOT: 'dish.spice.extraHot',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop&auto=format';

export default function DishCard({ dish, readOnly = false }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(dish.imageUrl || FALLBACK_IMG);
  const { items, addItem, updateQuantity } = useCartStore();
  const { i18n, t } = useTranslation();

  const cartItem = items.find((i) => i.dish.id === dish.id);
  const quantity = cartItem?.quantity || 0;

  const description = i18n.language === 'sv' ? (dish.descriptionSv || dish.description) : dish.description;
  const ingredients = i18n.language === 'sv' ? dish.ingredientsSv : dish.ingredients;

  const handleAdd = () => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: imgSrc,
      isVegetarian: dish.isVegetarian,
      category: dish.category,
    });
    if (!cartItem) {
      toast.success(`${dish.name} added to cart! 🛒`, { duration: 2000 });
    }
  };

  const handleDecrease = () => updateQuantity(dish.id, quantity - 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="card group flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-video bg-gray-100 flex-shrink-0">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <img
          src={imgSrc}
          alt={dish.name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgSrc(FALLBACK_IMG);
            setImgLoaded(true);
          }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {dish.isVegetarian ? (
            <span className="badge-veg">
              <Leaf size={11} /> {t('dish.veg')}
            </span>
          ) : (
            <span className="badge-nonveg">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t('dish.nonVeg')}
            </span>
          )}
        </div>
        {dish.pieces && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
            {dish.pieces} {t('menu.pieces')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + Spice */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display font-semibold text-gray-900 text-base leading-tight">
            {dish.name}
          </h3>
          <span className={`spice-badge ${spiceLevelColors[dish.spiceLevel]} flex-shrink-0 text-xs`}>
            <Flame size={11} />
            {t(spiceLevelKeys[dish.spiceLevel] || 'dish.spice.mild')}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          {description}
        </p>

        {/* Ingredients — full, bold, visible */}
        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
            {t('dish.ingredients')}
          </p>
          <p className="text-xs font-semibold text-gray-700 leading-relaxed">
            {ingredients}
          </p>
        </div>

        {/* Spacer to push price/button to bottom */}
        <div className="flex-1" />

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-gray-900">
            <span className="text-sm font-medium text-gray-500 mr-0.5">SEK</span>
            {dish.price}
          </p>

          {!readOnly && (
            quantity === 0 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-spice-500 text-white rounded-xl text-sm font-semibold hover:bg-spice-600 active:bg-spice-700 transition-all shadow-warm"
              >
                <ShoppingCart size={15} />
                {t('menu.addToCart')}
              </motion.button>
            ) : (
              <div className="flex items-center gap-3 bg-spice-50 rounded-xl px-3 py-2">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleDecrease}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-spice-500 hover:bg-spice-500 hover:text-white transition-all"
                >
                  <Minus size={14} />
                </motion.button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-bold text-spice-600 w-5 text-center"
                >
                  {quantity}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAdd}
                  className="w-7 h-7 rounded-lg bg-spice-500 shadow-sm flex items-center justify-center text-white hover:bg-spice-600 transition-all"
                >
                  <Plus size={14} />
                </motion.button>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
