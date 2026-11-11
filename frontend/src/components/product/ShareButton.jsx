import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, FacebookIcon, LinkIcon, ShareIcon, WhatsAppIcon } from "../ui/icons";

/**
 * Share a product (proposal §3 "Share product option"). Uses the phone's share sheet when available.
 * `url` should be the product's share link (/s/p/...), which shows a photo + price preview in chat apps.
 */
export function ShareButton({ title, text, url: shareUrl }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-fog";

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={share} aria-expanded={open} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
        <ShareIcon width={18} height={18} /> Share
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl bg-mist p-1.5 shadow-[0_20px_40px_-16px_rgb(28_34_48/0.4)] ring-1 ring-ink/10"
          >
            <button type="button" onClick={copy} className={item}>
              {copied ? <CheckIcon width={18} height={18} className="text-verdigris-deep" /> : <LinkIcon width={18} height={18} />}
              {copied ? "Link copied" : "Copy link"}
            </button>
            <a className={item} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon width={18} height={18} className="text-[#1f9e55]" /> Share on WhatsApp
            </a>
            <a className={item} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
              <FacebookIcon width={18} height={18} className="text-[#1877f2]" /> Share on Facebook
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
