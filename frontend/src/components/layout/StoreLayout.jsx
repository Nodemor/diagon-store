import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSettings } from "../../context/SettingsContext";
import { scrollToTop, useLenis } from "../motion/SmoothScroll";
import { ScrollTrigger } from "../../lib/motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * Storefront shell: announcement, header, animated page area, footer, WhatsApp button.
 * Pages cross-fade between routes; the outgoing page is frozen with useOutlet().
 */
export function StoreLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const lenis = useLenis();
  const reduce = useReducedMotion();
  const { announcement } = useSettings();

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only z-60 rounded-full bg-lamp px-4 py-2 font-semibold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {announcement && (
        <p className="bg-night-deep px-4 py-2 text-center text-[0.8rem] text-moon-soft">{announcement}</p>
      )}

      <Header />

      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          scrollToTop(lenis);
          ScrollTrigger.refresh();
        }}
      >
        <motion.main
          id="main"
          key={location.pathname}
          className="flex-1"
          // no filter/lingering transform here: they would break GSAP pinning inside pages
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduce ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
