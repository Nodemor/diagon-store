import { useEffect } from "react";
import { useAsync } from "../hooks/useAsync";
import { getHome } from "../services/store";
import { ScrollTrigger } from "../lib/motion";
import { mainImage } from "../lib/format";
import { usePageTitle } from "../hooks/usePageTitle";
import { Hero } from "../components/home/Hero";
import { CategoryAlley } from "../components/home/CategoryAlley";
import { PromoBanners } from "../components/home/PromoBanners";
import { HowToOrder } from "../components/home/HowToOrder";
import { ProductSection } from "../components/product/ProductRail";
import { Button } from "../components/ui/Button";

/** Landing page — all content comes from GET /api/home (managed in the admin panel). */
export default function Home() {
  const { data, error, loading } = useAsync((signal) => getHome({ signal }), []);
  usePageTitle(null);

  // pinned sections change height once real content arrives
  useEffect(() => {
    if (data) requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [data]);

  if (error) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-5xl">The lamps are out</h1>
          <p className="mt-4 text-ink-soft">{error.message}</p>
          <Button className="mt-8" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <Hero banners={data?.heroBanners} fallbackImage={mainImage(data?.featured?.[0])} />

      <CategoryAlley categories={data?.categories} />

      <ProductSection
        id="featured"
        title="Featured this week"
        intro="Hand-picked from every shop on the street."
        link={{ to: "/shop?featured=true", label: "See all featured" }}
        products={data?.featured}
        loading={loading}
      />

      <PromoBanners banners={data?.promoBanners} />

      <ProductSection
        id="new"
        title="Just arrived"
        intro="The newest things to reach the alley."
        link={{ to: "/shop?newArrival=true", label: "See all new arrivals" }}
        products={data?.newArrivals}
        loading={loading}
        layout="rail"
      />

      <ProductSection
        id="offers"
        title="On offer"
        intro="Reduced prices, for as long as stock lasts."
        link={{ to: "/shop?onSale=true", label: "See all offers" }}
        products={data?.onSale}
        loading={loading}
        tone="mist"
      />

      <ProductSection
        id="popular"
        title="Most viewed"
        intro="What other shoppers keep coming back to."
        link={{ to: "/shop?sort=popular", label: "Shop popular products" }}
        products={data?.popular}
        loading={loading}
        layout="rail"
      />

      <HowToOrder />
    </>
  );
}
