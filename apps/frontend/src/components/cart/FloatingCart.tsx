import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useLocation } from 'react-router-dom';

export default function FloatingCart() {
  const { totalItems, openCart } = useCartStore();
  const location = useLocation();
  const count = totalItems();

  // Hide on checkout and confirmation pages, and admin
  const hidden =
    location.pathname.includes('/checkout') ||
    location.pathname.includes('/confirmation') ||
    location.pathname.includes('/admin');

  if (hidden) return null;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={openCart}
          className="floating-cart"
          aria-label="Open cart"
        >
          <ShoppingCart size={24} />
          <motion.span
            key={count}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-spice-500 text-xs font-bold rounded-full flex items-center justify-center shadow-md border-2 border-spice-500"
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
