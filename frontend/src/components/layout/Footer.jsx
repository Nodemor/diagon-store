import { Link } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../lib/format";
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "../ui/icons";
import { LogoFull } from "../ui/Logo";

const SHOP_LINKS = [
  { to: "/shop", label: "All products" },
  { to: "/shop?newArrival=true", label: "New arrivals" },
  { to: "/shop?onSale=true", label: "Offers" },
  { to: "/cart", label: "Your cart" },
  { to: "/track", label: "Track an order" },
];

const HELP_LINKS = [
  { to: "/pages/about", label: "About us" },
  { to: "/contact", label: "Contact us" },
  { to: "/pages/delivery-information", label: "Delivery information" },
  { to: "/pages/return-policy", label: "Returns & refunds" },
  { to: "/pages/privacy-policy", label: "Privacy policy" },
  { to: "/pages/terms", label: "Terms & conditions" },
];

const YEAR = new Date().getFullYear();

function LinkList({ title, links }) {
  return (
    <div>
      <h2 className="font-sans text-sm font-semibold tracking-normal text-moon">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-moon-soft transition-colors hover:text-lamp">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const s = useSettings();
  const wa = whatsappLink(s.whatsappNumber);
  const socials = [
    { href: s.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: s.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: s.tiktokUrl, label: "TikTok", Icon: TikTokIcon },
    { href: s.youtubeUrl, label: "YouTube", Icon: YouTubeIcon },
  ].filter((item) => item.href);

  const contact = [
    s.phone && { Icon: PhoneIcon, label: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    wa && { Icon: WhatsAppIcon, label: "Chat on WhatsApp", href: wa },
    s.email && { Icon: MailIcon, label: s.email, href: `mailto:${s.email}` },
    s.address && { Icon: PinIcon, label: s.address },
    s.businessHours && { Icon: ClockIcon, label: s.businessHours },
  ].filter(Boolean);

  return (
    <footer className="bg-night-deep text-moon">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 md:pt-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Link to="/" className="inline-block" aria-label={`${s.storeName} home`}>
              <LogoFull width={190} alt={s.storeName} className="-ml-2 h-auto w-[190px]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-moon-soft">{s.footerText || s.tagline}</p>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-cobble-line text-moon-soft transition-colors hover:border-lamp hover:text-lamp"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <LinkList title="Shop" links={SHOP_LINKS} />
          <LinkList title="Help" links={HELP_LINKS} />

          <div>
            <h2 className="font-sans text-sm font-semibold tracking-normal text-moon">Find us</h2>
            {contact.length ? (
              <ul className="mt-4 space-y-3">
                {contact.map(({ Icon, label, href }) => (
                  <li key={label} className="flex items-start gap-3 text-sm text-moon-soft">
                    <Icon className="mt-0.5 shrink-0 text-verdigris" width={18} height={18} />
                    {href ? (
                      <a href={href} className="transition-colors hover:text-lamp" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                        {label}
                      </a>
                    ) : (
                      <span>{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-moon-soft">Contact details will appear here once they are added in Admin → Settings.</p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cobble-line/60 pt-6 text-xs text-moon-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {YEAR} {s.storeName}, Powered by Nodemor PVT LTD. All rights reserved.
          </p>
          <p>Cash on delivery, island-wide.</p>
        </div>
      </div>
    </footer>
  );
}
