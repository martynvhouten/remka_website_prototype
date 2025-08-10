# Remka website prototype (Hyvä-ready)

Statische referentiesite voor een Magento 2 Hyvä child theme. HTML + Tailwind (CDN) + minimale JS.

## Starten

- Open `index.html` lokaal in je browser.
- Partials uit `partials/` worden client-side ingeladen door `assets/js/index.js`.

## Structuur
```
/assets/images/
/assets/css/base.css
/assets/js/menu.js
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

## Hyvä mapping

Zie `docs/hyva-porting.md` voor PHTML-bestemmingen en aanpassingen.

## Conventies

- Tokens: `--brand`, `--accent`, `--teal`, `--dark`, `--light` (zie `assets/css/base.css`).
- Tailwind: gebruik `border-light` i.p.v. `border-gray-200`; knoppen `btn btn-brand|btn-accent|btn-outline`.
- A11y: juiste landmarks, aria-attributen, `loading="lazy"` voor afbeeldingen.

## Demo functionaliteit

- Minicart: offcanvas met badge, openen via winkelmand in header. Data in `localStorage` (`remka_demo_cart`).
- Add to cart: knoppen met `data-add-to-cart` attributen voegen producten toe en openen minicart.
- Checkout: tweestaps demo (`checkout-shipping.html` → `checkout-payment.html` → `checkout-success.html`).