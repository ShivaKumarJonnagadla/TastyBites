import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart, Globe, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
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

  const scrollToSection = (id: string) => {
    const wasOpen = isOpen;
    setIsOpen(false);

    const doScroll = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const navbarHeight = 68;
      const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    if (location.pathname !== '/') {
      // Navigate to home first, then scroll after page loads
      navigate('/');
      setTimeout(doScroll, 500);
    } else if (wasOpen) {
      // Wait for mobile menu close animation to finish before scrolling
      setTimeout(doScroll, 350);
    } else {
      doScroll();
    }
  };

  const openStory = () => {
    setIsOpen(false);
    setShowStory(true);
  };

  const closeStory = () => {
    setShowStory(false);
    videoRef.current?.pause();
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), hash: null, action: null },
    { to: '/menu', label: t('nav.menu'), hash: null, action: null },
    { to: '/#friday-menu', label: t('nav.fridayMenu'), hash: 'friday-menu', action: null },
    { to: '/#reviews', label: t('nav.reviews'), hash: 'reviews', action: null },
    { to: '/#faq', label: t('nav.faq'), hash: 'faq', action: null },
    { to: '/#contact', label: t('nav.contact'), hash: 'contact', action: null },
    { to: '#our-story', label: t('nav.ourStory'), hash: null, action: openStory },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        scrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'
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
            {navLinks.map((link) => {
              const isActive = link.hash ? false : (!link.action && location.pathname === link.to);
              if (link.action) {
                return (
                  <button
                    key={link.to}
                    onClick={link.action}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 text-spice-600 hover:text-spice-700"
                  >
                    <Play size={13} className="fill-current" />
                    {link.label}
                  </button>
                );
              }
              if (link.hash) {
                return (
                  <button
                    key={link.to}
                    onClick={() => scrollToSection(link.hash!)}
                    className="text-sm font-medium transition-colors duration-200 text-gray-700 hover:text-spice-500"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-200 relative group ${
                  isActive ? 'text-spice-500' : 'text-gray-700 hover:text-spice-500'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-spice-500 rounded-full"
                  />
                )}
              </Link>
              );
            })}
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
              {navLinks.map((link) => {
                const isActive = link.hash ? false : (!link.action && location.pathname === link.to);
                if (link.action) {
                  return (
                    <button
                      key={link.to}
                      onClick={link.action}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors text-spice-600 hover:bg-spice-50"
                    >
                      <Play size={13} className="fill-current" />
                      {link.label}
                    </button>
                  );
                }
                if (link.hash) {
                  return (
                    <button
                      key={link.to}
                      onClick={() => scrollToSection(link.hash!)}
                      className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-spice-50 text-spice-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Our Story Video Modal */}
      <AnimatePresence>
        {showStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
            onClick={closeStory}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeStory}
                className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                aria-label="Close video"
              >
                <X size={20} />
              </button>
              <video
                ref={videoRef}
                src="/our-story.mp4"
                controls
                autoPlay
                className="w-full max-h-[80vh] bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
