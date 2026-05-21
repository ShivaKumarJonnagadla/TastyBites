import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=120&h=120&fit=crop&auto=format';

function CartItemImage({ src, alt }: { src: string | null; alt: string }) {
  return (
    <img
      src={src || FALLBACK_IMG}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK_IMG;
      }}
    />
  );
}

export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, totalAmount, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const total = totalAmount();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-spice-500" />
                <h2 className="font-display font-bold text-lg text-gray-900">{t('cart.title')}</h2>
                {items.length > 0 && (
                  <span className="w-6 h-6 bg-spice-100 text-spice-600 rounded-full text-xs font-bold flex items-center justify-center">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-6xl"
                  >
                    🛒
                  </motion.div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">{t('cart.empty')}</p>
                    <p className="text-sm text-gray-400">Add some delicious dishes!</p>
                  </div>
                  <button onClick={closeCart} className="btn-secondary text-sm py-2 px-6">
                    {t('cart.continue')}
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.dish.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        <CartItemImage src={item.dish.imageUrl} alt={item.dish.name} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.dish.name}</p>
                        {item.selectedSpiceLevel && (
                          <span className="inline-block text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full mb-0.5">
                            {{LOW: 'Low 🟢', MEDIUM: 'Medium 🌶️', SPICY: 'Spicy 🔥'}[item.selectedSpiceLevel] || item.selectedSpiceLevel}
                          </span>
                        )}
                        <p className="text-sm text-spice-500 font-medium">
                          SEK {item.dish.price * item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-spice-300 hover:text-spice-500 transition-all"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={12} className="text-red-400" />
                          ) : (
                            <Minus size={12} />
                          )}
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-spice-500 flex items-center justify-center text-white hover:bg-spice-600 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{t('cart.total')}</span>
                  <span className="text-2xl font-bold text-gray-900">SEK {total}</span>
                </div>
                <button onClick={handleCheckout} className="btn-primary w-full py-4 text-base">
                  {t('cart.checkout')}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
