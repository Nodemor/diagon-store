import { motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "../ui/icons";

// Customer-facing names for the order statuses (proposal §12).
export const STATUS_STEPS = [
  { status: "NEW", title: "Order received", text: "We have your order and will contact you soon." },
  { status: "CONTACTED", title: "We contacted you", text: "We've been in touch to check the details." },
  { status: "CONFIRMED", title: "Confirmed", text: "Your order is confirmed and reserved for you." },
  { status: "PROCESSING", title: "Packed and on the way", text: "Your order is being packed and delivered." },
  { status: "COMPLETED", title: "Delivered", text: "Delivered and paid on delivery. Enjoy!" },
];

export const STATUS_LABELS = Object.fromEntries([...STATUS_STEPS.map((s) => [s.status, s.title]), ["CANCELLED", "Cancelled"]]);

const dateFormat = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * Vertical status timeline. The lamp-coloured line fills up to the current step
 * and each reached step lights in turn, so the customer sees how far the order has come.
 */
export function StatusTimeline({ status, history = [] }) {
  const reduce = useReducedMotion();
  const cancelled = status === "CANCELLED";
  const current = cancelled ? -1 : STATUS_STEPS.findIndex((s) => s.status === status);
  const when = (s) => {
    const entry = [...history].reverse().find((h) => h.status === s);
    return entry ? dateFormat.format(new Date(entry.createdAt)) : null;
  };

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-oxblood/30 bg-oxblood/5 p-5">
        <p className="font-sign text-2xl text-oxblood">This order was cancelled</p>
        <p className="mt-1 text-sm text-ink-soft">
          {when("CANCELLED") ? `Cancelled on ${when("CANCELLED")}. ` : ""}If this is a surprise, message us and we'll help.
        </p>
      </div>
    );
  }

  const fill = current <= 0 ? 0 : (current / (STATUS_STEPS.length - 1)) * 100;

  return (
    <ol className="relative grid gap-7">
      {/* track + animated fill */}
      <span className="absolute bottom-5 left-[1.05rem] top-5 w-0.5 rounded bg-fog-deep" aria-hidden="true" />
      <motion.span
        className="absolute left-[1.05rem] top-5 w-0.5 origin-top rounded bg-lamp"
        style={{ height: "calc(100% - 2.5rem)" }}
        initial={{ scaleY: reduce ? fill / 100 : 0 }}
        animate={{ scaleY: fill / 100 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        aria-hidden="true"
      />

      {STATUS_STEPS.map((step, i) => {
        const reached = i <= current;
        const isCurrent = i === current;
        return (
          <li key={step.status} className="relative grid grid-cols-[2.2rem_1fr] gap-4" aria-current={isCurrent ? "step" : undefined}>
            <motion.span
              className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 ${
                reached ? "border-lamp bg-lamp text-night" : "border-fog-deep bg-mist text-ink-soft"
              }`}
              initial={reached && !reduce ? { scale: 0.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.22, type: "spring", stiffness: 420, damping: 22 }}
            >
              {reached ? <CheckIcon width={16} height={16} /> : <span className="text-xs font-semibold">{i + 1}</span>}
              {isCurrent && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-lamp/40" aria-hidden="true" />}
            </motion.span>
            <div className={reached ? "" : "opacity-55"}>
              <p className="font-semibold">
                {step.title}
                {isCurrent && <span className="sr-only"> (current status)</span>}
              </p>
              <p className="text-sm text-ink-soft">{isCurrent || !reached ? step.text : when(step.status) || "Done"}</p>
              {isCurrent && when(step.status) && <p className="mt-0.5 text-xs text-ink-soft">Updated {when(step.status)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
