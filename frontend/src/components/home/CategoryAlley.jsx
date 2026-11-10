import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, REDUCED_MOTION } from "../../lib/motion";
import { imageAt } from "../../lib/format";

// Each category is drawn as a shopfront on the street (proposal §3 "Product categories").
// Desktop: the section pins and scrolling walks you sideways past the shops; signs swing with your speed.
// Mobile / reduced motion: a normal horizontal swipe row.

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
      className="shopfront group block w-[76vw] max-w-[19rem] shrink-0 snap-center sm:w-[18rem] lg:w-[19rem]"
      aria-label={`${category.name} — ${count} product${count === 1 ? "" : "s"}`}
    >
      {/* roof */}
      <div
        className="mx-[-10px] h-12"
        style={{ background: facade.roof, clipPath: "polygon(4% 100%, 50% 0, 96% 100%)" }}
        aria-hidden="true"
      />
      <div className="relative rounded-b-lg px-5 pb-6 pt-5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]" style={{ background: facade.wall }}>
        {/* hanging sign */}
        <div className="shop-sign relative mx-auto w-fit origin-top" aria-hidden="true">
          <div className="mx-auto flex w-24 justify-between">
            <span className="h-4 w-px bg-moon-soft/60" />
            <span className="h-4 w-px bg-moon-soft/60" />
          </div>
          <div className="rounded-md border border-lamp/40 bg-night-deep px-5 py-2 text-center shadow-lg">
            <span className="font-sign text-[1.55rem] leading-tight text-lamp-soft">{category.name}</span>
          </div>
        </div>

        {/* shop window — lights come on when you hover / focus */}
        <div className="relative mt-5 aspect-[3/4] overflow-hidden rounded-t-full border-[6px] border-night-deep/80 bg-night-deep">
          {category.imageUrl && (
            <img
              src={imageAt(category.imageUrl, 600)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.55] saturate-[0.7] transition-[filter,transform] duration-700 ease-alley group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100 group-focus-visible:brightness-100"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-lamp/25 via-transparent to-transparent mix-blend-screen opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
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

export function CategoryAlley({ categories = [] }) {
  const section = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      if (!categories.length) return undefined;
      const mm = gsap.matchMedia();

      mm.add(`(min-width: 1024px) and (not ${REDUCED_MOTION})`, () => {
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
        const headerHeight = () => document.querySelector("header")?.offsetHeight || 0;
        if (distance() <= 0) return;

        const signs = gsap.utils.toArray(".shop-sign");
        const swing = gsap.quickTo(signs, "rotation", { duration: 0.6, ease: "power3.out" });
        let settle;

        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: () => `top ${headerHeight()}px`,
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            // signs swing against the direction of travel, then settle
            onUpdate: (self) => {
              swing(gsap.utils.clamp(-9, 9, -self.getVelocity() / 260));
              settle?.kill();
              settle = gsap.delayedCall(0.15, () => swing(0));
            },
          },
        });
      });

      return () => mm.revert();
    },
    { scope: section, dependencies: [categories.length] },
  );

  if (!categories.length) return null;

  return (
    <section
      ref={section}
      id="alley"
      aria-labelledby="alley-title"
      className="relative overflow-hidden bg-night text-moon lg:h-[calc(100svh-4.5rem)]"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-night-deep to-transparent" />
      <div className="relative flex h-full flex-col justify-center py-20 lg:py-0">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="alley-title" className="text-[2.5rem] md:text-6xl">
            Browse the shops
          </h2>
          <p className="mt-3 max-w-md text-moon-soft">
            Every shopfront on the street is a category. Step inside any of them.
          </p>
        </div>

        <div
          ref={track}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory items-end gap-5 overflow-x-auto px-4 pb-6 sm:gap-7 sm:px-6 lg:mt-12 lg:w-max lg:snap-none lg:overflow-visible lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pb-0"
        >
          {categories.map((category, index) => (
            <Shopfront key={category.id} category={category} index={index} />
          ))}
          <Link
            to="/shop"
            className="grid w-[60vw] max-w-[15rem] shrink-0 snap-center place-items-center self-stretch rounded-lg border border-dashed border-cobble-line text-center transition-colors hover:border-lamp hover:text-lamp sm:w-[15rem]"
          >
            <span className="px-6 font-sign text-3xl">See every product</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
