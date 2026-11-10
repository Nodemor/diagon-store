import { Link } from "react-router-dom";

// Buttons and button-styled links.
// variant: "lamp" (primary, glowing amber) · "outline-night" (on dark) · "outline" (on fog) · "quiet"
const VARIANTS = {
  lamp:
    "bg-lamp text-night hover:bg-lamp-soft shadow-[0_0_0_0_rgb(242_181_68/0)] hover:shadow-[0_0_28px_2px_rgb(242_181_68/0.35)]",
  "outline-night": "border border-moon/30 text-moon hover:border-lamp hover:text-lamp",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-fog",
  quiet: "text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink",
};

const SIZES = {
  md: "h-12 px-6 text-[0.95rem]",
  sm: "h-10 px-4 text-sm",
};

export function buttonClass({ variant = "lamp", size = "md", className = "" } = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "transition-[background-color,color,border-color,box-shadow] duration-300 ease-alley",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    variant === "quiet" ? "" : SIZES[size],
    className,
  ].join(" ");
}

export function Button({ variant, size, className, ...props }) {
  return <button type="button" className={buttonClass({ variant, size, className })} {...props} />;
}

export function ButtonLink({ to, href, variant, size, className, ...props }) {
  const cls = buttonClass({ variant, size, className });
  if (href) return <a href={href} className={cls} {...props} />;
  return <Link to={to} className={cls} {...props} />;
}
