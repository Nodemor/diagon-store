import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, REDUCED_MOTION, ScrollTrigger } from "../../lib/motion";
import { imageAt } from "../../lib/format";
import { useLenis } from "../motion/SmoothScroll";
import { Img } from "../ui/Img";

// Each category is drawn as a shopfront on the street (proposal §3 "Product categories").
// Desktop: exactly four shopfronts fill the content width. The section pins and each
// scroll step walks one "page" of four sideways, snapping into place; signs swing with speed.
// Mobile / reduced motion: a normal horizontal swipe row.

const PER_PAGE = 4;
const GAP_REM = 1.5; // gap-6

const FACADES = [
  { wall: "#2f6f68", roof: "#22504b" }, // verdigris
  { wall: "#4a3550", roof: "#36263b" }, // plum
  { wall: "#5b2a32", roof: "#431f25" }, // oxblood
  { wall: "#2b3a55", roof: "#1f2a3e" }, // midnight blue
  { wall: "#5a4a2e", roof: "#423620" }, // bronze
];

function Shopfront({ category, index }) {
  const facade = FACADES[index % FACADES.length];
  const count = category.productCount;

  return (
    <Link
      to={`/category/${category.slug}`}
      className="shopfront group block w-[76vw] max-w-76 shrink-0 snap-center sm:w-72 lg:w-[calc((100%-4.5rem)/4)] lg:max-w-none"
      aria-label={`${category.name}, ${count} product${count === 1 ? "" : "s"}`}
    >
      {/* roof */}
      <div
        className="-mx-2 h-11"
        style={{ background: facade.roof, clipPath: "polygon(4% 100%, 50% 0, 96% 100%)" }}
        aria-hidden="true"
      />
      <div className="relative rounded-b-lg px-5 pb-5 pt-4 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]" style={{ background: facade.wall }}>
        {/* hanging sign */}
        <div className="shop-sign relative mx-auto w-fit origin-top" aria-hidden="true">
          <div className="mx-auto flex w-24 justify-between">
            <span className="h-3.5 w-px bg-moon-soft/60" />
            <span className="h-3.5 w-px bg-moon-soft/60" />
          </div>
          <div className="rounded-md border border-lamp/40 bg-night-deep px-4 py-1.5 text-center shadow-lg">
            <span className="block whitespace-nowrap font-sign text-[clamp(1.1rem,1.45vw,1.4rem)] leading-tight text-lamp-soft">{category.name}</span>
          </div>
        </div>

        {/* shop window — the lights come on when you hover / focus */}
        <div className="relative mt-4 aspect-3/4 w-full overflow-hidden rounded-t-full border-[6px] border-night-deep/80 bg-night-deep lg:max-h-[38svh]">
          {category.imageUrl && (
            <Img
              src={imageAt(category.imageUrl, 600)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.55] saturate-[0.7] transition-[filter,transform] duration-700 ease-alley group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100 group-focus-visible:brightness-100"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-lamp/25 via-transparent to-transparent opacity-60 mix-blend-screen transition-opacity duration-700 group-hover:opacity-100" />
        </div>

        <div className="mt-3.5 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-moon/80">
            {count} product{count === 1 ? "" : "s"}
          </span>
          <span className="font-semibold text-moon underline decoration-moon/30 underline-offset-4 transition-colors group-hover:text-lamp group-hover:decoration-lamp">
            Step inside
          </span>
        </div>
      </div>
    </Link>
  );
}

const Chevron = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={d} />
  </svg>
);

const NAV_BUTTON =
  "grid h-11 w-11 place-items-center rounded-full border border-cobble-line text-moon transition-colors hover:border-lamp hover:text-lamp disabled:opacity-35 disabled:hover:border-cobble-line disabled:hover:text-moon";

export function CategoryAlley({ categories = [] }) {
  const section = useRef(null);
  const track = useRef(null);
  const bar = useRef(null);
  const triggerRef = useRef(null);
  const lenis = useLenis();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(categories.length / PER_PAGE));

  useGSAP(
    () => {
      if (pages < 2) return undefined;
      const mm = gsap.matchMedia();

      mm.add(`(min-width: 1024px) and (not ${REDUCED_MOTION})`, () => {
        const el = track.current;
        const gap = () => parseFloat(getComputedStyle(document.documentElement).fontSize) * GAP_REM;
        const pageWidth = () => el.clientWidth + gap();
        const headerHeight = () => document.querySelector("header")?.offsetHeight || 0;
        // scroll distance per page: most of a screen, so one wheel flick ≈ one page
        const stepLength = () => window.innerHeight * 0.75;

        const signs = gsap.utils.toArray(".shop-sign", el);
        const swing = gsap.quickTo(signs, "rotation", { duration: 0.6, ease: "power3.out" });
        let settle;

        const tween = gsap.to(el, {
          x: () => -(pages - 1) * pageWidth(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: () => `top ${headerHeight()}px`,
            end: () => `+=${(pages - 1) * stepLength()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            snap: { snapTo: 1 / (pages - 1), directional: false, duration: { min: 0.25, max: 0.6 }, ease: "power2.inOut", delay: 0.05 },
            onUpdate: (self) => {
              gsap.set(bar.current, { xPercent: self.progress * (pages - 1) * 100 });
              setPage(Math.round(self.progress * (pages - 1)));
              swing(gsap.utils.clamp(-8, 8, -self.getVelocity() / 260));
              settle?.kill();
              settle = gsap.delayedCall(0.15, () => swing(0));
            },
          },
        });
        triggerRef.current = tween.scrollTrigger;

        return () => {
          triggerRef.current = null;
        };
      });

      return () => mm.revert();
    },
    { scope: section, dependencies: [categories.length] },
  );

  /** Previous / next buttons: scroll to the matching point of the pinned section. */
  const goTo = (target) => {
    const next = Math.max(0, Math.min(pages - 1, target));
    const st = triggerRef.current;
    if (!st) return;
    const y = st.start + (st.end - st.start) * (next / (pages - 1));
    if (lenis) lenis.scrollTo(y, { duration: 1 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (!categories.length) return null;

  const from = page * PER_PAGE + 1;
  const to = Math.min(categories.length, from + PER_PAGE - 1);

  return (
    <section
      ref={section}
      id="alley"
      aria-labelledby="alley-title"
      className="relative overflow-hidden bg-night text-moon lg:h-[calc(100svh-4.5rem)]"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-night-deep to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <h2 id="alley-title" className="text-[2.5rem] md:text-6xl">
              Browse the shops
            </h2>
            <p className="mt-3 max-w-md text-moon-soft">Every shopfront on the street is a category. Step inside any of them.</p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              to="/shop"
              className="text-sm font-semibold text-moon underline decoration-moon/30 underline-offset-4 hover:text-lamp hover:decoration-lamp"
            >
              See every product
            </Link>
            {pages > 1 && (
              <div className="hidden items-center gap-2 lg:flex">
                <span className="mr-1 text-sm tabular-nums text-moon-soft" aria-live="polite">
                  Shops {from}–{to} of {categories.length}
                </span>
                <button type="button" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous shops" className={NAV_BUTTON}>
                  <Chevron d="M15 6l-6 6 6 6" />
                </button>
                <button type="button" onClick={() => goTo(page + 1)} disabled={page === pages - 1} aria-label="Next shops" className={NAV_BUTTON}>
                  <Chevron d="M9 6l6 6-6 6" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* the street — clipped to the content width on desktop so the shops line up with the heading */}
        <div className="-mx-4 mt-10 sm:-mx-6 lg:mx-0 lg:mt-12 lg:[clip-path:inset(-80px_0_-80px_0)]">
          <div
            ref={track}
            className="no-scrollbar flex snap-x snap-mandatory items-end gap-6 overflow-x-auto px-4 pb-6 sm:px-6 lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {categories.map((category, index) => (
              <Shopfront key={category.id} category={category} index={index} />
            ))}
          </div>
        </div>

        {pages > 1 && (
          <div className="mt-8 hidden h-[3px] overflow-hidden rounded-full bg-cobble lg:block" aria-hidden="true">
            <div ref={bar} className="h-full rounded-full bg-lamp" style={{ width: `${100 / pages}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}

// Re-measure pinned sections once web fonts have loaded (sign widths change)
if (typeof document !== "undefined" && document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
