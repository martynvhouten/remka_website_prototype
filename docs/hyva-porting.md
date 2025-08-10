## Hyvä porting gids

Deze gids helpt om de prototype-partials 1-op-1 over te zetten naar Hyvä (Magento 2).

### Mapping: partial → Magento template

- `partials/header.html`
  - COPY TO PHTML: `Magento_Theme/templates/html/header.phtml`
  - Opmerkingen: integreer Hyvä navigatie en zoekblok; vervang hardcoded logo door `getLogoSrc()` en `getLogoAlt()` helpers.

- `partials/footer.html`
  - COPY TO PHTML: `Magento_Theme/templates/html/footer.phtml`
  - Vervang jaartal-script door Magento copyright block indien gewenst.

- Home
  - `partials/home-hero.html` → `Magento_Theme/templates/html/home/hero.phtml` of CMS home content.
  - `partials/home-usp.html` → `Magento_Theme/templates/html/home/usp.phtml` of CMS block.
  - `partials/home-categories.html` → `Magento_Catalog/templates/category/list.phtml` (featured) of CMS block met widgets.
  - `partials/home-features.html` → CMS block of eigen module.
  - `partials/home-popular-products.html` → `Magento_Catalog/templates/product/list/home_popular.phtml` met product-collectie.
  - `partials/home-blog-teaser.html` → CMS block of blog-module template.

- Product
  - `partials/product-gallery.html` → `Magento_Catalog/templates/product/view/gallery.phtml` (Hyvä gallery component).
  - `partials/product-info.html` → `Magento_Catalog/templates/product/view/details.phtml` (titel/prijs/CTA).
  - `partials/product-related.html` → `Magento_Catalog/templates/product/list/related.phtml` (collection via layout XML).

- Categorie
  - `partials/category-header.html` → `Magento_Catalog/templates/category/header.phtml`
  - `partials/category-filters.html` → `Magento_LayeredNavigation/templates/layer/view.phtml` of toolbar-template
  - `partials/category-subgrid.html` → `Magento_Catalog/templates/category/list/children.phtml`
  - `partials/category-productlist.html` → `Magento_Catalog/templates/product/list.phtml`

- Blog
  - `partials/blog-header.html` → blogmodule list-header
  - `partials/blog-grid.html` → blogmodule list-grid
  - `partials/blogpost-hero.html` → blogmodule post-hero
  - `partials/blogpost-body.html` → blogmodule post-content

- CMS content
  - `partials/content-hero.html` → generieke CMS page hero/header

### Tailwind en tokens

- Tailwind utilities blijven leidend; tokens in `assets/css/base.css` (CSS variabelen) corresponderen met Hyvä Tailwind config:
  - Colors: `brand`, `accent`, `teal`, `dark`, `light`
  - Fonts: `fontFamily.sans` op Plus Jakarta Sans
  - Gebruik `border-light` i.p.v. `border-gray-200` voor consistentie.
  - Knoppen: gebruik `btn btn-brand|btn-accent|btn-outline` (vermijd `btn--accent`).

### Landmarks & a11y

- Gebruik `header[role="banner"]`, `main`, `footer[role="contentinfo"]`, `nav[aria-label]`.
- Menu-knoppen hebben `aria-expanded` en Escape/Arrow-keys; behoud dit in PHTML/Alpine.
- Afbeeldingen `loading="lazy"`; meaningful `alt`.

### Integratie-aanwijzingen

- Verplaats scripts:
  - `assets/js/nav.js` → inline module of bundel; in Hyvä kun je Alpine gebruiken voor toggle/mega.
  - `assets/js/index.js` partial loader vervalt; PHTML include/blocks nemen dit over.
- CSS:
  - Zet token-variabelen om naar Tailwind config (`tailwind.config.js` van Hyvä) en verwijder dubbele `.btn` definities na migratie.

### Component blueprints (cards)

- Product card (grid/list)
  - Container: `a.card.card--hover.p-4.flex.flex-col`
  - Afbeelding: `img.rounded-md.border.border-light` met `loading="lazy"` en correcte `alt`
  - Merk: `div.mt-3.text-sm.text-dark/70`
  - Titel: `h3.mt-1.font-semibold.text-dark`
  - Prijs: `div.mt-2.font-semibold`

- Blog card
  - Container: `a.card.card--hover.overflow-hidden`
  - Afbeelding: `img` lazy
  - Meta: `div.text-xs.text-dark/70`
  - Titel: `h3.mt-1.font-semibold`
  - Samenvatting: `p.mt-2.text-sm.text-gray-700`

- Category tile
  - Container: `a.card.card--hover.p-4.flex.flex-col.items-center.text-center`
  - Afbeelding: `img.rounded-md.border.border-light` met aspect 1:1
  - Titel: `span.mt-3.font-medium`


