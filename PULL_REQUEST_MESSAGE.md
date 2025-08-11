Titel: Final audit – Hyvä/Tailwind cleanup en handover docs

Doel
- Codebase opschonen en Hyvä-ready maken: consistent Tailwind-gebruik, semantische HTML, a11y, en unobtrusive JS. Duidelijke overdracht naar Magento implementatie.

Wat is er gedaan
- Inline event handlers verwijderd; formulieren gebruiken `data-navigate` + centrale handler.
- Inline footer script verwijderd; jaartal via JS op DOM ready.
- Tailwind utilities geharmoniseerd (tokens `brand/accent/teal/dark/light`): grijs-klassen vervangen, hover-achtergronden geünificeerd, `border-light` i.p.v. `border-gray-300`.
- Sitemap JS ontdaan van inline styles; Tailwind margin utilities voor nesting.
- Mobiel menu: login-link gecorrigeerd.
- DEVNOTE’s toegevoegd als placeholders voor CMS/PHTML.
- Bevestigd: geen `!important`, geen inline `style`, geen `console`/`debugger`. Afbeeldingen met `alt` en `loading="lazy"` waar zinvol.

Wat Magento/Hyvä nog moet (aparte DEVNOTE)
- Tailwind config in child theme, CDN verwijderen, PHTML mapping van partials, collections aansluiten, Hyvä minicart/checkout, structured data, i18n.

Testen/Review
- Handmatige review van alle templates/partials.
- Navigatie-links in header/footer/partials leiden naar bestaande demo-pagina’s.

Impact
- Frontend is klaar voor directe port naar Hyvä child theme; minimale rework nodig in PHTML/Alpine.

