## Component map → Hyvä/Magento

- Header/mega menu: `partials/header.html` → `Magento_Theme::html/header.phtml` + blocks; mega via custom block/template.
- Footer: `partials/footer.html` → `Magento_Theme::html/footer.phtml`.
- Product card: `components/ProductCard.html` + `assets/js/productCard.js` → Hyvä component (`Magento_Catalog::product/list.phtml` item renderer) of child theme.
- PLP (category): `category.html` + partials (`category-*.html`) → `Magento_Catalog::category/view.phtml` en subblokken (toolbar, layered nav).
- PDP (product): `product.html` + `partials/product-*.html` → `Magento_Catalog::product/view.phtml` en children.
- Minicart (prototype): `partials/minicart-drawer.html` → vervangen door Hyvä Minicart; JS losstaand.
- Toasts: `assets/js/toasts.js` + styles in `assets/css/base.css` → optioneel Alpine component in child theme.
- Brands wall: `partials/brands-*.html` + `assets/js/brands.js` → CMS blok of custom module block template.
- Slider: `components/slider/slider.html` + `assets/js/slider.js` → herbruikbare snippet; init via data-attributen.

JS guidelines

- Gebruik data-attributes: `[data-nav]`, `[data-slider]`, `[data-add-to-cart]`.
- Geen globale collisions: enkel `window.toast` als publieke API.
- Event delegatie waar mogelijk; ESC sluit overlays; respecteer `prefers-reduced-motion`.


