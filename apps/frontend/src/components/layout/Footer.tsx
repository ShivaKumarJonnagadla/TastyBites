import { Link } from 'react-router-dom';
import { Heart, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-spice-gradient flex items-center justify-center text-white font-bold">
                TB
              </div>
              <div>
                <p className="font-display font-bold text-white text-lg">Tasty Bites</p>
                <p className="text-xs text-spice-400">Authentic Indian Food</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{t('footer.tagline')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/menu', label: t('nav.menu') },
                { to: '/checkout', label: 'Order Now' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-spice-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-semibold text-white mb-4">Find Us</h3>
            <p className="text-sm text-gray-400 mb-1">📍 Hjortvägen, Älmhult, Sweden</p>
            <a href="tel:+46769677497" className="text-sm text-gray-400 hover:text-spice-400 transition-colors">
              📞 +46 769677497
            </a>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.instagram.com/tastybites.almhult/"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-spice-500 transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/groups/1415819538679299/user/61578286531006/"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-spice-500 transition-colors"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://wa.me/46769677497"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {year} Tasty Bites. {t('footer.rights')}.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart size={14} className="text-spice-500" fill="currentColor" /> in Sweden
          </p>
        </div>
      </div>
    </footer>
  );
}
