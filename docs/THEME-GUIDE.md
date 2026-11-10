# Diagon Store — Theme Guide

## The idea: the alley at lamplight

Diagon Store is one shop that feels like a whole street. The site is a **wizarding alley at night**: crooked rooftops, shop windows glowing amber, street lamps, painted shop signs in copper-green and oxblood. Product sections step out of the night into a cool **fog**, so photos read clearly and the shop stays easy to use.

> **Why not parchment and gold?** Cream parchment with a gold serif is the default look for anything "magical". This palette was chosen to be specific to *a street at night* instead.

### ⚖️ Original style, not the franchise

"Harry Potter", its characters, house crests, logos, film stills and trademarked names belong to Warner Bros. / J.K. Rowling.

- **Do:** use the general look of an old alley — lamps, shopfronts, signs, cobbles, fog, letterpress type.
- **Don't:** use official logos, crests, character names or likenesses, and don't suggest the shop is licensed.

Demo product names in the seed data are original. Some demo **photos** show real brand logos; the client will replace them with their own photos.

---

## Colour tokens

Tokens are defined in `frontend/src/index.css` (`@theme`) and used as Tailwind classes (`bg-night`, `text-lamp`, ...).

| Token | Hex | Use |
|---|---|---|
| `night` | `#1c2230` | Header, hero, dark sections |
| `night-deep` | `#141924` | Footer, sky, deepest shadows, sign boards |
| `cobble` / `cobble-line` | `#2b3345` / `#3a4357` | Raised surfaces and borders on dark backgrounds |
| `lamp` | `#f2b544` | **The only accent.** Primary buttons, cart badge, lit windows, focus ring |
| `lamp-soft` | `#f7d38a` | Button hover, shop-sign lettering |
| `lamp-deep` | `#8a5a00` | Amber text on light backgrounds (meets 4.5:1 contrast) |
| `fog` / `fog-deep` / `mist` | `#e8ecef` / `#d9dfe5` / `#f5f7f8` | Product sections, image wells, alternate sections |
| `verdigris` / `verdigris-deep` | `#4fa39a` / `#2f6f68` | Shop signs, "New" badge, contact icons |
| `oxblood` | `#8e2f3c` | Sale badges, errors |
| `plum` | `#4a3550` | Shopfront variety |
| `ink` / `ink-soft` | `#1c2230` / `#4b5568` | Text on light backgrounds |
| `moon` / `moon-soft` | `#e9edf3` / `#a9b3c4` | Text on dark backgrounds |

Rules:

- **Use amber only for the most important action and for light.** Never use it for decoration.
- **Shop facades** (on the categories street) cycle through verdigris, plum, oxblood, midnight blue and bronze. They are the only place with this many colours.
- **Every text and background pair must meet WCAG AA contrast.** Check new pairs before using them.

## Typography

| Role | Typeface | Notes |
|---|---|---|
| Signs and headings (`font-sign`) | **IM Fell English** | A revival of 17th-century letterpress type, like hand-cut shop signs and old print. Used for headings, the logo, shop signs, prices on banners. Regular weight only. |
| Everything else (`font-sans`) | **Figtree** | Body text, buttons, forms, prices, navigation, admin panel. 400–700. |

Rules:

- **Sentence case everywhere.** No all-caps labels and no little labels stacked above headings.
- **Don't highlight one word in a heading** with italic, bold or a different colour.
- **Headings follow a classic type scale:** 28 / 36 / 48 / 60 px, plus the hero at `clamp(3.25rem, 8.5vw, 7rem)`.
- **Body text** is 16–18 px with 1.6 line height, and lines stay under about 75 characters (`max-w-md` / `max-w-lg`).
- **Prices** use `tabular-nums` and the format `Rs 15,900`.

## Words

Write plain, helpful sentences. The theme lives in the visuals, so a little flavour is fine but the meaning must always be clear.

| Do | Don't |
|---|---|
| "Shop all products", "Add to cart", "Track an order" | Themed names that hide what a button does |
| "Browse the shops", "Step inside" (category cards) | All-caps labels like "SHOPFRONTS" |
| "This street doesn't lead anywhere" (404) + a clear way back | Vague errors ("Oops!") |
| Buttons name the action: "Send order on WhatsApp" | "Submit", or an arrow on the end of a button label |

## Layout

- Content width is `max-w-7xl`, with side padding of 16 / 24 / 32 px.
- Section rhythm: `py-16` on mobile, `py-24` on desktop.
- Product grid: 2 columns on mobile, 3 on small tablets, 4 on desktop. Product images are 4:5 with a 20 px radius.
- Home page order:
  1. Hero (street + shop window)
  2. **Browse the shops** (shopfront street)
  3. Featured
  4. Promo banners
  5. Just arrived
  6. On offer
  7. Most viewed
  8. How ordering works
  9. Footer

## Motion

Libraries: **GSAP + ScrollTrigger** (scroll-linked), **Lenis** (smooth scroll), **Motion for React** (UI feedback and page transitions). Setup is in `src/lib/motion.js` and `src/components/motion/SmoothScroll.jsx`.

Motion is deliberate, not sprinkled everywhere:

| Moment | What happens | Why |
|---|---|---|
| Page load (hero) | Windows light up, lamps flicker on one by one, the headline rises, the shop-window shutter lifts | The one orchestrated moment that sets the scene |
| Hero scroll-out | Far buildings drift slower than the near row | Depth |
| Browse the shops (desktop) | The section pins and you walk sideways past the shopfronts; signs swing with your scroll speed | The signature interaction |
| Shopfront hover / focus | The window "lights up" (image brightens) | Shows the card is interactive |
| Add to cart | The + turns into a ✓, and the cart badge bounces | Confirms the action happened |
| Route change | A short fade and slide | Keeps navigation smooth |

**Please avoid:**

- A fade-up on every section
- Hover animations on everything
- Looping attention-seekers

Every new animation needs a reason from the table above.

**Accessibility:**

- `prefers-reduced-motion` turns off Lenis, the GSAP timelines (content shows in its final state), fog and flicker, and Motion animations (`MotionConfig reducedMotion="user"`).
- Animate only `transform`, `opacity` and `clip-path`.
- **Never leave a `transform` or `filter` on `<main>` or any ancestor of a pinned section.** It breaks ScrollTrigger pinning.

## Components

- `Button` / `ButtonLink` variants:
  - `lamp`: primary, one per view
  - `outline-night`: secondary on dark backgrounds
  - `outline`: secondary on fog backgrounds
  - `quiet`: text link
- `ProductCard`: image well, sale / new / out-of-stock badge, round add button, category, name, price.
- `ProductSection`: heading + intro + "See all" link + `grid` or `rail` layout, with skeletons while loading.
- `PriceTag`: sale price plus the struck-through regular price (proposal §18).
