import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Phone, Mail, CreditCard, Wallet, ShoppingBag, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cartStore';
import { orderApi } from '../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().min(8, 'Valid mobile number required').regex(/^[+\d\s-]+$/, 'Invalid phone number'),
  email: z.preprocess((v) => (v === '' ? undefined : v), z.string().email('Valid email required').optional()),
  paymentMethod: z.enum(['SWISH', 'CASH']),
  notes: z.preprocess((v) => (v === '' ? undefined : v), z.string().max(500).optional()),
});

type FormData = z.infer<typeof schema>;

const SWISH_QR = '/swish-qr.png';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, totalAmount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'SWISH' },
  });

  const paymentMethod = watch('paymentMethod');
  const total = totalAmount();

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const orderData = {
        ...data,
        items: items.map((item) => ({
          dishId: item.dish.id,
          quantity: item.quantity,
          price: item.dish.price,
        })),
      };

      const res = await orderApi.create(orderData);
      clearCart();
      navigate(`/confirmation/${res.data.data.id}`, {
        state: { order: res.data.data, merged: res.data.merged },
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to place order';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-spice-500 mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Menu
        </button>

        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
          {t('checkout.title')} 🛒
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Customer Details */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-5 flex items-center gap-2">
                  <User size={18} className="text-spice-500" /> Your Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('checkout.name')} *
                    </label>
                    <input
                      {...register('customerName')}
                      placeholder="Enter your full name"
                      className="input-field"
                    />
                    {errors.customerName && (
                      <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('checkout.mobile')} *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('mobileNumber')}
                        placeholder="+46 70 123 4567"
                        className="input-field pl-10"
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-gray-400 font-normal">(optional — for order confirmation)</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="your@email.com"
                        className="input-field pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('checkout.notes')}
                    </label>
                    <textarea
                      {...register('notes')}
                      placeholder="Any dietary requirements or special instructions..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-spice-500" /> {t('checkout.payment')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'SWISH', label: 'Swish', emoji: '📱', desc: 'Pay with Swish app' },
                    { value: 'CASH', label: 'Cash', emoji: '💵', desc: 'Pay at pickup' },
                  ].map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value={option.value}
                        className="sr-only"
                      />
                      <div
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === option.value
                            ? 'border-spice-500 bg-spice-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.emoji}</div>
                        <p className="font-semibold text-gray-900 text-sm">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Swish QR */}
                {paymentMethod === 'SWISH' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100"
                  >
                    <p className="text-sm font-medium text-blue-800 mb-3">
                      📱 {t('checkout.swishInstructions')}
                    </p>
                    <div className="flex justify-center">
                      <div className="w-48 h-48 bg-white rounded-xl shadow-sm overflow-hidden border border-blue-100">
                        <img
                          src="/swish-qr.png"
                          alt="Swish QR Code"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 text-center mt-3">
                      Scan with Swish app — Amount: <strong>SEK {total}</strong>
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Or pay to: <strong>+46 769677497</strong>
                    </p>
                  </motion.div>
                )}

                {paymentMethod === 'CASH' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100"
                  >
                    <p className="text-sm text-green-800">
                      💵 Please bring <strong>SEK {total}</strong> in cash for pickup. Exact change appreciated!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-spice-500" /> {t('checkout.orderSummary')}
                </h2>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.dish.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={item.dish.imageUrl || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop&auto=format'}
                          alt={item.dish.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop&auto=format';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.dish.name}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        SEK {item.dish.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="text-2xl font-bold text-gray-900">SEK {total}</span>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      {t('checkout.processing')}
                    </span>
                  ) : (
                    <>
                      {t('checkout.placeOrder')} <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  By placing an order, you agree to our pickup instructions
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
