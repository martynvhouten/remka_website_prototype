### CSS migration to Tailwind (@layer components)

Table: legacy selector → new Tailwind pattern/component

- .btn → .btn (components via @apply)
- .btn-brand → .btn-brand
- .btn-accent → .btn-accent
- .btn-outline → .btn-outline
- .btn-sm → .btn-sm
- .btn-card → .btn-card
- .input, .select, .textarea → .input, .select, .textarea (components)
- .card, .card--hover, .card-body → .card, .card--hover, .card-body
- .pill, .pill--primary|secondary|neutral → .pill, .pill--primary|secondary|neutral
- .badge, .badge--ok, .badge--soft → .badge, .badge--ok, .badge--soft
- .alert-* → .alert, .alert--success|warning|error
- .toasts, .toast, .toast--* → .toasts, .toast, .toast--*
- .dialog-* → .dialog-*
- .mainnav-link, .mega-panel, .mega-link → .mainnav-link, .mega-panel, .mega-link
- .footer-premium, .footer-divider, .footer-grid, .social-* → same class names under @layer components
- .tier-card*, .pricing-table* → same class names under @layer components
- .cat-card* → same class names under @layer components
- .divider, .h-scroll → same class names under @layer components

Files touched
- tailwind.config.js (tokens, content globs, safelist)
- src/tailwind.css (new @layer components)
- components/ProductCard.html (minor inline utilities)
- assets/css/base.css (to be reduced in later phases)
- style-guide.html (structure overhaul, tokens-only examples, dark mode preview, search, copy buttons)
- Removed legacy duplicate: styleguide.html

### 2025-08 Styleguide overhaul
- New navigation (sticky sidebar with anchors), optional mobile collapse
- Dark-mode aware previews (class strategy, not enabled sitewide)
- Tokens-only color panel; removed all hardcoded hex from examples
- Live examples with realistic content + copy buttons on code blocks
- Unified toasts/dialog patterns (Alpine-friendly)
- Utilities/layout examples (.section, .section-alt, grids 2/3/4 cols)
- Added sections: Tables, Pagination, Utilities, Callouts, Blog

### Size delta
- BEFORE: base.css=TBD, tailwind.css=TBD
- AFTER: base.css=51347, tailwind.css=TBD


