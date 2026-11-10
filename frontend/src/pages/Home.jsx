import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const products = [
  {
    name: "Everyday Runner",
    category: "Footwear",
    price: 89,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    tone: "coral",
  },
  {
    name: "Studio Timepiece",
    category: "Accessories",
    price: 145,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
    tone: "sage",
  },
  {
    name: "The Weekender",
    category: "Bags",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85",
    tone: "sand",
  },
  {
    name: "Instant Classic",
    category: "Lifestyle",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85",
    tone: "lavender",
  },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l1 12H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function Home() {
  const [query, setQuery] = useState("");
  const [bagCount, setBagCount] = useState(0);

  const filteredProducts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return products;

    return products.filter((product) =>
      `${product.name} ${product.category}`.toLowerCase().includes(searchTerm),
    );
  }, [query]);

  return (
    <div className="storefront">
      <div className="store-announcement">
        A little something extra: free shipping on orders over $100
      </div>

      <header className="store-header">
        <Link className="store-logo" to="/" aria-label="Diagon Store home">
          diagon<span>.</span>
        </Link>

        <nav className="store-nav" aria-label="Main navigation">
          <a href="#featured">Shop all</a>
          <a href="#collections">Collections</a>
          <a href="#about">Our story</a>
        </nav>

        <div className="store-actions">
          <label className="store-search">
            <SearchIcon />
            <input
              aria-label="Search products"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              type="search"
              value={query}
            />
          </label>
          <button
            aria-label={`Shopping bag, ${bagCount} items`}
            className="store-bag"
            type="button"
          >
            <BagIcon />
            <span>Bag ({bagCount})</span>
          </button>
        </div>
      </header>

      <main>
        <section className="store-hero" id="collections">
          <div className="store-hero-copy">
            <p className="store-eyebrow">Good things, thoughtfully found</p>
            <h1>Make room for<br />the things you love.</h1>
            <p className="store-hero-description">
              Everyday essentials and little discoveries, picked to make life
              feel a bit more you.
            </p>
            <a className="store-button" href="#featured">
              Explore the collection <span aria-hidden="true">→</span>
            </a>
            <div className="store-hero-note">
              <span aria-hidden="true">✳</span> Curated with care, always.
            </div>
          </div>
          <div className="store-hero-image" role="img" aria-label="A sunlit clothing boutique">
            <span className="store-hero-sticker">FIND<br />YOUR<br />FAVORITE</span>
          </div>
          <div className="store-hero-index">01 — 04</div>
        </section>

        <section className="store-featured" id="featured">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">The good stuff</p>
              <h2>Meet your new favorites</h2>
            </div>
            <a className="store-text-link" href="#featured">
              Shop everything <span aria-hidden="true">↗</span>
            </a>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="store-product-grid">
              {filteredProducts.map((product) => (
                <article className="store-product" key={product.name}>
                  <div className={`store-product-image ${product.tone}`}>
                    <img alt={product.name} loading="lazy" src={product.image} />
                    <span className="store-product-tag">JUST LANDED</span>
                    <button
                      aria-label={`Add ${product.name} to bag`}
                      className="store-add-button"
                      onClick={() => setBagCount((count) => count + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <div className="store-product-info">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.category}</p>
                    </div>
                    <span>${product.price}.00</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="store-no-results">
              No finds for “{query}”. Try another search.
            </p>
          )}
        </section>

        <section className="store-about" id="about">
          <span aria-hidden="true">✳</span>
          <p>Less scrolling, better finding.</p>
          <h2>Small joys. Good finds.<br />A store with a little more heart.</h2>
          <a className="store-text-link" href="#featured">
            A bit about us <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="store-footer">
        <Link className="store-logo" to="/">
          diagon<span>.</span>
        </Link>
        <p>Thoughtful finds for everyday living.</p>
        <span>© 2026 Diagon Store</span>
      </footer>
    </div>
  );
}

export default Home;
