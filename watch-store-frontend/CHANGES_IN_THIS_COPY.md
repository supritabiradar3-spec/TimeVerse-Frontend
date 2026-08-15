# Changes in this corrected copy

Only targeted stability/UI fixes were applied:

- `js/api.js`: stale JWT detection and cleaner 401/expired-token 403 handling; fresh login clears stale auth state.
- `components/navbar.js`: added persistent light/dark theme toggle.
- `css/style.css`: added light-theme variables and common light-theme overrides.
- `css/navbar.css`: added theme-toggle styling.
- `css/product.css`: constrained product images to prevent excessive zoom.
- `pages/wishlist.html`: constrained wishlist watch images.
- `js/cart.js`: constrained cart watch thumbnails.

No database records were changed and no product/order/payment data was hardcoded.
