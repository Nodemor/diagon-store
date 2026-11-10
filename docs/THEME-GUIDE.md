# Diagon Store — Theme Guide

Diagon Store should feel like walking down a **magical shopping alley**: crooked shopfronts, candlelight, parchment, brass and gold, and a little wonder in every interaction. The shop must still be **fast, readable and easy to buy from**. The theme decorates the shopping experience and must never get in its way.

---

## ⚖️ Use an original wizarding style, not the franchise

"Harry Potter", its characters, house crests, logos, film stills and specific trademarked names belong to Warner Bros. and J.K. Rowling. To stay safe:

- **Do** use a general wizarding-alley look: owls, wands, potions, parchment, candles, brass scales, spell-book type, starry skies.
- **Don't** use official logos, house crests, the Hogwarts name or crest, film images or character likenesses, and don't suggest the shop is official or licensed.
- Get legal advice before using franchise names in product titles or marketing.

---

## Colour palette

Define these as tokens in `frontend/src/index.css` using Tailwind 4 `@theme`:

```css
@theme {
  --color-ink:        #14121f;  /* midnight background, primary text on light */
  --color-night:      #1f1b33;  /* raised dark surfaces */
  --color-parchment:  #f3e9d2;  /* page background (light) */
  --color-vellum:     #e7d9b8;  /* cards on parchment */
  --color-gold:       #c9a227;  /* accents, prices, CTAs */
  --color-gold-deep:  #9c7b16;  /* hover / pressed gold, gold text on parchment */
  --color-ember:      #7a1f2b;  /* deep red: sale badges, alerts */
  --color-emerald:    #1f4d3a;  /* success, in-stock */
  --color-sapphire:   #22356b;  /* links, info */
  --color-smoke:      #6b6478;  /* muted text */

  --font-display: "Cinzel Decorative", "Cinzel", serif;  /* logo, hero headings */
  --font-heading: "Cinzel", serif;                       /* section headings */
  --font-body:    "Cormorant Garamond", Georgia, serif;  /* long copy */
  --font-ui:      "Inter", system-ui, sans-serif;         /* buttons, forms, prices, admin */
}
```

- **Contrast:** gold on parchment is too faint for body text, so use `gold-deep` or `ink` for text. Check WCAG AA (4.5:1) on every text/background pair.
- **Admin panel:** use the same palette but stay calm and practical: mostly `ink`, `parchment` and `vellum`, the `ui` font, and very little ornament.

## Typography

- Load the fonts from Google Fonts with `display=swap`, or self-host them in Phase 8.
- Use the decorative font **only** for the logo and big headings. Body copy, forms and prices stay highly readable.
- Show prices in LKR with the `ui` font and tabular numbers: `Rs 2,500.00`.

## Shop wording

Use themed names where it's fun, but **always keep the plain meaning clear**. For example, the cart icon is labelled "Trunk", with a tooltip and `aria-label` that say "Cart".

| Plain | Themed wording |
|---|---|
| Shop / All products | The Alley |
| Categories | Shopfronts |
| Cart | Your Trunk |
| Add to cart | Add to Trunk |
| Checkout | Seal the Order |
| Place order (COD) | Send by Owl — Pay on Delivery |
| Order confirmed page | Your owl is on its way 🦉 |
| Track order | Track your Owl |
| Featured | Wizard's Picks |
| Offers / Sale | Enchanted Offers |
| New arrivals | Fresh from the Cauldron |
| Out of stock | Vanished (back soon) |
| 404 page | "You seem to have Apparated to the wrong place." |
| Search placeholder | "Summon an item…" |

Keep legal pages, error messages, form labels and anything to do with payments in **plain language**.

## Imagery & ornament

- Textures: subtle parchment grain, candle glow (radial gradients), faint star fields on dark sections.
- Ornaments: thin gold dividers, corner flourishes on cards, wax-seal badges for "Featured" and "Sale".
- Product photos: warm lighting, consistent backgrounds, 4:5 ratio for product cards.
- Use SVG for ornaments so they stay sharp and can be animated later.

## Motion (GSAP / Motion: to be added by the team)

Build components so motion can be layered on later:

- Give each section and card a stable wrapper element and accept `className` and `ref`.
- Keep animation code in its own hooks or components (e.g. `useReveal`, `<FloatIn>`), separate from data fetching.

Ideas:

- Hero: floating candles drifting slowly, title revealed letter by letter
- Product cards: lift slightly with a gold-glow border on hover
- Add to Trunk: the item flies to the trunk icon with a sparkle burst, and the count badge bounces
- Page transitions: parchment fade or page-turn
- Track your Owl: an owl moves along the status timeline

Always respect `prefers-reduced-motion: reduce` by turning off parallax, floating and flying effects. Animate only `transform` and `opacity`.

## Accessibility

- Every ornament is decorative: use `aria-hidden="true"` or an empty `alt`.
- Focus outlines must be visible (a gold outline on dark backgrounds, an ink outline on parchment).
- Tap targets are at least 44×44 px, and the layout works at 360 px wide.
