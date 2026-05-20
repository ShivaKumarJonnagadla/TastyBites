import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallBanner() {
  const { install, dismiss, isIOS, showBanner } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
          >
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img src="/logo.png" alt="Tasty Bites" className="w-full h-full object-cover" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">Install Tasty Bites</p>
                  <p className="text-xs text-gray-500 truncate">
                    Add to home screen for quick access
                  </p>
                </div>

                {/* Action */}
                {isIOS ? (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="flex items-center gap-1.5 bg-spice-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-spice-600 transition-colors flex-shrink-0"
                  >
                    <Share size={14} />
                    How to
                  </button>
                ) : (
                  <button
                    onClick={install}
                    className="flex items-center gap-1.5 bg-spice-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-spice-600 transition-colors flex-shrink-0"
                  >
                    <Download size={14} />
                    Install
                  </button>
                )}

                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Step-by-step Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Tasty Bites" className="w-12 h-12 rounded-xl shadow-sm" />
                <div>
                  <p className="font-bold text-gray-900">Install Tasty Bites</p>
                  <p className="text-xs text-gray-500">Add to your iPhone home screen</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  {
                    step: '1',
                    icon: '⬆️',
                    text: 'Tap the Share button',
                    sub: 'The box with an arrow at the bottom of Safari',
                  },
                  {
                    step: '2',
                    icon: '➕',
                    text: 'Tap "Add to Home Screen"',
                    sub: 'Scroll down in the share sheet to find it',
                  },
                  {
                    step: '3',
                    icon: '✅',
                    text: 'Tap "Add"',
                    sub: 'The app icon will appear on your home screen',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-spice-50 border-2 border-spice-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowIOSGuide(false); dismiss(); }}
                className="w-full py-3 bg-spice-500 text-white font-bold rounded-xl hover:bg-spice-600 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
