import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../../lib/motion";

// Smooth scrolling for the whole storefront, kept in sync with GSAP ScrollTrigger.
// Disabled when the visitor prefers reduced motion (native scrolling is used instead).
const LenisContext = createContext(null);

export function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const instance = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenisRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLenis = () => useContext(LenisContext);

/** Scroll to the top instantly (used between page transitions). */
// eslint-disable-next-line react-refresh/only-export-components
export function scrollToTop(lenis) {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
