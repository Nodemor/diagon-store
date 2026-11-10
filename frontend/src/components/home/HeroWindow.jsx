import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { imageAt } from "../../lib/format";

const ROTATE_MS = 6500;

/**
 * Arched shop window showing the admin-managed hero banners (proposal §15).
 * Rotates automatically (paused on hover/focus and for reduced motion).
 */
export function HeroWindow({ banners = [], fallbackImage }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const slides = banners.length
    ? banners
    : [{ id: "fallback", title: "New arrivals every week", subtitle: "Fresh finds land in the alley all the time.", imageUrl: fallbackImage, buttonText: "See what's new", buttonLink: "/shop?newArrival=true" }];
  const slide = slides[index % slides.length];

  useEffect(() => {
    if (slides.length < 2 || paused || reduce) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [slides.length, paused, reduce]);

  const isExternal = slide.buttonLink && /^https?:\/\//.test(slide.buttonLink);

  return (
    <div
      className="hero-window relative mx-auto w-full max-w-md lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* window frame */}
      <div className="relative rounded-t-full border-[10px] border-cobble bg-night-deep p-2 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8),inset_0_0_0_1px_rgb(242_181_68/0.25)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-full">
          <AnimatePresence initial={false}>
            {slide.imageUrl && (
              <motion.img
                key={slide.id}
                src={imageAt(slide.imageUrl, 900)}
                alt=""
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </AnimatePresence>
          {/* warm glass + mullions */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-night/70 via-transparent to-lamp/10" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2 bg-cobble/90" />
          <div className="pointer-events-none absolute inset-x-0 top-[38%] h-[6px] bg-cobble/90" />
          {slides.length > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1" role="group" aria-label="Choose banner">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show banner ${i + 1} of ${slides.length}`}
                  aria-current={i === index % slides.length}
                  className="group grid h-8 w-8 place-items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ${i === index % slides.length ? "w-6 bg-lamp" : "w-1.5 bg-moon-soft/50 group-hover:bg-moon-soft"}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* sill */}
      <div className="mx-[-14px] h-4 rounded-sm bg-cobble shadow-[0_8px_20px_-6px_rgb(0_0_0/0.6)]" />

      {/* banner caption */}
      <div className="mt-5 min-h-[7.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-sign text-3xl text-moon">{slide.title}</p>
            {slide.subtitle && <p className="mt-1.5 max-w-sm text-sm text-moon-soft">{slide.subtitle}</p>}
            {slide.buttonText && slide.buttonLink && (
              isExternal ? (
                <a href={slide.buttonLink} className="mt-3 inline-block text-sm font-semibold text-lamp underline decoration-lamp/40 underline-offset-4 hover:decoration-lamp">
                  {slide.buttonText}
                </a>
              ) : (
                <Link to={slide.buttonLink} className="mt-3 inline-block text-sm font-semibold text-lamp underline decoration-lamp/40 underline-offset-4 hover:decoration-lamp">
                  {slide.buttonText}
                </Link>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
