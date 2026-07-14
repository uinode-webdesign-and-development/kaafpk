# kaafpk — Shopify Online Store 2.0 theme

Editorial streetwear theme for **kaafpk.store** — one baggy shirt + one baggy trouser (sold
separately or as a bundle). Near-black canvas, off-white type, single premium amber-gold accent.
Liquid + HTML + CSS + vanilla JS. No frameworks.

---

## 1. Get the theme onto the store

The theme files (`layout/`, `sections/`, `snippets/`, `templates/`, `assets/`, `config/`,
`locales/`) live at the **repo root**, so you have two options:

**A. Connect from GitHub (recommended for teams — auto-syncs edits to the store)**
Shopify admin → **Online Store → Themes → Add theme → Connect from GitHub**, pick this repo and
branch. Shopify reads the theme from the repo root. Pushes to the connected branch sync to the store.

**B. Upload a zip**
From the repo root: `zip -r kaafpk-theme.zip . -x '.git/*' '.claude/*' '.gitignore' 'README.md' 'kaafpk-theme.zip'`
then Shopify admin → **Themes → Add theme → Upload zip file**. **Customize** to preview, **Publish**
when ready.

## 2. First-run setup (10 min)

| Task | Where |
|------|-------|
| Create the two products, tag one `shirt` and the other `trouser` | Products |
| Add a **Size** option (S/M/L/XL) to each product | Product → Variants |
| Add ≥ 4 images per product (model + flat-lay) | Product → Media |
| Point the homepage **Product teaser** at your hero product | Theme editor → Homepage |
| On each product, set the **Matching product** (shirt ↔ trouser) under *Buy buttons* block | Theme editor → Product |
| Create nav menus `main-menu` and `footer` | Navigation |
| Add hero image/video | Theme editor → Homepage → Hero |

Everything on the homepage, product page and footer is built from **sections and blocks** — reorder
or hide them from the theme editor without touching code.

## 3. Meta Pixel + Conversions API

Open **`snippets/meta-pixel.liquid`** and search for the two markers:

- `<!-- INSERT META PIXEL ID -->` — set `META_PIXEL_ID` at the top of the file to your pixel id.
- `<!-- INSERT CAPI ACCESS TOKEN -->` — the CAPI token is a **secret** and must **not** live in
  theme code. The snippet fires client-side `PageView`, `ViewContent` and `AddToCart` events with an
  `eventID`; POST that same `eventID` to your own server/app, which calls Meta's Conversions API with
  the token and deduplicates on `eventID`. The exact spot is commented in the file.

## 4. Checkout branding (native checkout — not custom-built)

The checkout stays 100% Shopify. To match it to the brand, go to
**Settings → Checkout → Customize** (or the Checkout Branding API) and set:

| Token | Value |
|-------|-------|
| Background | `#0d0d0d` |
| Main / surface | `#141414` |
| Body & heading text | `#f2f2f0` |
| Accent / primary button | `#e0a82e` |
| Button text | `#141414` |
| Corner radius | Rounded / pill |

Enable **Cash on Delivery** and your **JazzCash / Easypaisa** gateways under
Settings → Payments, and set the prepaid discount (see below).

## 5. Prepaid discount + bundle discount

These are **commercial rules**, configured in admin (the theme only displays the badges/nudges):

- **Prepaid saving** ("Save Rs 250, pay via JazzCash/Easypaisa"): create an automatic discount that
  applies when a prepaid gateway is used, or use a payment-method discount app. Edit the displayed
  amount/methods in **Theme settings → Commerce**.
- **Bundle** (shirt + trouser): create an automatic "buy shirt + trouser, get Rs 500 off" discount.
  The cart drawer detects both items (via the `shirt`/`trouser` tags) and shows the unlock banner;
  the actual money-off is applied by the discount at checkout. Configure tags/amount in
  **Theme settings → Commerce**.

## 6. Delivery estimates

Edit **Theme settings → Delivery estimates**. Metro cities (Lahore, Karachi, Faisalabad) show the
fast window (2–3 days); everywhere else shows 4–6 days. The product page has a city picker that
computes the estimate live.

## 7. Performance notes (Lighthouse mobile 85+)

- Fonts are Shopify-hosted via `font_face` with **`font-display: swap`** — no render-blocking web
  fonts, no external font CDN.
- All below-fold images use `loading="lazy"` + responsive `srcset`; the hero and first gallery image
  use `fetchpriority="high"`.
- CSS is a single stylesheet; JS is two small deferred vanilla files (`theme.js`, `cart.js`). No
  frameworks, no jQuery.
- Product schema (JSON-LD) is emitted on product pages for SEO rich results.

## 8. Structure

```
layout/      theme.liquid, password.liquid
templates/   *.json (OS 2.0) + customers/*, gift_card, password
sections/    header/footer groups, hero, editorial-grid, brand-story,
             product-teaser, main-product, about-editorial, cart-drawer, main-*
snippets/    icon, price, product-card, product-schema, delivery-estimate,
             size-guide-drawer, meta-pixel
assets/      base.css, theme.js, cart.js
config/      settings_schema.json, settings_data.json
locales/     en.default.json
```

## 9. Design tokens

Editable in **Theme settings → Colors / Typography**.

- Background `#0d0d0d` · Elevated `#141414` · Text `#f2f2f0` · Muted `#a3a3a0`
- Accent `#e0a82e` (premium amber-gold — swap in one place to re-skin the whole theme)
- Headings: heavy/condensed sans (defaults to Assistant 800; switch to **Archivo Narrow** or
  **Oswald** in the theme editor for the condensed look seen in the reference).
