## Hyvä readiness (smoke)

Status: PASS/FAIL per onderdeel met quick fixes.

- Tailwind build: PASS — lokaal via `tailwindcss`, purge via content-globs in `tailwind.config.js`.
- CDN Tailwind: FAIL (verwijderd in PR) — vervang `<script src="https://cdn.tailwindcss.com">` door `<link href="/assets/css/tailwind.css" rel="stylesheet">`.
- Content globs: PASS — `./**/*.html`, `./partials/**/*.html`, `./components/**/*.html`, `./assets/js/**/*.js`, `./**/*.phtml`.
- !important usage: PASS — geen `!important` in tokens/utilities.
- JS scope: PASS — modules zonder globale collisions; `window.toast` expliciet, verder events via delegatie/data-attributen.
- A11y: PASS — focus-visible, aria op mega/menu, ESC sluit overlays, reduced motion gerespecteerd.
- Perf: PASS — lazy images, slider native snap + throttling; geen layout shift in header/mega.

### Quick fixes guidance

- Vervang inline Tailwind-config scripts in HTML door `tailwind.config.js` tokens.
- Gebruik data-attributes voor hooks: `[data-add-to-cart]`, `[data-slider]`, `[data-nav]`.
- Vermijd nested anchors; gebruik knoppen voor toggles.
- Voor Magento forms: standaard `<button type="submit">`, `<label for>`; geen custom inputs zonder label.

### Build/run

- npm ci
- npm run build

### Review focus

- Header/mega: intent-timers, aria-expanded, geen schokken.
- PDP/PLP: kaarten via `components/ProductCard.html`, geen inline-styles.
- Minicart/toasts: losstaand, vervangbaar door Hyvä.


