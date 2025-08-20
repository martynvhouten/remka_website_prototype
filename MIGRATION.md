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


