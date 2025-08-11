Remka Hyvä child theme prototype – audit report

Gevonden & gefixt
- Inline handlers verwijderd: checkout/contact formulieren → `data-navigate` met unobtrusive JS in `assets/js/index.js`.
- Inline footer script vervangen: jaartal gezet via `assets/js/index.js`.
- Tailwind tokens geharmoniseerd: `text-gray-600/700` → `text-dark/70|80`, `hover:bg-gray-50` → `hover:bg-light/40`, `border-gray-300` → `border-light`.
- Sitemap tree: geen inline styles; consistente hover/indentatie utilities.
- Menu mobiele login-link gecorrigeerd naar `account-login.html`.
- DEVNOTE’s toegevoegd als placeholders (CMS/PHTML te vullen).
- Geen `!important` of `style=""` meer; geen inline `<script>` (behoudens externe Tailwind CDN); geen `console.log`/`debugger`.
- Alle afbeeldingen voorzien van `alt` en waar zinvol `loading="lazy"`.
- Interne links naar bestaande demo-pagina’s gecheckt in header/footer/partials.

Korte kwaliteitsnotities
- HTML semantisch: landmarks aanwezig, ARIA gebruikt waar nodig.
- CSS minimalistisch/token-gedreven; geschikt voor Tailwind mapping in Hyvä.
- JS modulair, geen globale bijwerkingen buiten prototypes (minicart blijft demo).

Restpunten (bewust niet automatisch uitgevoerd)
- Tailwind integratie: definieer tokens in Hyvä `tailwind.config.js`, verwijder Tailwind CDN refs in Magento.
- PHTML mapping: partials als Magento templates/blocks opnemen; partial loader uitschakelen.
- Collections & data: vervang demo-collecties door Magento product/category collections.
- Minicart/Checkout: vervang demo-cart door Hyvä minicart/Hyvä Checkout.
- SEO: per template unieke title/description via layout/blocks; structured data toevoegen (Product/Breadcrumb).
- i18n: statische strings via `__()` en vertalingen.

