import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useMemo, useRef, useState } from 'react';

type StoryItem = {
  id: string;
  title: string;
  caption: string;
  mediaSrc?: string;
  tag?: string;
  metric?: string;
};

type Props = {
  items: StoryItem[];
  heading?: string;
  intro?: string;
};

function isVideoAsset(src?: string): boolean {
  if (!src) return false;
  return src.endsWith('.mp4') || src.endsWith('.webm');
}

export default function StickyFigureStory({ items, heading, intro }: Props) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'end start']
  });
  const progressX = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const activeItem = useMemo(() => items[activeIndex] ?? items[0], [items, activeIndex]);

  if (!activeItem) {
    return null;
  }

  return (
    <section className="sticky-figure-story" ref={rootRef} aria-label="Sticky figure story">
      <div className="sticky-story-head">
        {heading ? <p className="meta-label">{heading}</p> : null}
        {intro ? <p className="sticky-story-intro">{intro}</p> : null}
      </div>

      {!reduceMotion ? (
        <div className="sticky-story-progress-track" aria-hidden="true">
          <motion.span className="sticky-story-progress-bar" style={{ width: progressX }} />
        </div>
      ) : null}

      <div className="sticky-story-grid">
        <div className="sticky-story-visual-wrap">
          <AnimatePresence mode="wait">
            <motion.figure
              key={activeItem.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.2, 0.82, 0.2, 1] }}
              className="sticky-story-visual"
            >
              <div className="sticky-story-media-shell">
                {activeItem.mediaSrc ? (
                  isVideoAsset(activeItem.mediaSrc) ? (
                    <video
                      className="sticky-story-media"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-label={activeItem.title}
                    >
                      <source src={activeItem.mediaSrc} />
                    </video>
                  ) : (
                    <img
                      src={activeItem.mediaSrc}
                      alt={activeItem.title}
                      loading="lazy"
                      decoding="async"
                      className="sticky-story-media"
                    />
                  )
                ) : (
                  <div className="sticky-story-placeholder" aria-hidden="true" />
                )}
              </div>

              <figcaption className="sticky-story-caption">
                {activeItem.tag ? <p className="figure-tag">{activeItem.tag}</p> : null}
                <p className="figure-title">{activeItem.title}</p>
                <p className="figure-copy">{activeItem.caption}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="sticky-story-steps">
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              className={`sticky-story-step ${activeIndex === index ? 'is-active' : ''}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ amount: 0.55, margin: '-12% 0px -12% 0px' }}
              transition={{ duration: 0.32 }}
              onViewportEnter={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocusCapture={() => setActiveIndex(index)}
              tabIndex={0}
            >
              <p className="meta-label">Step {index + 1}</p>
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
              {item.metric ? <p className="sticky-story-metric">{item.metric}</p> : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
