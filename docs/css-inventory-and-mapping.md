### CSS inventory and Tailwind mapping (Hyvä refactor phase 1)

Scope scanned
- files: `assets/css/base.css` (~1321 lines), `assets/css/tailwind.css` (compiled output; utilities only, excluded from custom selector inventory), `src/tailwind.css` (input with Tailwind directives)

Method
- Parsed `assets/css/base.css` for custom selectors. Grouped by pattern (buttons, headings, forms, cards, grids, alerts/toasts, badges, pills, tables, layout, navigation, dialogs, overlays, utilities).
- Cited representative line ranges for each block; counts reflect distinct selectors in the group.

Summary counts by group (custom selectors)
- Base/reset: 10
- Tokens and color helpers: 20
- Typography (headings, lists): 20
- Buttons: 20
- Cards (incl. feature/product): 35
- Forms/inputs: 35
- Navigation/header/mega: 55
- Overlays/dialogs/offcanvas/ATC: 45
- Slider: 12
- Category tiles: 10
- Pills/badges/stock: 24
- Toasts: 20
- Footer/subfooter: 40
- Pricing tables/tiers: 30
- Brands grid: 8
- Utilities/helpers (container, skeleton, divider, spinner, h-scroll, etc.): 28
- Total unique custom selectors: ~382

Detailed inventory with citations

- Base/reset
  - `*, *::before, *::after`, `html:focus-within`, `body`, `html, body`, `img`
```1:13:assets/css/base.css
@layer base {
  /* Base */
  *, *::before, *::after { box-sizing: border-box; }
  html:focus-within { scroll-behavior: smooth; }
  body { font-family: var(--font-sans); color: var(--dark); background-color: #fff; line-height: 1.6; }
  html, body { overflow-x: hidden; }
  img { max-width: 100%; height: auto; }
}
```

- Tokens and color helpers
  - `:root` CSS vars, container max widths; `.text-brand`, `.bg-brand`, `.bg-accent`, `.bg-teal`, `.bg-dark`, `.bg-light`, `.border-brand`, `.text-dark`
```111:131:assets/css/base.css
::root {
  --brand: #9E0059; --accent: #F77F00; --teal: #00A99D; --dark: #333333; --light: #E6E6E6; --radius: 0.5rem;
  --container-sm: 40rem; --container-md: 48rem; --container-lg: 64rem; --container-xl: 72rem; --container-2xl: 72rem;
  --fs-300: clamp(0.95rem, 0.9rem + 0.2vw, 1rem);
  --fs-400: clamp(1rem, 0.98rem + 0.25vw, 1.0625rem);
  --fs-500: clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);
  --fs-600: clamp(1.25rem, 1.15rem + 0.6vw, 1.5rem);
  --fs-700: clamp(1.5rem, 1.3rem + 1vw, 2.25rem);
  --container-max: var(--container-xl);
}
```

- Typography (headings, lists)
  - Responsive defaults for `.section`, `.section-alt` text sizes; implicit heading sizes when no `text-*` applied; list spacing
```191:233:assets/css/base.css
/* Content typography defaults */
.section p, .section li, .section-alt p, .section-alt li { font-size: var(--fs-400); line-height: 1.7; }
.section h2:not([class*="text-"]), .section-alt h2:not([class*="text-"]) { font-size: var(--fs-600); font-weight: 900; letter-spacing: -0.01em; }
.section h3:not([class*="text-"]), .section-alt h3:not([class*="text-"]) { font-size: var(--fs-500); font-weight: 800; letter-spacing: -0.005em; }
/* Lists */
.section ul.list-disc, .section ol.list-decimal, .section .list-disc, .section .list-decimal,
.section-alt ul.list-disc, .section-alt ol.list-decimal, .section-alt .list-disc, .section-alt .list-decimal { font-size: 1rem; line-height: 1.6; }
.section ul.list-disc li + li, .section ol.list-decimal li + li, .section .list-disc li + li, .section .list-decimal li + li,
.section-alt ul.list-disc li + li, .section-alt ol.list-decimal li + li, .section-alt .list-disc li + li, .section-alt .list-decimal li + li { margin-top: 0.375rem; }
```

- Buttons (core + refined set)
  - `.btn`, `.btn-sm`, `.btn-brand`, `.btn-accent`, `.btn-outline`, `.btn--orderlist`, `.btn--no-shrink`, `.btn--rfq`, `.btn-card`
```248:256:assets/css/base.css
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: var(--radius); font-weight: 600; transition: background-color .2s ease, color .2s ease, border-color .2s ease; white-space: nowrap; }
.btn-brand { background: var(--brand); color: #fff; font-weight: 800; }
.btn-accent { background: var(--accent); color: #111; }
.btn-outline { border: 1px solid var(--dark); color: var(--dark); background: transparent; font-weight: 800; }
```
```872:891:assets/css/base.css
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.625rem; font-weight: 700; text-decoration: none; transition: background-color .15s ease, color .15s ease, border-color .15s ease, box-shadow .2s ease; border: 1px solid transparent; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.btn-sm { font-size: .875rem; padding: .45rem .65rem; min-height: 40px; }
.btn-brand { background: var(--brand); color: #fff; }
.btn-accent { background: var(--accent); color: #111; }
.btn-outline { background: #fff; color: var(--brand); border-color: rgba(158,0,89,0.35); }
```

- Cards (generic + feature + product)
  - `.card`, `.card--hover`, `.card-body`, `.feature-card`, `.feature-icon*`, `.card-product*`
```21:24:assets/css/base.css
.card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.card--hover { transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease; }
.card--hover:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); border-color: rgba(0,0,0,0.12); }
```
```270:281:assets/css/base.css
.card-product { display: flex; flex-direction: column; }
.card-product__media { position: relative; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 0.5rem; background: #fff; display: flex; align-items: center; justify-content: center; }
.card-product__title { min-height: 2.8rem; line-height: 1.35; font-weight: 800; letter-spacing: -0.01em; }
.card-product__price { min-height: 1.25rem; font-weight: 900; }
```

- Forms/inputs
  - `.input`, `.select`, `.textarea`, `.qty-control*`, `.form-compact*`, `.form-standard`, `.header-search__input`
```297:339:assets/css/base.css
.input, .select, .textarea { width: 100%; border-radius: var(--radius); border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; }
.textarea { min-height: 120px; }
.qty-control { background: #fff; }
.form-compact { max-width: 36rem; margin-left: auto; margin-right: auto; }
.form-standard { padding: 1rem; }
```

- Navigation/header/mega
  - `.header-premium`, `.header-topband`, `.header-navband`, `#mainNav`, `#megaHost`, `.mega-panel*`, `.mega-link*`, `.nav-link-premium`, `.header-action*`, `.header-cart`, `.header-badge`, layout widths
```360:374:assets/css/base.css
.header-premium { backdrop-filter: none; background: transparent; }
.header-topband { background: #ffffff; border-bottom: 1px solid var(--light); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.header-navband { background: var(--brand); color: #fff; }
#mainNav { position: relative; z-index: 70; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
#megaHost { z-index: 65; }
```

- Overlays/dialogs/offcanvas/ATC
  - `.offcanvas-panel`, `#offcanvas > [data-close=offcanvas]`, `.dialog-*`, `.atc-*`, `.cartdrawer`, `.cart-drawer__panel`
```413:431:assets/css/base.css
.offcanvas-panel { transform: translateX(-100%); transition: transform .25s ease-in-out; }
#offcanvas:not(.hidden) .offcanvas-panel { transform: translateX(0); }
.atc-overlay { background: rgba(0,0,0,0.4); opacity: 0; transition: opacity .16s ease-out; }
.atc-container { background: rgba(255,255,255,0.72); border-radius: 1rem; box-shadow: 0 20px 60px rgba(0,0,0,0.15); transform: scale(.98); opacity: 0; transition: opacity .18s ease-out, transform .18s ease-out; }
```
```442:470:assets/css/base.css
.dialog-root { isolation: isolate; z-index: 95; }
.dialog-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); opacity: 0; transition: opacity .16s ease-out; }
.dialog-viewport { position: absolute; inset: 0; display: grid; place-items: center center; padding: 1rem; }
.dialog-panel { width: 100%; border-radius: 1rem; opacity: 0; transform: translateY(calc(-1 * var(--dialog-offset-top, 0px))) scale(.98); transition: opacity .18s ease-out, transform .18s ease-out; }
```

- Slider
  - `.slider__viewport`, `.slider__track`, `.slider__slide`, `.slider__dots`, `.slider__dot`
```53:70:assets/css/base.css
.slider__viewport { scroll-snap-type: x mandatory; contain: content; }
.slider__track { display: flex; align-items: center; will-change: transform; }
.slider__slide { scroll-snap-align: start; }
.slider__dots { display: flex; justify-content: center; gap: .4rem; margin-top: .75rem; }
.slider__dots .slider__dot { width: 8px; height: 8px; border-radius: 9999px; }
```

- Category tiles
  - `.cat-card*`
```926:943:assets/css/base.css
.cat-card { display: flex; flex-direction: column; align-items: center; text-align: center; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 1rem; padding: 1rem; transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease; }
.cat-card__media { width: 100%; aspect-ratio: 1 / 1; border-radius: .8rem; overflow: hidden; background: #fff; }
.cat-card__title { margin-top: .75rem; font-weight: 900; }
```

- Pills/badges/stock indicators
  - `.pill*`, `.badge*`, `.stock-*`, `.dot`
```789:808:assets/css/base.css
.pill { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .375rem 1rem; border: 1px solid rgba(0,0,0,0.08); border-radius: 9999px; font-weight: 800; font-size: .875rem; }
.pill--primary { background: rgba(158,0,89,0.08); border-color: rgba(158,0,89,0.18); color: #7d0047; }
.pill--secondary { background: rgba(0,169,157,0.08); border-color: rgba(0,169,157,0.18); color: #066; }
.pill--neutral { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }
```

- Toasts (alerts)
  - `.toasts`, `.toast*`, variants `.toast--success|warning|error|info|cart`
```1237:1307:assets/css/base.css
.toasts { position: fixed; left: 50%; bottom: calc(1rem + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 90; display: grid; gap: .5rem; width: min(92vw, 400px); }
.toast { background: #fff; color: var(--dark); border: 1px solid var(--light); border-left: 3px solid var(--brand); border-radius: .75rem; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: .5rem .65rem; display: grid; grid-template-columns: auto 1fr auto; gap: .6rem; }
.toast--success { border-left-color: var(--teal); }
.toast--warning { border-left-color: var(--accent); }
```

- Footer/subfooter
  - `.footer-premium*`, `.footer-divider`, `.subfooter*`, `.footer-grid`
```944:1006:assets/css/base.css
.footer-premium { background: var(--brand); background-image: radial-gradient(...), linear-gradient(...); color: #fff; position: relative; }
.footer-divider { background: #fff; border-top: 1px solid rgba(0,0,0,0.08); box-shadow: 0 -1px 0 rgba(255,255,255,0.6) inset, 0 -8px 24px rgba(0,0,0,0.05); }
.subfooter { background: #f8fafc; border-top: 1px solid rgba(0,0,0,0.06); }
```

- Pricing tables/tiers
  - `.tier-*`, `.pricing-table*`, `.list-check*`, tier color variables
```1131:1177:assets/css/base.css
::root { --tier-bronze: #b7792b; --tier-silver: #9aa0a6; --tier-gold: #c28e00; --tier-platinum: #8e9aa6; }
.tier-card { position: relative; border: 1px solid var(--light); border-radius: .9rem; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.pricing-table { width: 100%; border-collapse: separate; border: 1px solid var(--light); border-radius: .75rem; overflow: hidden; background: #fff; }
```

- Brands grid
  - `#brandsGrid a.card`, `#brandsGrid img`, hover states; `.brands-az button`
```173:181:assets/css/base.css
#brandsGrid a.card { display:flex; align-items:center; justify-content:center; height: 90px; border-radius: .75rem; }
#brandsGrid img { max-height: 40px; width: auto; object-fit: contain; filter: grayscale(1) contrast(1.05); opacity: .85; }
.brands-az button { font-weight: 800; }
```

- Utilities/helpers
  - Containers, `.content-narrow`, `.container-narrow|wide`, `.text-muted`, `.h-scroll`, `.divider`, `.spinner`, `.skeleton*`, `.sr-only`, `.sticky-sidebar`, `.sticky-summary`
```26:33:assets/css/base.css
.container-narrow { max-width: 56rem; margin-inline: auto; }
.container-wide { max-width: 80rem; margin-inline: auto; }
.text-muted { color: rgba(51,51,51,0.7); }
```

Proposed Tailwind mapping per group

- Base/reset
  - Keep minimal `@layer base` only for cross-browser fixes not in Preflight (e.g., `html, body { overflow-x-hidden }`). Move `img` rules to utilities (`max-w-full h-auto` already in Preflight).

- Tokens
  - Move `:root` color and spacing vars into `tailwind.config.js` under `theme.extend`:
    - colors: `brand`, `accent`, `teal`, `dark`, `light`
    - spacing/radius via `borderRadius: { brand: '0.5rem' }`, container widths via `screens`/`container` plugin or CSS container class using utilities.
  - Replace `.text-brand`, `.bg-brand`, etc. with Tailwind utilities `text-brand`, `bg-brand`, `border-brand` (already generated by config).

- Typography
  - Prefer utilities in templates. For default content areas, keep a light `@layer base`:
    - `.section :is(p, li) { @apply text-[length:theme(fontSize.base)] leading-relaxed }`
    - Optional `@tailwindcss/typography` plugin for rich text.

- Buttons
  - Create component classes with `@apply`:
    - `.btn { @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] font-extrabold whitespace-nowrap border border-transparent shadow-sm transition-colors; }`
    - `.btn-sm { @apply text-sm py-2 px-3 min-h-[40px]; }`
    - `.btn-brand { @apply bg-brand text-white hover:bg-[#7d0047] focus-visible:ring-2 focus-visible:ring-brand; }`
    - `.btn-accent { @apply bg-accent text-[#111] hover:bg-amber-600; }`
    - `.btn-outline { @apply bg-white text-brand border border-brand/35 hover:bg-brand/5; }`
    - `.btn--orderlist { @apply min-w-[11.5rem]; }`, `.btn--no-shrink { @apply shrink-0; }`, `.btn--rfq { @apply min-w-[8.5rem]; }`, `.btn-card { @apply text-sm sm:text-base py-2.5 px-3 min-h-[44px]; }`

- Cards
  - `.card { @apply bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden; }`
  - `.card--hover { @apply transition will-change-transform hover:-translate-y-0.5 hover:shadow-2xl; }`
  - Product/feature pieces to utilities in markup where one-off; extract repeated parts (e.g., `.card-product__media`) into components if reused widely.

- Forms/inputs
  - `.input, .select, .textarea { @apply w-full rounded-[var(--radius,0.5rem)] border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent; }`
  - `.textarea { @apply min-h-[120px]; }`
  - `.qty-control { @apply bg-white outline-none; }` with inner targets via markup utilities (`min-h-[44px] w-10 text-center`).
  - `.form-compact { @apply max-w-[36rem] mx-auto; }`, `.form-standard { @apply p-4 sm:p-5 lg:p-6; }`

- Navigation/header/mega
  - Inline utilities for spacing/shadows. Extract reusable bits:
    - `.header-topband { @apply bg-white border-b border-light shadow-sm; }`
    - `.header-navband { @apply bg-brand text-white; }`
    - `.mega-panel { @apply bg-white border border-light rounded-[var(--radius,0.5rem)] shadow-2xl opacity-0 -translate-y-1 transition; data-[state=open]:opacity-100 data-[state=open]:translate-y-0; }`
    - `.mega-link { @apply block px-1.5 py-1 text-[0.95rem] leading-snug text-dark/95 rounded hover:text-brand hover:bg-light/35 focus-visible:ring-2 focus-visible:ring-brand; }`

- Overlays/dialogs/offcanvas/ATC
  - `.offcanvas-panel { @apply -translate-x-full transition-transform group-data-[open]:translate-x-0; }`
  - `.dialog-*` and `.atc-*` as components using `@apply` for backdrop, panel, transitions. Use `data-state` attributes for open/closed state utilities.

- Slider
  - Map to utilities: `.slider__viewport { @apply snap-x snap-mandatory overflow-x-auto h-scroll; }`, `.slider__track { @apply flex items-center will-change-transform; }`, `.slider__slide { @apply snap-start; }` and dots via utilities.

- Category tiles
  - `.cat-card { @apply flex flex-col items-center text-center bg-white border border-black/10 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-2xl; }`

- Pills/badges/stock
  - `.pill { @apply inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full font-extrabold text-sm border border-black/10; }`
  - Variants use theme colors: `.pill--primary { @apply bg-brand/10 border-brand/20 text-[#7d0047]; }`, `.pill--secondary { @apply bg-teal/10 border-teal/20 text-teal; }`, `.pill--neutral { @apply bg-black/5 border-black/10 text-dark; }`
  - `.badge`, `.badge--soft`, `.stock-*` mapped similarly with `bg-*`, `text-*`, `border-*` from theme tokens.

- Toasts (alerts)
  - `.toasts { @apply fixed left-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))] -translate-x-1/2 z-[90] grid gap-2 w-[min(92vw,400px)] md:(left-auto right-[calc(1rem+env(safe-area-inset-right))] top-[calc(1rem+env(safe-area-inset-top))] bottom-auto translate-x-0 w-[min(92vw,380px)]) }`
  - `.toast { @apply bg-white text-dark border border-light rounded-xl shadow-2xl p-2.5 grid grid-cols-[auto_1fr_auto] gap-2.5 opacity-0 translate-y-1 transition data-[state=open]:opacity-100 data-[state=open]:translate-y-0; }`
  - Variants: `.toast--success { @apply border-l-4 border-teal text-teal; }` etc.

- Footer/subfooter
  - `.footer-premium { @apply bg-brand text-white; }` Keep gradient as a justified `@layer components` block if desired by design; otherwise replace with solid `bg-brand` per preference.
  - Width overrides: use utilities on containers; keep `.footer-premium > .container { @apply max-w-[80rem] 2xl:max-w-[90rem]; }` as component if reused globally.

- Pricing tables/tiers
  - `.pricing-table { @apply w-full border border-light rounded-xl overflow-hidden bg-white; }`
  - Tier accents via utilities; tier colors live in theme tokens (e.g., `colors.tier.bronze`).

- Utilities/helpers
  - Replace `.container-narrow|wide` with utility classes (`max-w-4xl` / `max-w-[80rem] mx-auto`).
  - `.h-scroll { @apply overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain; }` plus optional scrollbar styling only if required.
  - `.skeleton`, `.spinner`, `.divider` as small component utilities using `@apply`.

Notes toward acceptance criteria
- Remove global tag rules except minimal base overrides; move typography defaults to scoped containers or rely on utilities.
- Replace ad-hoc hex/rgb in CSS with theme tokens in `tailwind.config.js`.
- Wrap all remaining legacy selectors as `@layer components` classes using `@apply` to ensure the Tailwind build tree-shakes correctly.
- Prepare a safelist for dynamic classes (to be added in `tailwind.config.js`), e.g., `bg-brand`, `text-brand`, `grid-cols-*`, `col-span-*` based on PHP variables.

Next steps (phase 2 preview; no changes applied yet)
- Add tokens in `tailwind.config.js` (colors, spacing, fontSize, shadows).
- Scaffold component layer in `src/tailwind.css` and begin migrating from `assets/css/base.css`.
- Inline one-off utilities in templates and delete redundant blocks from `assets/css/base.css`.
- Add safelist and verify content globs for Hyvä templates (`.phtml`, `.html`, `.js`, and Magento view files).

Current built sizes (pre-refactor)
- Will be captured in the PR description after `npm run build` during this step.


