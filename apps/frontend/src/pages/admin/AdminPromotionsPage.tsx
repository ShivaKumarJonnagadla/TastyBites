import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, MessageCircle, Image } from 'lucide-react';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminPromotionsPage() {
  const [whatsapp, setWhatsapp] = useState('');
  const [loadingWA, setLoadingWA] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [fridayDishes, setFridayDishes] = useState<{ name: string; price: number; category: string }[]>([]);

  const generateWhatsApp = async () => {
    setLoadingWA(true);
    try {
      const res = await adminApi.getWhatsAppMessage();
      setWhatsapp(res.data.data.message);
      toast.success('WhatsApp message generated!');
    } catch {
      toast.error('Failed to generate message');
    } finally {
      setLoadingWA(false);
    }
  };

  const generateFridayImage = async () => {
    setLoadingImg(true);
    try {
      const res = await adminApi.getFridayMenuImage();
      setFridayDishes(res.data.data.dishes || []);
      toast.success('Friday menu data loaded!');
    } catch {
      toast.error('Failed to load Friday menu');
    } finally {
      setLoadingImg(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(whatsapp);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Promotions</h1>
        <p className="text-gray-500 text-sm mt-0.5">Generate WhatsApp promotions and Friday menu images</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Generator */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <MessageCircle size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">WhatsApp Promotion</h2>
              <p className="text-xs text-gray-500">Auto-generate promotional message</p>
            </div>
          </div>

          <button
            onClick={generateWhatsApp}
            disabled={loadingWA}
            className="btn-primary w-full mb-4"
          >
            {loadingWA ? (
              <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            ) : (
              <><RefreshCw size={16} /> Generate Message</>
            )}
          </button>

          {whatsapp && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-3">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {whatsapp}
                </pre>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(whatsapp)}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  <Copy size={15} /> Copy Message
                </button>
                <button
                  onClick={openWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  <MessageCircle size={15} /> Send WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Friday Menu Image */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Image size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Friday Menu Preview</h2>
              <p className="text-xs text-gray-500">View Friday special menu</p>
            </div>
          </div>

          <button
            onClick={generateFridayImage}
            disabled={loadingImg}
            className="btn-primary w-full mb-4"
          >
            {loadingImg ? (
              <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            ) : (
              <><RefreshCw size={16} /> Load Friday Menu</>
            )}
          </button>

          {fridayDishes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Menu Card Preview */}
              <div className="border-2 border-spice-200 rounded-xl overflow-hidden mb-3">
                <div className="bg-spice-500 px-5 py-3 text-white text-center">
                  <p className="font-display font-bold text-lg tracking-widest">TASTY BITES</p>
                  <p className="text-xs font-medium tracking-wider text-spice-100">FOOD MENU — FRIDAY SPECIAL</p>
                </div>
                <div className="p-4 space-y-3">
                  {fridayDishes.map((d, i) => (
                    <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-900 text-sm">{d.name}</p>
                        <span className="text-spice-500 font-bold text-sm ml-2 flex-shrink-0">{d.price} kr</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-spice-50 px-5 py-2 text-center">
                  <p className="text-xs font-semibold text-spice-600">For Pre-orders WhatsApp: +46769677497</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Screenshot this card to share on social media
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📱 Promotion Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '📅', title: 'Best Time to Post', desc: 'Thursday evening for Friday orders. Lunch time for daily menu.' },
            { emoji: '🎯', title: 'Target Audience', desc: 'Share in local Indian community groups, Swedish food groups, and office WhatsApp chats.' },
            { emoji: '📸', title: 'Add Food Photos', desc: 'Attach real food photos for better engagement. Before/after cooking shots work great!' },
          ].map((tip) => (
            <div key={tip.title} className="flex gap-3">
              <span className="text-2xl">{tip.emoji}</span>
              <div>
                <p className="font-medium text-sm text-gray-900">{tip.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
