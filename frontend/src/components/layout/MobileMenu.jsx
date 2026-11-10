import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, prefersReducedMotion } from "../../lib/motion";
import { useLenis } from "../motion/SmoothScroll";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../lib/format";
import { WhatsAppIcon } from "../ui/icons";

/**
 * Full-height mobile menu. Two coloured layers sweep in ahead of the panel and the
 * links rise in one after another (pattern inspired by React Bits "Staggered Menu").
 * Focus moves into the menu, Escape closes it, and page scrolling is paused while open.
 */
export function MobileMenu({ open, onClose, items, children }) {
  const root = useRef(null);
  const lenis = useLenis();
  const { whatsappNumber, storeName, phone } = useSettings();
  const wa = whatsappLink(whatsappNumber, `Hello ${storeName}, I have a question.`);

  // open / close animation
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const layers = el.querySelectorAll("[data-layer]");
    const lines = el.querySelectorAll("[data-line]");
    const extras = el.querySelectorAll("[data-extra]");
    const reduce = prefersReducedMotion();

    gsap.killTweensOf([layers, lines, extras, el]);

    if (open) {
      gsap.set(el, { visibility: "visible" });
      if (reduce) {
        gsap.set(layers, { xPercent: 0 });
        gsap.set([lines, extras], { yPercent: 0, opacity: 1 });
        return undefined;
      }
      const tl = gsap.timeline();
      tl.fromTo(layers, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: "power4.out", stagger: 0.08 })
        .fromTo(lines, { yPercent: 120 }, { yPercent: 0, duration: 0.7, ease: "power4.out", stagger: 0.07 }, "-=0.3")
        .fromTo(extras, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }, "-=0.45");
      return () => tl.kill();
    }

    if (reduce) {
      gsap.set(el, { visibility: "hidden" });
      return undefined;
    }
    const tl = gsap.timeline({ onComplete: () => gsap.set(el, { visibility: "hidden" }) });
    tl.to([...layers].reverse(), { xPercent: 100, duration: 0.4, ease: "power3.in", stagger: 0.06 });
    return () => tl.kill();
  }, [open]);

  // scroll lock, Escape, focus
  useEffect(() => {
    if (!open) return undefined;
    lenis?.stop();
    const previous = document.activeElement;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const first = root.current?.querySelector("a, input, button");
    requestAnimationFrame(() => first?.focus());
    return () => {
      lenis?.start();
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, lenis, onClose]);

  return (
    <div
      ref={root}
      id="mobile-menu"
      className="invisible fixed inset-0 top-16 z-30 md:top-[4.5rem] lg:hidden"
      aria-hidden={!open}
      inert={!open}
    >
      <button type="button" className="absolute inset-0 cursor-default bg-night-deep/40" onClick={onClose} aria-label="Close menu" tabIndex={-1} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md">
        <div data-layer className="absolute inset-0 bg-verdigris-deep" />
        <div data-layer className="absolute inset-0 bg-cobble" />
        <div data-layer className="absolute inset-0 flex flex-col overflow-y-auto bg-night-deep px-6 pb-10 pt-6 text-moon">
          <div data-extra>{children}</div>

          <nav aria-label="Mobile" className="mt-8">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href} className="overflow-hidden">
                  <Link
                    data-line
                    to={item.href}
                    onClick={onClose}
                    className="block py-1.5 font-sign text-[2.6rem] leading-tight text-moon transition-colors hover:text-lamp"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div data-extra className="mt-auto space-y-3 pt-10 text-sm text-moon-soft">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-lamp">
                <WhatsAppIcon width={18} height={18} className="text-[#25d366]" /> Chat with us on WhatsApp
              </a>
            )}
            {phone && <p>Call us on {phone}</p>}
            <p>Cash on delivery, island-wide.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
