Magento 2 / Hyvä handoff – takenlijst

Tailwind/Assets
- Definieer Tailwind tokens in child theme `tailwind.config.js`:
  - colors: brand, accent, teal, dark, light
  - fontFamily.sans: Plus Jakarta Sans
- Genereer CSS via Hyvä build; verwijder Tailwind CDN scripts in PHTML.
- Verplaats `assets/css/base.css` tokens naar Tailwind waar mogelijk; behoud enkel noodzakelijke component-CSS.

Templates (PHTML mapping)
- Header/Footer: kopieer `partials/header.html` en `partials/footer.html` naar `Magento_Theme/templates/html/*.phtml` en vervang logo/menus door Magento helpers/blocks.
- Home-secties: map `partials/home-*` als CMS blocks of PHTML templates in Magento_Theme.
- Product/Categorie: map `partials/product-*` en `partials/category-*` naar bestaande Hyvä templates; vervang dummy content met collections/blocks.
- Blog: map `partials/blog-*` naar blogmodule templates of CMS blocks.

JS
- `assets/js/index.js`: partial-loader uitschakelen in Magento; behoud evt. FAQ-accordion en jaarinjectie of verplaatsen naar theme main bundle.
- `assets/js/nav.js`: integreer met Hyvä/Alpine voor hoofdmenu/offcanvas; laat data van Magento komen (navigatie tree).
- `assets/js/category.js`/`sitemap.js`/`brands.js`: vervang demo-data door Magento data of verwijder indien Hyvä componenten worden gebruikt.

Functionaliteit
- Minicart/Checkout: activeer Hyvä minicart en Hyvä Checkout; verwijder demo cart code.
- Collections: product/category data uit Magento collections laden voor grids/strips.
- Zoek: vervang statische zoekvelden door Magento/Algolia/Elastic plugin indien van toepassing.

SEO/A11y
- Titles/meta: configureer per pagina via layout XML/blocks. Voeg `og:*` waar nodig toe.
- Structured data: voeg JSON-LD (Product, BreadcrumbList) op product/categorie.
- i18n: vervang strings door `__()` en vertaalbestanden.

Content/Media
- Vervang placeholders (merken, blog, kaarten) door echte assets/CMS-content.
- Herzie betaaliconen als CMS static block of theme images.

Technisch
- Zet caching, merging/minification, HTTP/2 push/preload conform Hyvä best practices.
- Voeg linting/formatter toe in theme repo voor consistentie.

