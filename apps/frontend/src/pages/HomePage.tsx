import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ChevronDown, Phone, Clock, MapPin, MessageCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dishApi } from '../lib/api';
import MenuSection from '../components/menu/MenuSection';
import { GREETING_MESSAGES, MARKETING_MESSAGES } from '../lib/constants';

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

const testimonials = [
  { name: 'Vijaya Venkatesan', text: 'Ordered biryani and it was excellent! Exactly the taste of home cooked food. Will definitely order again.', rating: 5, avatar: '👩🏽' },
  { name: 'Ashok Kumar', text: 'Authentic South Indian taste. The food was fresh, flavorful and reminded me of home. Great service!', rating: 5, avatar: '👨🏽' },
  { name: 'Priya Sundaram', text: 'Amazing food! The Chettinadu fish curry was outstanding. So happy to find authentic Indian food here in Älmhult!', rating: 5, avatar: '👩🏽' },
  { name: 'Rajesh Narayanan', text: 'Best Indian food in Älmhult. The biryani and curries are just like back home. Highly recommended!', rating: 5, avatar: '👨🏽' },
];

const faqs = [
  { q: 'How do I place an order?', a: 'Browse our menu, add items to your cart, and proceed to checkout. Enter your name, mobile number and email, choose your payment method, and confirm your order.' },
  { q: 'How do I pay?', a: 'We accept Swish (scan the QR code) and Cash. Pay when you pick up your food.' },
  { q: 'Where do I pick up my order?', a: 'We are a cloud kitchen based in Hjortvägen, Älmhult. Pickup details are shared in your order confirmation.' },
  { q: 'Do you do party or office orders?', a: 'Yes! We undertake party, office lunch & dinner orders. WhatsApp us at +46 769677497 to discuss.' },
  { q: 'Is the food halal?', a: 'Yes! All our meat dishes are prepared with halal certified ingredients.' },
  { q: 'Do you have vegetarian options?', a: 'Absolutely! We have a wide range of South Indian vegetarian dishes. Look for the green leaf icon.' },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [dailyDishes, setDailyDishes] = useState<Dish[]>([]);
  const [fridayDishes, setFridayDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [marketingIdx, setMarketingIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const msgs = GREETING_MESSAGES[i18n.language as 'en' | 'sv'] || GREETING_MESSAGES.en;
    setGreeting(msgs[Math.floor(Math.random() * msgs.length)]);
  }, [i18n.language]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketingIdx((prev) => (prev + 1) % MARKETING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setLoading(true);
        const [dailyRes, fridayRes] = await Promise.all([
          dishApi.getAll({ menuType: 'DAILY', isAvailable: 'true' }),
          dishApi.getAll({ menuType: 'FRIDAY', isAvailable: 'true' }),
        ]);
        setDailyDishes(dailyRes.data.data || []);
        setFridayDishes(fridayRes.data.data || []);
      } catch {
        // Show empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchDishes();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 bg-gray-950" />
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=80"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/60" />

        {/* Floating food emojis */}
        {['🍛', '🌶️', '🫓', '🥘', '🌿', '✨'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl select-none pointer-events-none"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 2) * 60}%`,
            }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          >
            {emoji}
          </motion.div>
        ))}

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-5 py-2 rounded-full border border-white/30">
              {greeting}
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight"
          >
            Tasty{' '}
            <span className="text-turmeric-300">Bites</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl text-white/90 font-light mb-3"
          >
            {t('hero.tagline')}
          </motion.p>

          {/* Rotating marketing message */}
          <motion.div
            key={marketingIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-base text-white/70 italic mb-10 h-6"
          >
            "{MARKETING_MESSAGES[marketingIdx]}"
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-spice-500 text-white hover:bg-spice-600 transition-all shadow-warm-lg"
            >
              {t('hero.cta')} <ArrowRight size={20} />
            </Link>
            <a
              href="https://wa.me/46769677497"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white border-2 border-white/40 hover:bg-white/10 transition-all"
            >
              <Phone size={18} /> WhatsApp Us
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* Welcome Banner */}
      <section className="bg-turmeric-50 border-y border-turmeric-100">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl font-display font-semibold text-gray-800 mb-3">
              🙏 Taste of home with a touch of tradition
            </p>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-4">
              Experience the taste of India right here in Älmhult! At Tasty Bites, we serve home-cooked,
              flavorful, and authentic Indian meals made with love and traditional recipes. From aromatic
              Chicken Biryani and South Indian breakfasts like Idly, Pongal &amp; Vada, to hearty South
              Indian meals and delicious Chettinadu Fish curry — every dish is a celebration of Indian cuisine.
            </p>
            <p className="text-spice-600 font-semibold text-sm mb-6">
              ✨ One bite and you'll feel like you're in India!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
              {[['🥘', 'Home-cooked'], ['🌶️', 'Authentic Spices'], ['💚', 'Halal Certified'], ['📦', 'Pickup & Delivery'], ['🎉', 'Party Orders']].map(([emoji, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 shadow-sm">
              <span>📍</span> Hjortvägen, Älmhult, Sweden &nbsp;·&nbsp;
              <a href="tel:+46769677497" className="text-spice-500 font-semibold hover:underline">+46 769677497</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Daily Menu */}
      <MenuSection
        title={t('menu.daily')}
        subtitle="Fresh dishes available every day"
        dishes={dailyDishes}
        isLoading={loading}
        emoji="☀️"
      />

      {/* Friday Menu */}
      <div className="bg-gradient-to-b from-amber-50 to-white">
        <MenuSection
          title={t('menu.friday')}
          subtitle="Special dishes available every Friday"
          dishes={fridayDishes}
          isLoading={loading}
          emoji="🎉"
        />
      </div>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Loved by Indian and Swedish food lovers alike</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={12} className="text-turmeric-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="section-title">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} className="text-spice-500 flex-shrink-0" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-gray-600 leading-relaxed text-sm">{faq.a}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Banner — special notes */}
      <section className="py-10 bg-gradient-to-r from-spice-600 to-spice-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 justify-center mb-6">
              <Info size={20} className="text-white" />
              <h2 className="text-xl font-display font-bold text-white">Good to Know</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { emoji: '🍽️', text: 'Indian dishes of your choice can be prepared on request, even if not on the menu' },
                { emoji: '2️⃣', text: 'Minimum order quantity for any dish is 2 portions' },
                { emoji: '🎉', text: 'We undertake party, office lunch & dinner orders' },
                { emoji: '🎂', text: 'We also take custom cake orders for birthday parties' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center"
                >
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <p className="text-white text-sm leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hours & Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="section-title">Find Us & Contact</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hours */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-spice-100 rounded-lg flex items-center justify-center">
                  <Clock size={18} className="text-spice-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Hours of Operation</h3>
              </div>
              <div className="space-y-2">
                {[
                  ['Monday', '09:00 – 17:00'],
                  ['Tuesday', '09:00 – 17:00'],
                  ['Wednesday', '09:00 – 17:00'],
                  ['Thursday', '09:00 – 17:00'],
                  ['Friday', '09:00 – 17:00'],
                  ['Saturday', '09:00 – 17:00'],
                  ['Sunday', '09:00 – 17:00'],
                ].map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600 font-medium">{day}</span>
                    <span className="text-sm font-semibold text-spice-600 bg-spice-50 px-3 py-0.5 rounded-full">{hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 bg-spice-100 rounded-lg flex items-center justify-center">
                    <MapPin size={18} className="text-spice-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Our Location</h3>
                </div>
                <p className="text-gray-700 font-medium mb-1">Hjortvägen, Älmhult, Sweden</p>
                <p className="text-sm text-gray-500">We are a home kitchen — pickup details will be shared in your order confirmation.</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle size={18} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Contact Us</h3>
                </div>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/46769677497"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
                  >
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-sm font-semibold text-green-800">WhatsApp</p>
                      <p className="text-sm text-green-700">+46 769677497</p>
                    </div>
                  </a>
                  <a
                    href="tel:+46769677497"
                    className="flex items-center gap-3 p-3 bg-spice-50 rounded-xl border border-spice-100 hover:bg-spice-100 transition-colors"
                  >
                    <Phone size={20} className="text-spice-600 ml-1" />
                    <div>
                      <p className="text-sm font-semibold text-spice-800">Call Us</p>
                      <p className="text-sm text-spice-700">+46 769677497</p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(194,24,91,0.15)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Ready to taste India? 🇮🇳
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Order now and experience authentic homemade Indian flavors
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-spice-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-spice-600 transition-all shadow-warm-lg text-lg"
            >
              View Full Menu <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
