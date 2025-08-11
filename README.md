# Remka website prototype (Hyvä-ready)

Statische referentiesite voor een Magento 2 Hyvä child theme. HTML + Tailwind + minimale JS.

## Starten

- npm install
- npm run dev
- Partials uit `partials/` worden client-side ingeladen door `assets/js/index.js`.

## Build

- npm run build (genereert `assets/css/tailwind.css`)

## Structuur
```
/assets/images/
/assets/css/base.css
/assets/js/nav.js
/assets/js/index.js
/partials/
/data/categories.json
index.html
product.html
category.html
blog.html, blog-post.html
docs/hyva-porting.md
```

## Component-partials

- Header/footer: `partials/header.html`, `partials/footer.html`
- Home: `home-hero.html`, `home-usp.html`, `home-categories.html`, `home-features.html`, `home-popular-products.html`, `home-blog-teaser.html`
- Product: `product-gallery.html`, `product-info.html`, `product-related.html`
 - Components: `components/ProductCard.html` (template)

## Hyvä mapping

Zie `docs/hyva-porting.md` voor PHTML-bestemmingen en aanpassingen.

## Conventies

- Tokens: `--brand`, `--accent`, `--teal`, `--dark`, `--light` (zie `assets/css/base.css`).
- Tailwind: gebruik `border-light` i.p.v. `border-gray-200`; knoppen `btn btn-brand|btn-accent|btn-outline`.
- Cards CTA: gebruik `btn-card` voor consistente knopgrootte op kaarten.
- A11y: juiste landmarks, aria-attributen, `loading="lazy"` voor afbeeldingen.

## Demo functionaliteit

- Minicart: offcanvas met badge, openen via winkelmand in header. Data in `localStorage` (`remka_demo_cart`).
- Add to cart: knoppen met `data-add-to-cart` attributen tonen een cart-toast en openen de minicart.

## Toasts (unified)

API beschikbaar op `window.toast`:

```js
toast.success('Ingelogd');
toast.error('Er ging iets mis');
toast.info('Informatie');
toast.warning('Let op');
toast.cart({ title: 'Toegevoegd aan winkelmand', qty: 2, thumbnail: '/img.jpg' }, { actionText: 'Bekijk winkelwagen' });
```

Gedrag: max 3 zichtbaar, rest in wachtrij; autodismiss na 3.5s; pauze bij hover; ESC/✕ sluit; mobiel onderin, desktop rechtsboven. Cart-variant bevat acties “Bekijk winkelwagen” (opent minicart of navigeert naar `/cart.html`) en “Verder winkelen”.

## ProductCard component

Gebruik de herbruikbare kaart via de template en JS helper.

1) Zorg dat de template is ingeladen (placeholder aanwezig) en script geladen:

```html
<div data-partial="components/ProductCard"></div>
<script src="/assets/js/productCard.js" defer></script>
```

2) Maak een kaart via JS:

```js
const card = ProductCard.create({
  url: '/product.html',
  title: 'Voorbeeldproduct',
  imageSrc: '/assets/images/placeholder-square.svg',
  imageAlt: 'Voorbeeldproduct',
  price: 12.95,
  compareAtPrice: 14.95,
  sku: 'SKU-123',
  badges: ['Nieuw'],
  availability: 'inStock', // inStock | backorder | outOfStock
  ratingValue: 4.7,
  ratingCount: 23
});
grid.appendChild(card);
```

- Checkout: tweestaps demo (`checkout-shipping.html` → `checkout-payment.html` → `checkout-success.html`).