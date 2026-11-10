import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { getProduct, placeInquiry } from "../services/store";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatPrice, imageAt } from "../lib/format";
import { forgetDetails, getSavedDetails, saveDetails, saveRecentOrder } from "../lib/recentOrders";
import { Button, ButtonLink } from "../components/ui/Button";
import { MailIcon, WhatsAppIcon } from "../components/ui/icons";
import { Img } from "../components/ui/Img";

// /checkout — the order / inquiry form (proposal §9–§11). Payment is cash on delivery.
// ?buy=<slug>&qty=<n> orders a single product without touching the cart.

const EMPTY = { name: "", phone: "", email: "", address: "", city: "", notes: "" };

function Field({ label, name, error, hint, optional, textarea, ...props }) {
  const id = `checkout-${name}`;
  const Tag = textarea ? "textarea" : "input";
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-ink-soft">Optional</span>}
      </label>
      <Tag
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`mt-1.5 w-full rounded-xl border bg-mist px-4 text-[0.95rem] transition-colors focus:outline-none ${
          textarea ? "min-h-24 py-3" : "h-12"
        } ${error ? "border-oxblood focus:border-oxblood" : "border-ink/20 focus:border-ink"}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-oxblood">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function validate(form, channel) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (form.phone.replace(/\D/g, "").length < 9) errors.phone = "Enter a mobile number we can reach you on, e.g. 077 123 4567.";
  if (form.address.trim().length < 5) errors.address = "Enter the address we should deliver to.";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email address, or leave it empty.";
  if (channel === "EMAIL" && !form.email) errors.email = "Add your email so we can reply to your order.";
  return errors;
}

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const cart = useCart();
  const buySlug = params.get("buy");
  const buyQty = Math.max(1, Math.min(99, Number(params.get("qty")) || 1));
  usePageTitle("Send your order");

  const saved = useMemo(getSavedDetails, []);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(saved || {}) }));
  const [remember, setRemember] = useState(Boolean(saved));
  const [channel, setChannel] = useState(settings.whatsappNumber ? "WHATSAPP" : "EMAIL");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [single, setSingle] = useState({ loading: Boolean(buySlug), product: null, error: null });

  const whatsappReady = Boolean(settings.whatsappNumber);
  // settings arrive after the first render: default to WhatsApp once we know it's set up
  useEffect(() => {
    setChannel(whatsappReady ? "WHATSAPP" : "EMAIL");
  }, [whatsappReady]);

  // single-product order
  useEffect(() => {
    if (!buySlug) return undefined;
    const controller = new AbortController();
    getProduct(buySlug, { signal: controller.signal })
      .then((product) => setSingle({ loading: false, product, error: null }))
      .catch((error) => error.name !== "AbortError" && setSingle({ loading: false, product: null, error }));
    return () => controller.abort();
  }, [buySlug]);

  // cart order: make sure prices and stock are current
  useEffect(() => {
    if (!buySlug) cart.refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buySlug]);

  const lines = buySlug
    ? single.product
      ? [
          {
            productId: single.product.id,
            slug: single.product.slug,
            name: single.product.name,
            sku: single.product.sku,
            price: single.product.finalPrice,
            image: single.product.images?.[0]?.url,
            quantity: Math.min(buyQty, Math.max(1, single.product.stock)),
            available: single.product.inStock,
          },
        ]
      : []
    : cart.items;
  const orderable = lines.filter((l) => l.available !== false);
  const total = orderable.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const blocked = lines.some((l) => l.available === false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError(null);
    const found = validate(form, channel);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`checkout-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeInquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        city: form.city.trim() || null,
        notes: form.notes.trim() || null,
        channel,
        items: orderable.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        website,
      });

      if (remember) saveDetails({ name: form.name, phone: form.phone, email: form.email, address: form.address, city: form.city });
      else forgetDetails();
      const order = { ...result, phone: form.phone.trim(), placedAt: new Date().toISOString() };
      saveRecentOrder(order);
      if (!buySlug) cart.clear();

      // open WhatsApp straight away; the success page also has a button in case the browser blocks it
      if (channel === "WHATSAPP" && result.whatsappUrl) window.open(result.whatsappUrl, "_blank", "noopener");

      navigate(`/order/success/${result.inquiryNumber}`, { state: { order } });
    } catch (error) {
      const fieldErrors = {};
      for (const e of error.errors || []) if (e.path && e.path !== "items") fieldErrors[e.path] = e.message;
      setErrors(fieldErrors);
      setFormError(error.message || "We couldn't send your order. Please try again.");
      if (!buySlug && (error.errors || []).some((e) => e.path === "items")) cart.refresh().catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  // ---- empty / loading states
  if (buySlug && single.loading) {
    return <div className="mx-auto min-h-[60vh] max-w-7xl animate-pulse px-4 py-16"><div className="h-12 w-1/2 rounded bg-fog-deep" /></div>;
  }
  if (!lines.length) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-5xl">{single.error ? "That product isn't available" : "Your cart is empty"}</h1>
          <p className="mt-4 text-ink-soft">Add something from the shops first, then come back here to send your order.</p>
          <ButtonLink to="/shop" className="mt-8">Shop all products</ButtonLink>
        </div>
      </section>
    );
  }

  const channelCard = (value, Icon, title, text, disabled) => (
    <label
      className={`relative flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors ${
        channel === value ? "border-ink bg-mist" : "border-ink/15 hover:border-ink/40"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input
        type="radio"
        name="channel"
        value={value}
        checked={channel === value}
        disabled={disabled}
        onChange={() => setChannel(value)}
        className="dg-radio mt-0.5"
      />
      <span>
        <span className="flex items-center gap-2 font-semibold">
          <Icon width={18} height={18} className={value === "WHATSAPP" ? "text-[#1f9e55]" : ""} /> {title}
        </span>
        <span className="mt-0.5 block text-sm text-ink-soft">{text}</span>
      </span>
    </label>
  );

  return (
    <section className="bg-fog">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link to="/cart" className="hover:text-ink">Cart</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page" className="text-ink">Send your order</span>
        </nav>
        <h1 className="mt-3 text-[clamp(2.6rem,6vw,4.5rem)]">Send your order</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Tell us where to deliver. We'll confirm availability and the delivery charge with you, and you pay in cash when it arrives.
        </p>

        <form onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
          <div className="space-y-10">
            <fieldset>
              <legend className="font-sign text-3xl">Your details</legend>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={update("name")} error={errors.name} required />
                <Field
                  label="Mobile number"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  error={errors.phone}
                  hint="We'll call or WhatsApp you on this number."
                  required
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    error={errors.email}
                    optional={channel !== "EMAIL"}
                    hint="We'll send a copy of your order here."
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-sign text-3xl">Delivery</legend>
              <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_14rem]">
                <Field label="Delivery address" name="address" autoComplete="street-address" textarea value={form.address} onChange={update("address")} error={errors.address} required />
                <Field label="City" name="city" autoComplete="address-level2" value={form.city} onChange={update("city")} error={errors.city} optional />
                <div className="sm:col-span-2">
                  <Field label="Notes for us" name="notes" textarea value={form.notes} onChange={update("notes")} error={errors.notes} optional hint="Delivery times, landmarks, gift wrapping…" />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-sign text-3xl">How should we receive it?</legend>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {channelCard(
                  "WHATSAPP",
                  WhatsAppIcon,
                  "Send on WhatsApp",
                  whatsappReady ? "Opens WhatsApp with your order written out. Just press send." : "WhatsApp ordering isn't set up yet.",
                  !whatsappReady,
                )}
                {channelCard("EMAIL", MailIcon, "Send by email", "We get your order by email and reply to you.", false)}
              </div>
            </fieldset>

            {/* honeypot: hidden from people, bots fill it */}
            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="dg-check" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember my details on this device
            </label>
          </div>

          {/* summary */}
          <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-28" aria-label="Order summary">
            <h2 className="text-3xl">Your order</h2>
            <ul className="mt-4 divide-y divide-ink/10">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3 py-3">
                  <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-fog-deep">
                    {line.image && <Img src={imageAt(line.image, 160)} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.7rem] font-bold text-fog">
                      {line.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold">{line.name}</span>
                    {line.available === false && <span className="text-xs font-semibold text-oxblood">No longer available</span>}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(line.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>Confirmed with you</dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="text-2xl font-semibold tabular-nums">{formatPrice(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Payment</dt>
                <dd>Cash on delivery</dd>
              </div>
            </dl>

            <AnimatePresence>
              {(formError || blocked) && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="mt-4 rounded-xl bg-oxblood/10 p-3 text-sm font-semibold text-oxblood"
                >
                  {blocked ? "Some items are no longer available. Remove them from your cart to continue." : formError}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" className="mt-5 w-full" disabled={submitting || blocked || !orderable.length}>
              {submitting ? "Sending…" : channel === "WHATSAPP" ? "Send order on WhatsApp" : "Send order by email"}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-soft">
              You'll get an order number to track it. Nothing is charged online.
            </p>
            {!buySlug && (
              <Link to="/cart" className="mt-4 block text-center text-sm underline underline-offset-4 hover:text-lamp-deep">
                Edit cart
              </Link>
            )}
          </aside>
        </form>
      </div>
    </section>
  );
}
