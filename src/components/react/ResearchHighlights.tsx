import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';

type HighlightItem = {
  slug: string;
  title: string;
  category: string;
  thesis: string;
  href: string;
};

type Props = {
  items: HighlightItem[];
};

export default function ResearchHighlights({ items }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const active = useMemo(() => items[activeIndex] ?? items[0], [items, activeIndex]);

  if (!active) {
    return null;
  }

  return (
    <section className="card overflow-hidden">
      <div className="mb-5 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] transition-colors ${
              active.slug === item.slug
                ? 'bg-black text-white'
                : 'bg-black/5 text-[color:var(--muted)] hover:bg-black/10'
            }`}
          >
            {item.category}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.slug}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-4"
        >
          <p className="meta-label">Interactive spotlight</p>
          <h3 className="text-3xl">{active.title}</h3>
          <p className="text-[color:var(--muted)]">{active.thesis}</p>
          <a href={active.href} className="subtle-link text-sm">
            Open research page <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
