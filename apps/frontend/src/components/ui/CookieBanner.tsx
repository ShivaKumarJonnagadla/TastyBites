import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent');
    if (!accepted) setTimeout(() => setShow(true), 2000);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50"
        >
          <div className="bg-white rounded-2xl shadow-warm-lg border border-gray-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <Cookie size={20} className="text-spice-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Privacy Notice</p>
                <p className="text-xs text-gray-500 leading-relaxed">{t('gdpr.message')}</p>
              </div>
              <button onClick={decline} className="text-gray-400 hover:text-gray-600 ml-auto">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={accept} className="btn-primary text-xs py-2 px-4 flex-1">
                {t('gdpr.accept')}
              </button>
              <button onClick={decline} className="btn-secondary text-xs py-2 px-4 flex-1">
                {t('gdpr.decline')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
