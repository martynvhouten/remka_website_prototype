### Remka prototype audit roundup

Scorecard (✅/⚠️/❌)
- ✅ Build & structure: local Tailwind via CLI, sane content globs, no CDN; scripts present
- ✅ UX/UI consistency: header/nav, mega, mobile drawer, ProductCard, Slider, Toasts visually coherent; spacing/typography consistent with tokens
- ✅ Behavior health: hamburger, overlay/ESC close, mega intent-timers with no flicker; sticky header stable
- ✅ Links & routes: link-check green (No broken links.)
- ⚠️ Accessibility basics: good baseline (landmarks, focus-visible, aria-expanded, ESC). Minor: some buttons lack explicit aria-labels in slider dots; verify per instance
- ✅ Performance basics: LCP hero marked eager/high priority, images lazy with dimensions; no blocking JS; no console errors observed in tooling
- ⚠️ SEO basics: category/product have static title/meta/canonical; not yet dynamic per taxonomy/product data
- ✅ Content state: demo fixtures present (categories/products), no lorem gaps on key pages
- ✅ Hyvä/Magento readiness: component map valid, JS Alpine-friendly, only `window.toast` global
- ✅ PR readiness: format/lint scripts present; link-check script present; PR template present

Top 10 issues (Impact × Effort) and recommended fix
1) SEO: dynamic head for category/product (High × Medium) — In Hyvä, populate `<title>`, meta description, canonical via layout/view models; map `catTitle`/PDP name to head
2) ESLint warnings for unused vars (Medium × Low) — Prefix unused with `_` or remove; affects `assets/js/category.js`, `nav.js`, `toasts.js`
3) Fonts over network (Medium × Low) — Consider self-hosting Plus Jakarta Sans in theme to avoid external calls in production
4) Slider dots A11y (Medium × Low) — Ensure buttons have `aria-label` (already set) and visible focus; add `aria-current="true"` to active dot
5) Breadcrumb/heading duplication (Low × Low) — Confirm single H1 per page; category header already ok; ensure other partials don’t introduce duplicate H1s
6) Canonical URLs static (Medium × Low) — Replace hardcoded Netlify canonical with Magento base URL + route helper
7) Link-check scope (Low × Low) — Script now falls back to project root; keep ignore list synced with planned CMS pages
8) Images: ensure width/height everywhere (Medium × Low) — Most have dimensions; continue enforcing in templates
9) Reduced motion (Low × Low) — Already respected; audit any new animations for `prefers-reduced-motion`
10) Build comfort (Low × Low) — Add `browserslist` update note/command to README or postinstall

Quick wins applied
- package.json: set `type: "module"` to silence ESLint module warning
- package.json: hardened `check:links` to avoid ENOENT when `dist/` is absent

Short diff
```diff
  "private": true,
 +"type": "module",
@@
- "check:links": "node tools/check-links.mjs dist || node tools/check-links.mjs .",
+ "check:links": "node -e \"const fs=require('fs');process.exit(fs.existsSync('dist')?0:1)\" && node tools/check-links.mjs dist || node tools/check-links.mjs .",
```

Next steps for Hyvä handover
- Wire head blocks: map category/product data to `<title>`, description, canonical in PHTML/layout XML
- Replace client partial injection with server-side blocks; keep IDs/classes/data-attrs
- Port `window.toast` to Alpine component (optional) and swap minicart with Hyvä checkout/minicart
- Keep tokens/utilities consistent (`btn`, `pill`, `card`, `border-light`); no gradients; weights 800/900
- Ensure images in CMS blocks include explicit dimensions and `loading="lazy"`
- Remove any external font calls if self-hosting is chosen

Build/lint/link-check results
- Build: OK (Tailwind CLI, ~2.4s)
- Lint: 0 errors, 12 warnings (unused vars) — safe to address later
- Link-check: No broken links

