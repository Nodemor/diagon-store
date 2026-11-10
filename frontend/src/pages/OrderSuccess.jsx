import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { findRecentOrder } from "../lib/recentOrders";
import { useSettings } from "../context/SettingsContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatPrice, whatsappLink } from "../lib/format";
import { ButtonLink } from "../components/ui/Button";
import { CheckIcon, LinkIcon, WhatsAppIcon } from "../components/ui/icons";

// /order/success/:number — shown after POST /api/inquiries succeeds.
export default function OrderSuccess() {
  const { number } = useParams();
  const { state } = useLocation();
  const settings = useSettings();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const order = state?.order || findRecentOrder(number);
  usePageTitle(`Order ${number}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the number is on screen */
    }
  };

  const viaWhatsApp = order?.channel === "WHATSAPP";
  const helpLink = whatsappLink(settings.whatsappNumber, `Hello ${settings.storeName}, I have a question about my order ${number}.`);
  const trackUrl = `/track?number=${encodeURIComponent(number)}${order?.phone ? `&phone=${encodeURIComponent(order.phone)}` : ""}`;

  return (
    <section className="relative overflow-hidden bg-night text-moon">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full lamp-halo opacity-50" />
      <div className="relative mx-auto max-w-2xl px-4 pb-24 pt-16 text-center sm:px-6">
        <motion.div
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lamp text-night shadow-[0_0_60px_10px_rgb(242_181_68/0.35)]"
          initial={reduce ? false : { scale: 0.3, opacity: 0, rotate: -40 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <CheckIcon width={38} height={38} />
        </motion.div>

        <h1 className="mt-8 text-[clamp(2.6rem,7vw,4.5rem)]">Your order is in</h1>
        <p className="mx-auto mt-3 max-w-md text-moon-soft">
          {viaWhatsApp
            ? "WhatsApp should have opened with your order written out. Press send there so it reaches us."
            : "We've received your order. A copy is on its way to your email if you gave one."}{" "}
          We'll contact you to confirm availability and delivery. You pay in cash when it arrives.
        </p>

        <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-2xl border border-cobble-line bg-cobble/60 px-5 py-3">
          <span className="text-sm text-moon-soft">Order number</span>
          <span className="text-2xl font-semibold tabular-nums tracking-wide text-lamp-soft">{number}</span>
          <button type="button" onClick={copy} className="grid h-9 w-9 place-items-center rounded-full text-moon-soft hover:text-lamp" aria-label="Copy order number">
            {copied ? <CheckIcon width={18} height={18} /> : <LinkIcon width={18} height={18} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-moon-soft" aria-live="polite">{copied ? "Copied" : "Keep this number to track your order."}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {viaWhatsApp && order?.whatsappUrl && (
            <a
              href={order.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-night transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon width={20} height={20} /> Open WhatsApp to send
            </a>
          )}
          <ButtonLink to={trackUrl} variant={viaWhatsApp && order?.whatsappUrl ? "outline-night" : "lamp"}>
            Track this order
          </ButtonLink>
          <ButtonLink to="/shop" variant="outline-night">
            Keep shopping
          </ButtonLink>
        </div>

        {order?.items?.length > 0 && (
          <div className="mx-auto mt-14 max-w-md rounded-2xl bg-mist p-6 text-left text-ink">
            <h2 className="text-2xl">Order summary</h2>
            <ul className="mt-3 divide-y divide-ink/10 text-sm">
              {order.items.map((item) => (
                <li key={item.productName} className="flex justify-between gap-3 py-2.5">
                  <span>
                    {item.productName} <span className="text-ink-soft">× {item.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
              <span className="font-semibold">Estimated total</span>
              <span className="text-xl font-semibold tabular-nums">{formatPrice(order.estimatedTotal)}</span>
            </div>
          </div>
        )}

        {helpLink && !viaWhatsApp && (
          <p className="mt-8 text-sm text-moon-soft">
            Questions?{" "}
            <a href={helpLink} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-lamp">
              Message us on WhatsApp
            </a>
          </p>
        )}
        <p className="mt-4 text-sm text-moon-soft">
          <Link to="/" className="underline underline-offset-4 hover:text-lamp">Back to the home page</Link>
        </p>
      </div>
    </section>
  );
}
