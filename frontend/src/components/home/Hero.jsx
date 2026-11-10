import { lazy, Suspense, useRef } from "react";
import { gsap, useGSAP, REDUCED_MOTION } from "../../lib/motion";
import { ButtonLink } from "../ui/Button";
import { AlleyScene } from "./AlleyScene";
import { HeroWindow } from "./HeroWindow";

// WebGL snow (React Bits "Pixel Snow") is loaded separately so it never delays the first paint.
const PixelSnow = lazy(() => import("../reactbits/PixelSnow"));

/**
 * Landing hero: the street at night. On load the windows light up, then the lamps
 * flicker on one by one, the headline rises, and the shop window's shutter lifts.
 * This is the page's one orchestrated moment — everything else stays still.
 */
export function Hero({ banners, fallbackImage }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`not ${REDUCED_MOTION}`, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".alley-win", {
          opacity: 0.04,
          duration: 0.6,
          stagger: { each: 0.004, from: "random" },
        })
          .from(
            ".alley-halo",
            {
              opacity: 0,
              scale: 0.4,
              transformOrigin: "50% 50%",
              duration: 0.5,
              ease: "rough({ strength: 2, points: 12, taper: 'out', randomize: true })",
              stagger: 0.16,
            },
            0.25,
          )
          .from(".hero-line", { yPercent: 110, duration: 1, stagger: 0.12 }, 0.35)
          .from(".hero-copy", { opacity: 0, y: 18, duration: 0.8, stagger: 0.1 }, 0.75)
          .from(".hero-window", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.3, ease: "power4.inOut" }, 0.5);

        // gentle parallax as the hero scrolls away: far buildings drift slower than the near row
        gsap.to(".alley-back", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-content", {
          yPercent: -8,
          opacity: 0.4,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-night text-moon">
      {/* sky glow + drifting fog */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_70%_0%,#2b3550_0%,#1c2230_45%,#141924_100%)]" />
      <div className="animate-fog pointer-events-none absolute -inset-x-20 bottom-[14%] -z-10 h-40 rounded-[50%] bg-moon/[0.05] blur-3xl" />

      {/* falling snow over the empty sky; flakes drift aside from the cursor */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Suspense fallback={null}>
          <PixelSnow
            color="#e9edf3"
            variant="round"
            density={0.32}
            speed={0.55}
            wind={0.18}
            sway={0.6}
            flakeSize={0.85}
            pixelSize={2}
            depth={0.75}
            glow={0.7}
            twinkle={0.3}
            opacity={0.8}
          />
        </Suspense>
      </div>

      {/* the street: height follows the width (no cropping) from md up; cropped at the sides on phones */}
      <AlleyScene className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[190px] w-full md:aspect-[3000/440] md:h-auto" />

      <div className="hero-content mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-4 pb-[170px] pt-12 md:pb-[calc(14.7vw+1rem)] sm:px-6 md:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8 lg:pt-10">
        <div className="max-w-2xl">
          <h1 id="hero-title" className="text-[clamp(3.25rem,8.5vw,7rem)] leading-[0.95]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="hero-line block">Every shop</span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="hero-line block">in one alley.</span>
            </span>
          </h1>
          <p className="hero-copy mt-7 max-w-lg text-lg leading-relaxed text-moon-soft md:text-xl">
            Electronics, fashion, beauty, home and more. Fill your cart, send the order on WhatsApp or email, and pay
            when it reaches your door.
          </p>
          <div className="hero-copy mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/shop">Shop all products</ButtonLink>
            <ButtonLink href="#alley" variant="outline-night">
              Browse the shops
            </ButtonLink>
          </div>
        </div>

        <div className="w-full max-w-[19rem] justify-self-center sm:max-w-xs lg:max-w-[19.5rem] lg:justify-self-end">
          <HeroWindow banners={banners} fallbackImage={fallbackImage} />
        </div>
      </div>
    </section>
  );
}
