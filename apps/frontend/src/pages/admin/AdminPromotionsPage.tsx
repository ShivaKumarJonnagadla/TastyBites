import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, MessageCircle, Image, Download, Share2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import {
  DELIVERY_LOCATIONS,
  FridayDish,
  FridayMenuResult,
  FRIDAY_ORDER_STORAGE_KEY,
  applySavedFridayOrder,
  downloadFridayMenu,
  generateFridayMenuImage,
  upcomingFridayDatetimeLocal,
} from '../../lib/fridayMenuImage';
import toast from 'react-hot-toast';

export default function AdminPromotionsPage() {
  const [whatsapp, setWhatsapp] = useState('');
  const [loadingWA, setLoadingWA] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [fridayImage, setFridayImage] = useState<FridayMenuResult | null>(null);
  const [locationId, setLocationId] = useState(DELIVERY_LOCATIONS[0].id);
  const [deliveryDateTime, setDeliveryDateTime] = useState(upcomingFridayDatetimeLocal);

  const generateWhatsApp = async () => {
    setLoadingWA(true);
    try {
      let order = '';
      try { order = (JSON.parse(localStorage.getItem(FRIDAY_ORDER_STORAGE_KEY) || '[]') as string[]).join(','); } catch { /* ignore */ }
      const res = await adminApi.getWhatsAppMessage({ order, locationId, deliveryDateTime });
      if (!res.data.data.dishCount) {
        toast.error('No available dishes are enabled for the Friday menu');
        return;
      }
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
      const dishes = applySavedFridayOrder<FridayDish>(res.data.data.dishes || []);
      if (dishes.length === 0) {
        toast.error('No available dishes are enabled for the Friday menu');
        return;
      }
      setFridayImage(await generateFridayMenuImage({ dishes, locationId, deliveryDateTime }));
      toast.success('Friday menu image generated!');
    } catch {
      toast.error('Failed to generate Friday menu image');
    } finally {
      setLoadingImg(false);
    }
  };

  const shareFridayImage = async () => {
    if (!fridayImage) return;
    const file = new File([fridayImage.blob], fridayImage.fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Tasty Bites Friday Menu — Week ${fridayImage.weekNum}` });
      } catch { /* user cancelled */ }
    } else {
      downloadFridayMenu(fridayImage);
      toast('Sharing isn\'t supported here — image downloaded instead');
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
        <p className="text-gray-500 text-sm mt-0.5">Generate WhatsApp promotions and the Friday menu image</p>
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
              <p className="text-xs text-gray-500">Friday menu message, ready to paste into WhatsApp</p>
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
              <h2 className="font-semibold text-gray-900">Friday Menu Image</h2>
              <p className="text-xs text-gray-500">Generate a shareable menu image for the upcoming Friday</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delivery location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input-field py-2 text-sm">
                {DELIVERY_LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delivery date &amp; time</label>
              <input type="datetime-local" value={deliveryDateTime} onChange={(e) => setDeliveryDateTime(e.target.value)} className="input-field py-2 text-sm" />
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
              <><RefreshCw size={16} /> Generate Friday Menu</>
            )}
          </button>

          {fridayImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <img
                src={fridayImage.dataUrl}
                alt={`Friday menu week ${fridayImage.weekNum}`}
                className="w-full rounded-xl border border-gray-200 mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => downloadFridayMenu(fridayImage)} className="btn-secondary flex-1 text-sm py-2.5">
                  <Download size={15} /> Download
                </button>
                <button
                  onClick={shareFridayImage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  <Share2 size={15} /> Share
                </button>
              </div>
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
