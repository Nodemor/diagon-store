import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import DOMPurify from "dompurify";
import { getProduct, getRelatedProducts } from "../services/store";
import { useAsync } from "../hooks/useAsync";
import { useSeo } from "../hooks/useSeo";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { formatPrice, imageAt, productShareUrl, productWhatsAppMessage, whatsappLink } from "../lib/format";
import { ProductGallery } from "../components/product/ProductGallery";
import { ShareButton } from "../components/product/ShareButton";
import { ProductSection } from "../components/product/ProductRail";
import { PriceTag } from "../components/ui/PriceTag";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { Button, ButtonLink } from "../components/ui/Button";
import { CheckIcon, MailIcon, WhatsAppIcon } from "../components/ui/icons";

// /product/:slug (proposal §3 Product Details Page)

function StockLine({ product }) {
  if (product.stockStatus === "OUT_OF_STOCK") {
    return <p className="flex items-center gap-2 text-sm font-semibold text-oxblood"><span className="h-2 w-2 rounded-full bg-oxblood" />Out of stock</p>;
  }
  if (product.stockStatus === "LOW_STOCK") {
    return <p className="flex items-center gap-2 text-sm font-semibold text-lamp-deep"><span className="h-2 w-2 rounded-full bg-lamp" />Only {product.stock} left</p>;
  }
  return <p className="flex items-center gap-2 text-sm font-semibold text-verdigris-deep"><span className="h-2 w-2 rounded-full bg-verdigris" />In stock</p>;
}

function Skeleton() {
  return (
    <div className="mx-auto grid max-w-7xl animate-pulse gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8" aria-hidden="true">
      <div className="aspect-[4/5] rounded-[1.5rem] bg-fog-deep" />
      <div className="space-y-4 pt-4">
        <div className="h-4 w-1/4 rounded bg-fog-deep" />
        <div className="h-12 w-3/4 rounded bg-fog-deep" />
        <div className="h-6 w-1/3 rounded bg-fog-deep" />
        <div className="h-24 rounded bg-fog-deep" />
      </div>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add, openCart } = useCart();
  const settings = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const actions = useRef(null);

  const { data: product, error, loading } = useAsync((signal) => getProduct(slug, { signal }), [slug]);
  const { data: related } = useAsync((signal) => getRelatedProducts(slug, { signal }), [slug]);
  useSeo({
    title: product ? product.metaTitle || product.name : loading ? "Loading" : "Product not found",
    description: product ? product.metaDescription || product.shortDescription || product.description : undefined,
    image: product?.images?.[0] ? imageAt(product.images[0].url, 1200) : undefined,
    type: product ? "product" : "website",
    noindex: !loading && !product,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku || undefined,
          description: product.shortDescription || undefined,
          image: product.images.map((i) => imageAt(i.url, 1200)),
          category: product.category?.name,
          brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            price: product.finalPrice,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: typeof window !== "undefined" ? window.location.href : undefined,
          },
        }
      : undefined,
  });

  useEffect(() => setQuantity(1), [slug]);

  // sticky bar on phones once the main buttons scroll out of view
  useEffect(() => {
    const el = actions.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  const description = useMemo(() => (product?.description ? DOMPurify.sanitize(product.description) : ""), [product]);

  if (loading) return <Skeleton />;
  if (error || !product) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-24 text-center">
        <div>
          <h1 className="text-5xl">{error?.status === 404 ? "This item has left the shelves" : "Couldn't load this product"}</h1>
          <p className="mt-4 text-ink-soft">{error?.status === 404 ? "It may have sold out or been removed." : error?.message}</p>
          <ButtonLink to="/shop" className="mt-8">Shop all products</ButtonLink>
        </div>
      </section>
    );
  }

  const max = Math.max(1, product.stock);
  const handleAdd = () => {
    add(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    openCart();
  };
  const buyNow = () => navigate(`/checkout?buy=${encodeURIComponent(product.slug)}&qty=${quantity}`);

  const shareUrl = productShareUrl(product.slug);
  const waUrl = whatsappLink(settings.whatsappNumber, productWhatsAppMessage(product, quantity, settings.storeName, shareUrl));
  const mailUrl = settings.email
    ? `mailto:${settings.email}?subject=${encodeURIComponent(`Inquiry: ${product.name}${product.sku ? ` (${product.sku})` : ""}`)}&body=${encodeURIComponent(
        `${productWhatsAppMessage(product, quantity, settings.storeName)}\n\nName:\nMobile number:\nDelivery address:\n\nProduct link: ${window.location.href}`,
      )}`
    : null;

  const badges = (
    <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5">
      {product.onSale && <span className="rounded-full bg-oxblood px-3 py-1 text-sm font-semibold text-white">{product.discountPercent}% off</span>}
      {product.isNewArrival && <span className="rounded-full bg-verdigris-deep px-3 py-1 text-sm font-semibold text-white">New</span>}
    </div>
  );

  return (
    <>
      <section className="bg-fog">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
            <Link to="/" className="hover:text-ink">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            {product.category ? (
              <>
                <Link to={`/category/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
                {product.subcategory && (
                  <>
                    <span className="mx-2" aria-hidden="true">/</span>
                    <Link to={`/category/${product.category.slug}?subcategory=${product.subcategory.slug}`} className="hover:text-ink">
                      {product.subcategory.name}
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link to="/shop" className="hover:text-ink">Shop</Link>
            )}
          </nav>

          <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
            <ProductGallery images={product.images} name={product.name} badges={badges} />

            <div className="md:pt-2">
              {product.brand && <p className="text-sm font-semibold text-ink-soft">{product.brand}</p>}
              <h1 className="mt-1 text-[clamp(2.3rem,4.5vw,3.6rem)]">{product.name}</h1>
              {product.sku && <p className="mt-2 text-sm text-ink-soft">Product code {product.sku}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <PriceTag product={product} size="lg" />
                {product.onSale && (
                  <span className="rounded-full bg-oxblood/10 px-2.5 py-1 text-sm font-semibold text-oxblood">
                    You save {formatPrice(product.price - product.finalPrice)}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <StockLine product={product} />
              </div>

              {product.shortDescription && <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>}

              <div ref={actions} className="mt-8 space-y-3">
                {product.inStock ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <QuantityStepper value={quantity} onChange={setQuantity} max={max} />
                      <Button className="min-w-48 flex-1" onClick={handleAdd}>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={added ? "y" : "n"}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="inline-flex items-center gap-2"
                          >
                            {added ? <><CheckIcon width={18} height={18} /> Added to cart</> : "Add to cart"}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full" onClick={buyNow}>
                      Order now, pay on delivery
                    </Button>
                  </>
                ) : (
                  <p className="rounded-xl bg-mist p-4 text-sm text-ink-soft">
                    This item is out of stock right now. Message us and we'll tell you when it's back.
                  </p>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-verdigris-deep">
                      <WhatsAppIcon width={18} height={18} className="text-[#1f9e55]" />
                      {product.inStock ? "Order via WhatsApp" : "Ask on WhatsApp"}
                    </a>
                  )}
                  {mailUrl && (
                    <a href={mailUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-verdigris-deep">
                      <MailIcon width={18} height={18} /> Send inquiry by email
                    </a>
                  )}
                  <ShareButton title={product.name} text={product.shortDescription || product.name} url={shareUrl} />
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-ink/10 pt-6 text-sm">
                {product.category && (
                  <>
                    <dt className="text-ink-soft">Category</dt>
                    <dd><Link to={`/category/${product.category.slug}`} className="underline underline-offset-4 hover:text-lamp-deep">{product.category.name}</Link></dd>
                  </>
                )}
                {product.brand && (
                  <>
                    <dt className="text-ink-soft">Brand</dt>
                    <dd>{product.brand}</dd>
                  </>
                )}
                <dt className="text-ink-soft">Payment</dt>
                <dd>Cash on delivery</dd>
              </dl>
            </div>
          </div>

          {(description || product.specifications?.length > 0) && (
            <div className="mt-16 grid gap-12 border-t border-ink/10 pt-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
              {description && (
                <div>
                  <h2 className="text-4xl">About this item</h2>
                  <div className="prose-shop mt-5 max-w-prose" dangerouslySetInnerHTML={{ __html: description }} />
                </div>
              )}
              {product.specifications?.length > 0 && (
                <div>
                  <h2 className="text-4xl">Specifications</h2>
                  <table className="mt-5 w-full text-sm">
                    <tbody>
                      {product.specifications.map((spec) => (
                        <tr key={spec.label} className="border-b border-ink/10">
                          <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-soft">{spec.label}</th>
                          <td className="py-3 font-semibold">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {product.tags?.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Link key={tag} to={`/shop?search=${encodeURIComponent(tag)}`} className="rounded-full bg-mist px-3 py-1 text-xs text-ink-soft hover:text-ink">
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ProductSection
        id="related"
        title="You may also like"
        intro={product.category ? `More from ${product.category.name} and nearby shops.` : undefined}
        products={related}
        layout="rail"
        tone="mist"
      />

      {/* phones: sticky add-to-cart once the main buttons are off screen */}
      <AnimatePresence>
        {showBar && product.inStock && (
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink/10 bg-mist/95 px-4 py-3 backdrop-blur md:hidden"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="text-sm tabular-nums text-ink-soft">{formatPrice(product.finalPrice)}</p>
            </div>
            <Button size="sm" onClick={handleAdd}>Add to cart</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
