import { Link } from "react-router-dom";
import { imageAt } from "../../lib/format";

/** Promotional banners managed in Admin → Banners (placement PROMO). */
export function PromoBanners({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section aria-label="Current offers" className="bg-fog">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-4 sm:px-6 md:grid-cols-2 md:gap-6 lg:px-8">
        {banners.slice(0, 2).map((banner) => {
          const inner = (
            <>
              <img
                src={imageAt(banner.imageUrl, 1000)}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-alley group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-linear-to-r from-night/90 via-night/60 to-night/10" />
              <div className="relative flex h-full max-w-sm flex-col justify-end p-7 md:p-9">
                <p className="font-sign text-[2.1rem] leading-tight text-moon md:text-[2.6rem]">{banner.title}</p>
                {banner.subtitle && <p className="mt-2 text-sm text-moon-soft md:text-base">{banner.subtitle}</p>}
                {banner.buttonText && (
                  <span className="mt-5 inline-flex h-10 w-fit items-center rounded-full bg-lamp px-5 text-sm font-semibold text-night transition-colors group-hover:bg-lamp-soft">
                    {banner.buttonText}
                  </span>
                )}
              </div>
            </>
          );
          const cls = "group relative block aspect-[16/10] overflow-hidden rounded-[1.5rem] md:aspect-[16/11] lg:aspect-[16/9]";

          if (!banner.buttonLink) return <div key={banner.id} className={cls}>{inner}</div>;
          return /^https?:\/\//.test(banner.buttonLink) ? (
            <a key={banner.id} href={banner.buttonLink} className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={banner.id} to={banner.buttonLink} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
