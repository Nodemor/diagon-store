import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { sendContactMessage } from "../services/store";
import { whatsappLink } from "../lib/format";
import { Button } from "../components/ui/Button";
import {
  CheckIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "../components/ui/icons";

// /contact (proposal §24–§25): business details, map, hours, social links and a message form.

/** Only Google Maps embed links are allowed inside the iframe. */
const safeMapUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith("/maps/embed") ? u.toString() : null;
  } catch {
    return null;
  }
};

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const s = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle"); // idle | sending | sent
  const [problem, setProblem] = useState(null);
  const [website, setWebsite] = useState(""); // honeypot

  useSeo({
    title: "Contact us",
    description: `Get in touch with ${s.storeName}${s.phone ? ` on ${s.phone}` : ""}${s.address ? `, ${s.address}` : ""}. Message us on WhatsApp, email or the form.`,
  });

  const wa = whatsappLink(s.whatsappNumber, `Hello ${s.storeName}, I have a question.`);
  const map = safeMapUrl(s.mapEmbedUrl);
  const socials = [
    [s.facebookUrl, "Facebook", FacebookIcon],
    [s.instagramUrl, "Instagram", InstagramIcon],
    [s.tiktokUrl, "TikTok", TikTokIcon],
    [s.youtubeUrl, "YouTube", YouTubeIcon],
  ].filter(([url]) => url);

  const details = [
    s.phone && { Icon: PhoneIcon, label: "Call us", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    wa && { Icon: WhatsAppIcon, label: "WhatsApp", value: "Chat with us", href: wa, external: true },
    s.email && { Icon: MailIcon, label: "Email", value: s.email, href: `mailto:${s.email}` },
    s.address && { Icon: PinIcon, label: "Visit us", value: s.address },
    s.businessHours && { Icon: ClockIcon, label: "Opening hours", value: s.businessHours },
  ].filter(Boolean);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Please enter your name.";
    if (!form.email.trim() && form.phone.replace(/\D/g, "").length < 9) found.email = "Add an email or a phone number so we can reply.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) found.message = "Please write a little more (at least 10 characters).";
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setState("sending");
    setProblem(null);
    try {
      await sendContactMessage({ ...form, email: form.email.trim() || null, website });
      setState("sent");
      setForm(EMPTY);
    } catch (err) {
      setState("idle");
      setProblem(err.message);
      setErrors(Object.fromEntries((err.errors || []).map((x) => [x.path, x.message])));
    }
  };

  const input = (error) =>
    `mt-1.5 w-full rounded-xl border bg-mist px-4 text-[0.95rem] focus:outline-none ${error ? "border-oxblood" : "border-ink/20 focus:border-ink"}`;

  return (
    <>
      <section className="bg-night text-moon">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
          <h1 className="text-[clamp(2.6rem,6vw,4.5rem)]">Contact us</h1>
          <p className="mt-3 max-w-xl text-moon-soft">Questions about a product, delivery or an order? Send us a message and we'll reply as soon as we can.</p>
        </div>
      </section>

      <section className="bg-fog">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:px-8">
          <div>
            {details.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {details.map(({ Icon, label, value, href, external }) => {
                  const body = (
                    <>
                      <Icon width={22} height={22} className={label === "WhatsApp" ? "text-[#1f9e55]" : "text-verdigris-deep"} />
                      <span className="mt-3 block text-sm text-ink-soft">{label}</span>
                      <span className="mt-0.5 block whitespace-pre-line font-semibold">{value}</span>
                    </>
                  );
                  return (
                    <li key={label}>
                      {href ? (
                        <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block h-full rounded-2xl bg-mist p-5 ring-1 ring-ink/5 transition-shadow hover:shadow-[0_14px_30px_-20px_rgb(28_34_48/0.5)]">
                          {body}
                        </a>
                      ) : (
                        <div className="h-full rounded-2xl bg-mist p-5 ring-1 ring-ink/5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-mist p-5 text-sm text-ink-soft">Contact details appear here once they're added in Admin → Settings.</p>
            )}

            {socials.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold">Follow us</p>
                <ul className="mt-3 flex gap-2">
                  {socials.map(([url, label, Icon]) => (
                    <li key={label}>
                      <a href={url} target="_blank" rel="noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-full bg-mist text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink hover:text-fog">
                        <Icon />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {map && (
              <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-ink/10">
                <iframe
                  title={`Map showing ${s.storeName}`}
                  src={map}
                  className="aspect-[4/3] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-mist p-6 ring-1 ring-ink/5 md:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {state === "sent" ? (
                <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid min-h-80 place-items-center text-center" role="status">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lamp text-night"><CheckIcon width={26} height={26} /></span>
                    <h2 className="mt-5 text-4xl">Message sent</h2>
                    <p className="mt-2 text-ink-soft">Thank you. We'll get back to you soon.</p>
                    <Button variant="outline" className="mt-6" onClick={() => setState("idle")}>Send another message</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate>
                  <h2 className="text-4xl">Send us a message</h2>
                  <p className="mt-1 text-sm text-ink-soft">We usually reply within a working day.</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold sm:col-span-2">
                      Name
                      <input id="contact-name" className={`${input(errors.name)} h-12`} autoComplete="name" value={form.name} onChange={update("name")} aria-invalid={Boolean(errors.name)} />
                      {errors.name && <span className="mt-1 block font-normal text-oxblood">{errors.name}</span>}
                    </label>
                    <label className="text-sm font-semibold">
                      Email
                      <input id="contact-email" type="email" className={`${input(errors.email)} h-12`} autoComplete="email" value={form.email} onChange={update("email")} aria-invalid={Boolean(errors.email)} />
                      {errors.email && <span className="mt-1 block font-normal text-oxblood">{errors.email}</span>}
                    </label>
                    <label className="text-sm font-semibold">
                      Phone <span className="font-normal text-ink-soft">(optional)</span>
                      <input id="contact-phone" type="tel" inputMode="tel" className={`${input(errors.phone)} h-12`} autoComplete="tel" value={form.phone} onChange={update("phone")} />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Subject <span className="font-normal text-ink-soft">(optional)</span>
                      <input id="contact-subject" className={`${input(errors.subject)} h-12`} value={form.subject} onChange={update("subject")} placeholder="e.g. Delivery to Jaffna" />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Message
                      <textarea id="contact-message" rows={5} className={`${input(errors.message)} py-3`} value={form.message} onChange={update("message")} aria-invalid={Boolean(errors.message)} />
                      {errors.message && <span className="mt-1 block font-normal text-oxblood">{errors.message}</span>}
                    </label>
                    <div className="hidden" aria-hidden="true">
                      <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
                    </div>
                  </div>

                  {problem && <p role="alert" className="mt-4 rounded-xl bg-oxblood/10 p-3 text-sm font-semibold text-oxblood">{problem}</p>}

                  <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={state === "sending"}>
                    {state === "sending" ? "Sending…" : "Send message"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}
