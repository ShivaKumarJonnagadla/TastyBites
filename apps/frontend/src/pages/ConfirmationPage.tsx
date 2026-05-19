import { useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Home, UtensilsCrossed, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const confettiRef = useRef(false);

  const order = location.state?.order;
  const merged = location.state?.merged;

  useEffect(() => {
    if (!confettiRef.current) {
      confettiRef.current = true;

      // Confetti burst
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...opts,
          origin: { y: 0.6 },
          particleCount: Math.floor(200 * particleRatio),
          colors: ['#E8521A', '#FF7A00', '#F59E0B', '#22c55e', '#ffffff'],
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-spice-50 to-white flex items-center justify-center pt-16 px-4">
      <div className="max-w-lg w-full">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={50} className="text-green-500" fill="currentColor" />
          </div>
        </motion.div>

        {/* Floating hearts */}
        {['❤️', '🎉', '✨', '🌶️', '🍛'].map((emoji, i) => (
          <motion.div
            key={i}
            className="fixed text-2xl pointer-events-none"
            style={{ left: `${15 + i * 18}%`, top: '20%' }}
            animate={{ y: [0, -80, 0], opacity: [1, 0], scale: [1, 1.5, 0.5] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: 2 }}
          >
            {emoji}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8 text-center"
        >
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {merged ? 'Order Updated! 🎉' : t('confirmation.title')}
          </h1>
          <p className="text-gray-500 mb-6">
            {merged
              ? 'We\'ve added your new items to your existing order!'
              : t('confirmation.subtitle')}
          </p>

          {order && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Order Reference</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded">
                  {order.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-spice-500">SEK {order.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>

              {/* Items */}
              {order.orderItems?.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Your Order</p>
                  {order.orderItems.map((item: { dish: { name: string }; quantity: number; price: number }, i: number) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700 py-1">
                      <span>{item.dish?.name} × {item.quantity}</span>
                      <span>SEK {Number(item.price) * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pickup Instructions */}
          {order?.pickupMessage && (
            <div className="bg-spice-50 border border-spice-100 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-spice-700 mb-2 flex items-center gap-1.5">
                <UtensilsCrossed size={14} /> Pickup Instructions
              </p>
              <p className="text-sm text-spice-800 leading-relaxed">{order.pickupMessage}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="btn-primary flex-1">
              <Home size={18} /> Back to Home
            </Link>
            <Link to="/menu" className="btn-secondary flex-1">
              <UtensilsCrossed size={18} /> Order More
            </Link>
          </div>

          <a
            href="https://wa.me/46701234567"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
          >
            <MessageCircle size={16} /> Questions? Message us on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
