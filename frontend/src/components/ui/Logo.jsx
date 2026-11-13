import logoMark from "../../assets/brand/logo-mark.webp";
import logoFull from "../../assets/brand/logo-full.webp";

// Diagon Store logo, recoloured for the night-slate theme (moonlit ink, lamp-gold magic).
// Sources: frontend/public/brand/ (full-size originals for print, email and social profiles).
const MARK_RATIO = 560 / 430; // width / height
const FULL_RATIO = 780 / 681;

/** The cart-and-wizard-hat mark (navbar, back office). Decorative: pair it with the store name. */
export function LogoMark({ height = 44, className = "", alt = "" }) {
  return (
    <img
      src={logoMark}
      alt={alt}
      width={Math.round(height * MARK_RATIO)}
      height={height}
      className={`shrink-0 select-none ${className}`}
      draggable="false"
      decoding="async"
    />
  );
}

/** The full logo with the "Diagon Store" lettering (footer, sign-in page). */
export function LogoFull({ width = 200, className = "", alt = "Diagon Store", loading = "lazy" }) {
  return (
    <img
      src={logoFull}
      alt={alt}
      width={width}
      height={Math.round(width / FULL_RATIO)}
      className={`select-none ${className}`}
      draggable="false"
      loading={loading}
      decoding="async"
    />
  );
}
