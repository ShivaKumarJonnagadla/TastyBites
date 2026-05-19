import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { totalItems, openCart } = useCartStore();
  const itemCount = totalItems();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'sv' : 'en');
  const isEnglish = i18n.language === 'en';

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/menu', label: t('nav.menu') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Tasty Bites"
              className="h-12 w-12 object-contain rounded-full"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                img.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback text logo */}
            <div className="hidden w-10 h-10 rounded-full bg-spice-gradient flex items-center justify-center text-white font-bold text-lg shadow-warm">
              TB
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-bold text-gray-900 leading-tight text-lg">
                Tasty Bites
              </p>
              <p className="text-xs text-spice-500 font-medium leading-none">Authentic Indian Food</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-200 relative group ${
                  location.pathname === link.to ? 'text-spice-500' : 'text-gray-700 hover:text-spice-500'
                }`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-spice-500 rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle — shows current language, click to switch */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white/80 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              aria-label={`Switch to ${isEnglish ? 'Swedish' : 'English'}`}
              title={`Switch to ${isEnglish ? 'Svenska' : 'English'}`}
            >
              <Globe size={13} className="text-gray-500" />
              <span className={`font-bold ${isEnglish ? 'text-spice-500' : 'text-gray-400'}`}>EN</span>
              <span className="text-gray-300">|</span>
              <span className={`font-bold ${!isEnglish ? 'text-spice-500' : 'text-gray-400'}`}>SV</span>
            </button>

            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl text-gray-700 hover:text-spice-500 hover:bg-spice-50 transition-all duration-200"
              aria-label="Open cart"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-spice-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-spice-50 text-spice-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
