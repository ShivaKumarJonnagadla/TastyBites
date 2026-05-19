import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  description?: string;
  emoji?: string;
}

export default function EmptyState({
  title,
  description,
  emoji = '🍛',
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-7xl mb-6"
      >
        {emoji}
      </motion.div>
      <h3 className="text-2xl font-display font-bold text-gray-800 mb-3">
        {title || 'No dishes available'}
      </h3>
      <p className="text-gray-500 max-w-sm leading-relaxed">
        {description || t('menu.emptyState')}
      </p>
      <div className="mt-8 flex gap-3 text-4xl">
        {['🌶️', '🥘', '🫓', '🍚'].map((e, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          >
            {e}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
