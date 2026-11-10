import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../lib/format";
import { ButtonLink } from "../ui/Button";
import { WhatsAppIcon } from "../ui/icons";

// The ordering process really is a sequence, so the steps are numbered.
const STEPS = [
  {
    title: "Fill your cart",
    text: "Browse the shops and add what you like. Prices are in rupees and already include any offer.",
  },
  {
    title: "Send your order",
    text: "Add your name, mobile number and address, then send the order to us on WhatsApp or by email.",
  },
  {
    title: "Pay when it arrives",
    text: "We confirm availability and delivery with you, then you pay in cash at your door.",
  },
];

export function HowToOrder() {
  const { whatsappNumber, storeName } = useSettings();
  const wa = whatsappLink(whatsappNumber, `Hello ${storeName}, I'd like some help with an order.`);

  return (
    <section aria-labelledby="how-title" className="relative overflow-hidden bg-night text-moon">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full lamp-halo opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 id="how-title" className="text-[2.5rem] md:text-6xl">
              How ordering works
            </h2>
            <p className="mt-4 max-w-md text-moon-soft">
              No accounts and no card details. Every order gets a number you can use to track it on this site.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/shop">Start shopping</ButtonLink>
              <ButtonLink to="/track" variant="outline-night">
                Track an order
              </ButtonLink>
            </div>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm text-moon-soft transition-colors hover:text-lamp"
              >
                <WhatsAppIcon width={18} height={18} className="text-[#25d366]" />
                Questions first? Message us on WhatsApp
              </a>
            )}
          </div>

          <ol className="relative grid gap-10">
            <span className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-linear-to-b from-lamp/70 via-lamp/30 to-transparent" aria-hidden="true" />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative grid grid-cols-[2.8rem_1fr] gap-5">
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-lamp/50 bg-night-deep font-sign text-xl text-lamp">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[1.75rem] md:text-3xl">{step.title}</h3>
                  <p className="mt-1.5 max-w-md text-moon-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
