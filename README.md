# U.I Cafe: front end (HTML, CSS, JavaScript only)

Design: Figma "U.I Cafeteria" page 2 (warm cream and espresso). No frameworks, no build step.

## How to open
Extract the zip first (do not open files from inside the zip), then double-click `welcome.html`.
For live reload: VS Code + Live Server extension. Fonts load from Google Fonts (needs internet).

## Pages
welcome, signin, signup, menu (+ soup picker), cart, payment, payment-result, order, admin

## HTML contract ids (unchanged)
login-btn, login-matric, search-meals, .add-cart-btn[data-id], checkout-btn.
Other ids: btn-pay, btn-cancel, btn-clear-cart, btn-logout, btn-signup-submit, forgot-password,
.btn-qty-plus / .btn-qty-minus, .btn-soup-select, .btn-cancel-operation, .btn-action.
Order statuses are exactly the database values: Pending, Paid, Ready, Cancelled.

## Backend handoff
No fetch()/AJAX anywhere. Attach logic through `UICafe.hooks.*` (list at the top of `js/app.js`),
then set `UICafe.config.DEMO_MODE = false`. DEMO_MODE fakes login/orders in localStorage so the flow can be previewed.
Preview tips: `order.html?status=Paid`, `payment-result.html?status=failed&order=1027`, `payment.html?simulate=fail`.
Demo login: any ID/password (8+ chars to sign up); IDs starting with `STAFF-` open admin.html.

## Images
Meal photos live in `images/meals/<slug>.jpg|webp` (slug = meal name, lower-case, dashes). Welcome hero: `images/hero.jpg`.
The 4 soups (egusi-soup, ewedu, ogbono-soup, okro) have no photo yet and show an emoji tile.
To add or replace a photo, drop a file with the same name in `images/meals/`.
If a photo is missing, the card falls back to a category emoji automatically.
