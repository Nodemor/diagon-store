import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { trackInquiry } from "../services/store";
import { useSettings } from "../context/SettingsContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatPrice, imageAt, whatsappLink } from "../lib/format";
import { getRecentOrders } from "../lib/recentOrders";
import { StatusTimeline, STATUS_LABELS } from "../components/order/StatusTimeline";
import { Button } from "../components/ui/Button";
import { WhatsAppIcon } from "../components/ui/icons";
import { Img } from "../components/ui/Img";

// /track — order tracking with the order number + the mobile number used (COD tracking).

const dateFormat = new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric" });

export default function Track() {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const recent = useMemo(getRecentOrders, []);
  const [number, setNumber] = useState(params.get("number") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [state, setState] = useState({ loading: false, order: null, error: null });
  usePageTitle("Track an order", { noindex: true });

  const lookup = async (n, p) => {
    if (!n.trim() || p.replace(/\D/g, "").length < 9) {
      setState({ loading: false, order: null, error: "Enter your order number and the mobile number you ordered with." });
      return;
    }
    setState({ loading: true, order: null, error: null });
    setParams({ number: n.trim().toUpperCase(), phone: p.trim() }, { replace: true, preventScrollReset: true });
    try {
      const order = await trackInquiry(n.trim(), p.trim());
      setState({ loading: false, order, error: null });
    } catch (error) {
      setState({
        loading: false,
        order: null,
        error: error.status === 404 ? "We couldn't find an order with that number and mobile number. Check both and try again." : error.message,
      });
    }
  };

  // arriving from the success page / a shared link: look it up straight away
  useEffect(() => {
    if (params.get("number") && params.get("phone")) lookup(params.get("number"), params.get("phone"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const order = state.order;
  const help = whatsappLink(
    settings.whatsappNumber,
    `Hello ${settings.storeName}, I'd like an update on my order ${order?.inquiryNumber || number}.`,
  );
  const input = "h-12 w-full rounded-xl border border-ink/20 bg-mist px-4 focus:border-ink focus:outline-none";

  return (
    <>
      <section className="bg-night text-moon">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-14 sm:px-6">
          <h1 className="text-[clamp(2.6rem,6vw,4.5rem)]">Track an order</h1>
          <p className="mt-3 max-w-lg text-moon-soft">Enter the order number we gave you and the mobile number you ordered with.</p>
        </div>
      </section>

      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(number, phone);
            }}
            className="grid gap-4 rounded-2xl bg-mist p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
          >
            <label className="text-sm font-semibold">
              Order number
              <input className={`${input} mt-1.5 font-normal uppercase`} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="DS-2026-000123" autoComplete="off" />
            </label>
            <label className="text-sm font-semibold">
              Mobile number
              <input className={`${input} mt-1.5 font-normal`} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="077 123 4567" autoComplete="tel" />
            </label>
            <Button type="submit" disabled={state.loading}>
              {state.loading ? "Looking…" : "Track order"}
            </Button>
          </form>

          {recent.length > 0 && !order && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-soft">Your recent orders:</span>
              {recent.map((o) => (
                <button
                  key={o.inquiryNumber}
                  type="button"
                  onClick={() => {
                    setNumber(o.inquiryNumber);
                    setPhone(o.phone || "");
                    lookup(o.inquiryNumber, o.phone || "");
                  }}
                  className="rounded-full bg-mist px-3 py-1.5 font-semibold hover:bg-fog-deep"
                >
                  {o.inquiryNumber}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {state.error && (
              <motion.p
                key="error"
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 rounded-xl bg-oxblood/10 p-4 text-sm font-semibold text-oxblood"
              >
                {state.error}
              </motion.p>
            )}

            {order && (
              <motion.div
                key={order.inquiryNumber}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 grid gap-6 md:grid-cols-[1.1fr_1fr]"
              >
                <div className="rounded-2xl bg-mist p-6">
                  <p className="text-sm text-ink-soft">Order {order.inquiryNumber}</p>
                  <h2 className="mt-1 text-4xl">{STATUS_LABELS[order.status]}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Placed on {dateFormat.format(new Date(order.createdAt))}
                    {order.name ? ` by ${order.name}` : ""}
                  </p>
                  <div className="mt-6">
                    <StatusTimeline status={order.status} history={order.history} />
                  </div>
                </div>

                <div className="h-fit rounded-2xl bg-mist p-6">
                  <h2 className="text-2xl">Items</h2>
                  <ul className="mt-3 divide-y divide-ink/10">
                    {order.items.map((item) => (
                      <li key={`${item.productName}-${item.sku}`} className="flex items-center gap-3 py-3">
                        <span className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-fog-deep">
                          {item.imageUrl && <Img src={imageAt(item.imageUrl, 120)} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          {item.slug ? (
                            <Link to={`/product/${item.slug}`} className="font-semibold hover:underline">{item.productName}</Link>
                          ) : (
                            <span className="font-semibold">{item.productName}</span>
                          )}
                          <span className="block text-ink-soft">× {item.quantity}</span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{formatPrice(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
                    <span className="font-semibold">Estimated total</span>
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(order.estimatedTotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">Pay in cash on delivery.</p>
                  {help && (
                    <a href={help} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-verdigris-deep">
                      <WhatsAppIcon width={18} height={18} className="text-[#1f9e55]" /> Ask about this order
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
