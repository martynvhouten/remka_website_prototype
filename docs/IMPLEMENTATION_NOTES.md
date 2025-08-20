Add-to-Cart Dialog

CSS structure cleanup (Tailwind + layers)

- Updated: `src/tailwind.css` now contains only Tailwind entry directives:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
- Updated: `assets/css/base.css` reorganized using Tailwind layers:
  - `@layer base` for element-level resets and defaults (box-sizing, html/body, img)
  - `@layer components` for reusable classes (e.g., `card`, `btn-*`, `badge`, inputs, layout helpers)
- Kept import order in HTML: `tailwind.css` before `base.css` to ensure custom layers properly cascade after Tailwind.
- No visual changes intended; only structural refactor for clarity and purge safety.

!important audit

- Remaining `!important`: none in authored CSS. Any `!important` seen previously originated from generated selectors like `.!hidden` in the compiled CSS; these are Tailwind escape variants and are not authored by us.
- No global `important: true` in `tailwind.config.js`.

Inline styles audit (kept as-is where semantic/runtime-bound):
- `style-guide.html` — page-scoped demo styles inside a `<style>` block (kept, demo-only).
- `index.html` partial placeholders — `content-visibility`/`contain-intrinsic-size` used for LCP performance hints (kept inline by design).
- `partials/home-categories.html` and `partials/brands-carousel.html` — `style="contain: content;"` kept for scroll/containment optimization.
- `over-ons.html` images — `style="aspect-ratio: 4 / 3;"` retained for intrinsic ratio without extra markup.

Follow-ups recommended

- If desired, move page-scoped demo styles from `style-guide.html` into a dedicated demo layer in `assets/css/base.css` under `@layer components` guarded by a `.sg-*` scope.
- Consider replacing a few inline `aspect-ratio` usages with a utility class if it becomes common.

This change replaces the cart toast with a full Add-to-Cart dialog (modal) using the existing vanilla JS + Tailwind/CSS tokens stack.

Files changed/added

- Added: `assets/js/addToCartDialog.js` – dialog component, focus trap, analytics, recommendations
- Updated: `assets/js/toasts.js` – removed legacy add-to-cart and bulk-add toast hooks
- Updated: pages to load dialog script:
  - `index.html`, `product.html`, `style-guide.html`, `category.html`, `category-level-1.html`, `brands.html`, `search.html`, `blog.html`, `blog-post.html`, `demo/offerte.html`, `checkout-*.html`
- Updated: `assets/css/base.css` – scroll lock for open dialog (`:root.dialog-open`)
- Updated: `README.md` – notes about add-to-cart behavior reference (dialog replaces cart toast)

Usage

- Buttons with `data-add-to-cart` automatically open the dialog.
- Bulk add event `cart:addItems` also opens the dialog with an aggregate summary.
- Public API: `window.AddToCartDialog.open({ addedItem, cartSummary })`.

Labels

- Header: “Toegevoegd aan je winkelwagen” (edit in `assets/js/addToCartDialog.js`).
- CTAs: “Ga naar afrekenen”, “Bekijk winkelwagen”, “Verder winkelen”. Change inline if needed.

Styling tokens

- Uses existing `card`, `btn`, `border-light`, `rounded`, and color tokens from `assets/css/base.css` and Tailwind.
- Max width is `max-w-xl` (~640px). Adjust in the template if desired.

Recommendations source

- Prototype uses `/data/products.json` with a simple category-based selection (up to 8, excludes current SKU). Replace with Magento related/upsell in production.

To swap data source: replace `loadProducts` and `selectRecommendations` in `assets/js/addToCartDialog.js` with Magento GraphQL/REST calls keyed by the added SKU.

Accessibility

- role="dialog", aria-modal="true", aria-labelledby on the title.
- Focus is trapped within the dialog; ESC and backdrop click close.
- Live region announces: “Toegevoegd <naam> aan je winkelwagen.”
- Focus returns to the invoker on close.

Analytics

Events pushed to `dataLayer` if present:
- add_to_cart_dialog_open with sku and timeToOpenMs
- add_to_cart_dialog_cta_click with cta ∈ {continue, view-cart, checkout}
- add_to_cart_dialog_reco_add with sku

QA Checklist

- Mobile/desktop layouts
- Keyboard-only flow (Tab cycles inside, ESC closes)
- Screen reader labels (title announced, live region message)
- Currency formatting for unit and line prices
- Dark mode: not used (site design prefers light)
- Error fallback: no products JSON → empty recommendations message
- Analytics events fire (inspect dataLayer)
- RTL: not applicable in current prototype

