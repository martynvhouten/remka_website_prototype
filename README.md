# Remka static showcase (Hyvä-ready)

Statische referentiesite voor een Magento 2 Hyvä child theme. Pure HTML, Tailwind via CDN, minimale JS.

## Structuur
```
/assets/images/ (logo-remka.svg + placeholders)
/assets/css/base.css
/assets/js/menu.js
/assets/js/index.js
/partials/header.html
/partials/footer.html
/data/categories.json (optioneel; aanwezig in dit project)
index.html
/netlify.toml
.editorconfig
README.md
```

## Menu (data-gedreven)
- Data komt uit `/data/categories.json` (vorm: `{ id, name, slug, count, children[] }`).
- Items met `count===0` worden verborgen. Geen JSON beschikbaar? Dan fallback naar ingebouwde demo-data in `assets/js/menu.js`.
- Desktop: mega menu opent via hover/click; mobiel: off-canvas. A11y: `aria-expanded`, `aria-controls`, ESC, focus trap, pijltjesnavigatie.

## Logo
- Plaats je echte logo op: `/assets/images/logo-remka.svg` (vervang placeholder met dezelfde bestandsnaam).

## Tokens & styling
- Tokens in `assets/css/base.css`:
  - `--brand:#9E0059; --accent:#F77F00; --teal:#00A99D; --dark:#333333; --light:#E6E6E6;`
- Utilities: `.btn`, `.card`, `.focus-ring`, container-breedtes, sr-only skiplink.
- Font: Plus Jakarta Sans (display=swap) via Google Fonts.

## Ontwikkelen
- Open `index.html` lokaal. `header.html` en `footer.html` worden client-side ingeladen, daarna initialiseert het mega menu.

## Netlify
- `netlify.toml` publiceert vanaf de projectroot (`.`). Geen build-stap nodig.