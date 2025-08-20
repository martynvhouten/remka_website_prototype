Add-to-Cart Dialog QA checklist

- Mobile and desktop layouts render correctly (max width ~640–720px)
- Added item shows thumbnail, name (link to PDP), attributes, qty × unitPrice = linePrice
- Cart summary shows items count and subtotal with correct currency
- CTAs:
  - “Ga naar afrekenen” routes to checkout
  - “Bekijk winkelwagen” routes to cart
  - “Verder winkelen” closes dialog
- Dialog behavior:
  - Opens on add-to-cart
  - ESC closes
  - Click outside closes
  - Focus is trapped; returns to invoker on close
  - Background scrolling is disabled while open
  - ARIA live announces success
- Recommendations:
  - Rail loads lazily
  - Items show image, name, price, and an Add button
  - Empty state is shown when none available
  - Clicking Add re-opens dialog with the new item
- Performance:
  - Images lazy load
  - No long tasks/blocking reflows on open
- Analytics (if dataLayer exists):
  - add_to_cart_dialog_open with sku and timeToOpenMs
  - add_to_cart_dialog_cta_click with cta
  - add_to_cart_dialog_reco_add with sku

