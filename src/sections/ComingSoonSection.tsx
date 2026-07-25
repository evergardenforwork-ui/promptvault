import React from 'react';
import { motion } from 'motion/react';
import { MediaType } from '../types';

const SECTION_CONFIG: Record<
  Exclude<MediaType, 'photo'>,
  { icon: string; title: string; description: string; examples: string[] }
> = {
  video: {
    icon: '🎬',
    title: 'Видео промпты',
    description: 'Промпты для генерации видео: Sora, Kling, Runway, Pika и другие.',
    examples: ['Кинематографический полёт над городом', 'Портрет с медленным зумом', 'Анимация логотипа'],
  },
  text: {
    icon: '📝',
    title: 'Текстовые промпты',
    description: 'Промпты для языковых моделей: ChatGPT, Claude, Gemini, Mistral.',
    examples: ['Системный промпт для ассистента', 'Шаблон для написания кода', 'Генерация структуры статьи'],
  },
  music: {
    icon: '🎵',
    title: 'Музыкальные промпты',
    description: 'Промпты для генерации музыки: Suno, Udio, MusicGen.',
    examples: ['Эпический оркестровый саундтрек', 'Lo-fi хип-хоп для фона', 'Электронный дроп 140 BPM'],
  },
};

interface ComingSoonSectionProps {
  mediaType: Exclude<MediaType, 'photo'>;
}

export default function ComingSoonSection({ mediaType }: ComingSoonSectionProps) {
  const config = SECTION_CONFIG[mediaType];

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
          className="text-8xl mb-8 select-none"
        >
          {config.icon}
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-400/10 border border-sky-400/20 rounded-full text-sky-400 text-xs font-black uppercase tracking-widest mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Скоро
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-4xl font-black tracking-tighter text-white mb-4"
        >
          {config.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 text-base leading-relaxed mb-10"
        >
          {config.description}
        </motion.p>

        {/* Example prompts preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
            Примеры промптов
          </p>
          {config.examples.map((example, i) => (
            <motion.div
              key={example}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.5, x: 0 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              className="px-5 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl text-sm text-zinc-500 font-medium text-left blur-[0.5px] select-none"
            >
              {example}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
