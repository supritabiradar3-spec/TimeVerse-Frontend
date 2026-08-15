# TimeVerse Watch Store: Comprehensive Interview Preparation Guide

This guide contains **50 Frontend** and **50 Backend** interview questions and detailed answers based on the **TimeVerse Watch Store** E-Commerce project. The answers are designed for Software Developer, Java Full Stack, and Spring Boot interviews at both service-based companies (TCS, Infosys, Wipro, HCL, Cognizant, Capgemini, Accenture) and product-based companies (Amazon, Microsoft, Oracle, Adobe, Zoho, Freshworks, IBM).

---

## Part 1: Frontend Interview Questions (1-50)

### Section A: HTML, CSS & Bootstrap (Questions 1-15)

#### Q1. How is the layout of the TimeVerse E-Commerce storefront structured using Bootstrap 5?
* **Interview Context:** Common in TCS and Infosys UI interviews to test layout understanding.
* **Answer:** 
The TimeVerse storefront uses a modern, responsive layout structured with HTML5 semantic tags and Bootstrap 5. 
- **Header/Navbar:** Built using `<nav>` with Bootstrap's `.navbar`, `.navbar-expand-lg`, `.bg-dark`, and `.navbar-dark`. It stays stuck to the top using `.sticky-top`.
- **Hero Banner:** Uses a header wrapper with custom CSS for glassmorphism and deep steel/gold themes.
- **Product Gallery:** Uses a container (`.container` or `.container-fluid`) containing grid rows (`.row`) and columns (`.col-sm-6 .col-md-4 .col-lg-3`) to lay out watch cards.
- **Footer:** Structured using `<footer>` with links to categories, social icons, and newsletter sign-up.

#### Q2. What is the grid system in Bootstrap and how is it used to display the product cards responsively in TimeVerse?
* **Interview Context:** Standard Bootstrap question asked at Wipro, Capgemini, and Cognizant.
* **Answer:** 
Bootstrap's grid system is a mobile-first, 12-column system based on Flexbox. It uses containers (`.container`), rows (`.row`), and columns (`.col-*`) to align content.
In TimeVerse, we display watch cards responsively using break-point classes:
```html
<div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
  <!-- Watch Card component -->
</div>
```
* **Explanation:** 
- `col-12`: Shows 1 card per row on extra-small mobile screens (full width).
- `col-sm-6`: Shows 2 cards per row on small screens (tablets).
- `col-md-4`: Shows 3 cards per row on medium screens (laptops).
- `col-lg-3`: Shows 4 cards per row on large screens (desktops).
This allows the catalog to adapt dynamically without writing custom CSS media queries.

#### Q3. How did you implement the navigation bar in TimeVerse with distinct views for ADMIN and CUSTOMER?
* **Interview Context:** Tests conditional rendering and layout design.
* **Answer:** 
The navigation bar uses Bootstrap structure and dynamically changes based on the user's role stored in `localStorage` after a successful login.
1. **Default/Visitor View:** Displays standard links (Home, Products, Categories, Search, Cart icon, Login, and Register).
2. **CUSTOMER View:** Displays the shopping cart icon with a badge, a "My Orders" link, a "Profile" link, and a "Logout" button.
3. **ADMIN View:** Replaces the cart icon and customer links with admin-only dashboard options: "Manage Products", "Manage Categories", "Orders Dashboard", and a "Logout" button.
- *Implementation:* The frontend JavaScript reads the token's payload on page load. If `userRole === 'ROLE_ADMIN'`, JavaScript sets the admin menu wrapper's style to `display: flex` and hides the customer-specific cart menu.

#### Q4. How do you implement custom CSS variables in TimeVerse for branding colors like deep steel and metallic gold?
* **Interview Context:** Tests modern CSS knowledge.
* **Answer:** 
We define CSS Custom Properties (variables) in the `:root` pseudo-class of our custom stylesheet. This maintains color consistency and makes themes easy to update.
```css
:root {
  --primary-steel: #1a252f;
  --accent-gold: #d4af37;
  --accent-gold-hover: #b8972e;
  --bg-light: #f8f9fa;
  --text-dark: #212529;
}
```
We apply these values in our CSS using the `var()` function:
```css
.watch-card .price-tag {
  color: var(--accent-gold);
}
.btn-gold {
  background-color: var(--accent-gold);
  color: var(--primary-steel);
}
.btn-gold:hover {
  background-color: var(--accent-gold-hover);
}
```

#### Q5. How is the sidebar cart/drawer styled and toggled in your frontend?
* **Interview Context:** Practical UI design and interaction question.
* **Answer:** 
The slide-out shopping cart uses a combination of custom CSS and JavaScript toggling, or Bootstrap 5's Offcanvas component.
- **Offcanvas implementation:** 
We use the `.offcanvas` and `.offcanvas-end` classes on a `div` element to define a drawer that slides in from the right edge of the screen:
```html
<div class="offcanvas offcanvas-end bg-dark text-white" tabindex="-1" id="cartDrawer">
  <div class="offcanvas-header border-bottom border-secondary">
    <h5 class="offcanvas-title">Your Cart</h5>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body" id="cartItemsContainer">
    <!-- Dynamic Cart Items loaded from JS -->
  </div>
</div>
```
It is triggered from the navbar cart icon with the attributes `data-bs-toggle="offcanvas"` and `data-bs-target="#cartDrawer"`.

#### Q6. What is the difference between `position: absolute`, `relative`, and `fixed` in CSS, and where did you use them in the UI?
* **Interview Context:** Foundational CSS layout question.
* **Answer:** 
- **`relative`:** Positioned relative to its normal flow. It acts as a reference boundary for absolutely positioned children. Used on the `.product-card-wrapper` to keep badges positioned correctly.
- **`absolute`:** Positioned relative to its closest positioned ancestor (usually a `relative` parent). We use it to place the **"Sale"** or **"Out of Stock"** badges in the top-left corner of the watch image inside the product card.
- **`fixed`:** Positioned relative to the viewport; it stays in the exact same place even when the page is scrolled. We use it for the floating "Scroll to Top" button and the sticky navbar (`.fixed-top`).

#### Q7. How does the Bootstrap modal work for OTP verification and password reset?
* **Interview Context:** Bootstrap JS APIs and form interaction.
* **Answer:** 
Bootstrap modals use classes like `.modal`, `.modal-dialog`, `.modal-content`, and `.fade`.
In TimeVerse, we use a single modal for **OTP Verification** that is triggered during user registration, login, and forgot-password flows.
- **Trigger:** JavaScript shows the modal programmatically when the backend successfully triggers an OTP (returning a success response status).
```javascript
const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
otpModal.show();
```
- **OTP Fields:** The modal body contains a form with an input field to enter the 6-digit OTP code, a countdown timer label, and a "Verify" button.

#### Q8. How are the validation state styles (`.is-invalid`, `.is-valid`) applied to the login form?
* **Interview Context:** Form validation styles in Bootstrap.
* **Answer:** 
Bootstrap handles native form validation feedback using classes like `.was-validated` on the `<form>`, or manually applying `.is-invalid`/`.is-valid` to individual form inputs via JavaScript.
In TimeVerse, when the user clicks the login button:
1. JavaScript checks if the input is empty or does not match email pattern.
2. If invalid, the JS appends `.is-invalid` class to the input element and displays the sibling `.invalid-feedback` text containing the validation message.
3. If valid, the JS removes `.is-invalid` and appends `.is-valid`.
```javascript
if (!email.includes("@")) {
    emailInput.classList.add("is-invalid");
} else {
    emailInput.classList.remove("is-invalid");
    emailInput.classList.add("is-valid");
}
```

#### Q9. Explain how you achieved the glassmorphism effect in the Hero section of the watch store.
* **Interview Context:** Creative CSS styling asked at product companies (Zoho, Adobe) to test aesthetic skills.
* **Answer:** 
Glassmorphism is styled using a semi-transparent background color (`rgba`), a blur filter, and a subtle border. We use the following properties in TimeVerse:
```css
.hero-glass-panel {
  background: rgba(26, 37, 47, 0.6); /* Semi-transparent dark background */
  backdrop-filter: blur(12px);       /* Blurs whatever is behind the panel */
  -webkit-backdrop-filter: blur(12px); /* Safari support */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle glowing white border */
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
```

#### Q10. What is a flexbox, and how did it help align the price, rating, and add-to-cart buttons in product cards?
* **Interview Context:** Essential CSS alignment tool.
* **Answer:** 
Flexbox (Flexible Box Layout) is a one-dimensional layout model that distributes space and aligns items inside a container.
In our `.watch-card-body`, we use flexbox to align items vertically and distribute space:
```css
.watch-card-body {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.watch-card-footer {
  display: flex;
  justify-content: space-between; /* Pushes price to left and button to right */
  align-items: center;            /* Vertically centers them */
  margin-top: auto;               /* Pushes the footer block to the absolute bottom of the card */
}
```
This ensures that even if watch titles have different lengths, all prices and checkout buttons line up perfectly in a row.

#### Q11. How do you prevent layout shifts (CLS) when loading high-resolution images of watches?
* **Interview Context:** Tests frontend optimization and Core Web Vitals knowledge.
* **Answer:** 
Cumulative Layout Shift (CLS) occurs when elements shift on screen as dynamic content/images load. To prevent this in TimeVerse:
1. We specify explicit `width` and `height` aspect ratio placeholders on image tags.
2. We wrap watch images inside a fixed-aspect-ratio container with a background loading skeleton:
```css
.image-container {
  aspect-ratio: 1 / 1;
  background-color: #2c3e50; /* A dark placeholder matching our theme */
  position: relative;
  overflow: hidden;
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```
This allocates the exact space for the watch image in the DOM layout before the image file is actually downloaded.

#### Q12. What Bootstrap utility classes did you use to manage spacing (margins and paddings) across the layout?
* **Interview Context:** Basic Bootstrap syntax checks.
* **Answer:** 
Bootstrap uses the `{property}{side}-{size}` shorthand pattern:
- **Properties:** `m` (margin) and `p` (padding).
- **Sides:** `t` (top), `b` (bottom), `s` (start/left), `e` (end/right), `x` (left & right), `y` (top & bottom), and blank (all sides).
- **Sizes:** `0` (none) to `5` (large), and `auto`.
- *Examples in TimeVerse:*
- `mb-4`: Adds a margin-bottom of 1.5rem to product columns to separate rows.
- `py-5`: Adds padding to top and bottom of sections (like the Hero banner) for breathable spacing.
- `ms-auto`: Left-aligns margin automatically, pushing sibling items (like login/logout buttons in navbar) to the right.

#### Q13. How did you style the Cart badge showing the item count dynamically in the navbar?
* **Interview Context:** Dynamic styling and UI notification patterns.
* **Answer:** 
We place a badge wrapper inside the cart navigation item using Bootstrap badge helper classes:
```html
<a href="#" class="nav-link position-relative" id="cartButton">
  <i class="bi bi-cart3 fs-5"></i>
  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartBadge">
    0
  </span>
</a>
```
- **Styling:** The `.position-relative` parent container keeps the absolute-positioned badge relative to the cart icon. `.translate-middle` and `.bg-danger` style it as a red badge positioned on the top-right corner.
- **Dynamic update:** JavaScript updates the inner text of `#cartBadge` with `cart.length`. If the cart is empty, the JavaScript hides the badge by adding the class `d-none`.

#### Q14. What are CSS media queries and how do you ensure the product details page looks clean on mobile devices?
* **Interview Context:** Essential responsive web design technique.
* **Answer:** 
Media queries are CSS rules that apply styles depending on device characteristics like width, height, or orientation.
For the product details view, we split the design into two columns: watch image on left, details and checkout on right.
```css
/* Mobile view (default stack) */
.product-detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* Tablet and Desktop view */
@media (min-width: 768px) {
  .product-detail-grid {
    grid-template-columns: 1fr 1fr; /* Split layout */
    gap: 40px;
  }
}
```
This forces single-column vertical layout on mobile devices for easy scrolling, and side-by-side view on desktops.

#### Q15. How do HTML5 semantic elements like `<nav>`, `<main>`, `<article>`, and `<footer>` improve SEO for the watch store?
* **Interview Context:** Basic SEO and web standard questions.
* **Answer:** 
Semantic HTML tags clearly describe the meaning and purpose of elements to search engine crawlers and screen readers.
- `<nav>`: Tells crawlers where search pathways are (navigation).
- `<main>`: Contains the primary content (watch listing/details), ignoring repetitive header/footer headers.
- `<article>`: Used for each product card wrapper, indicating that each product is an independent, self-contained entity.
- `<footer>`: Tells search engine crawlers about the copyright, policies, and address pages.
Using semantic tags improves our search engine rankings because Google can easily index our watches and structure our website search results.

---

### Section B: JavaScript & Fetch API (Questions 16-30)

#### Q16. How does the Fetch API handle asynchronous communication with the Spring Boot backend during user login?
* **Interview Context:** Core AJAX question commonly asked at Capgemini, Accenture, and Wipro.
* **Answer:** 
The Fetch API is an asynchronous interface in JavaScript used to make HTTP network requests.
In the TimeVerse login flow:
1. The user enters email and password, then submits the form.
2. The JS interceptor prevents the default reload behavior.
3. The dynamic `fetch()` request initiates a `POST` to `/api/auth/login` containing the credentials serialized to a JSON string in the request body.
4. Because fetch is non-blocking (returns a Promise), JavaScript continues execution and waits for the response, processing it in the background.

```javascript
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailVal, password: passwordVal })
})
.then(response => response.json())
.then(data => {
  // Save OTP session and trigger OTP verification modal
})
.catch(error => console.error("Error logging in:", error));
```

#### Q17. What is event delegation and how did you use it for the "Add to Cart" buttons inside a dynamically populated list?
* **Interview Context:** High-frequency JS performance questions at Amazon and Zoho.
* **Answer:** 
Event delegation is a design pattern where we attach a single event listener to a parent container instead of attaching separate listeners to each individual child element. It works due to event bubbling (events rise up from target element to parent elements in the DOM tree).
- **TimeVerse application:** 
Watch cards are dynamically generated from an API fetch response. Instead of attaching a click event listener to every new button:
```javascript
document.getElementById('productListContainer').addEventListener('click', function(event) {
  if (event.target && event.target.classList.contains('add-to-cart-btn')) {
    const watchId = event.target.getAttribute('data-id');
    addToCart(watchId);
  }
});
```
This saves system memory and handles dynamically rendered product lists without rebinding event listeners.

#### Q18. Explain the difference between `localStorage` and `sessionStorage`, and which one you used to store the JWT token.
* **Interview Context:** Session storage and persistent data stores.
* **Answer:** 
- **`localStorage`:** Stores data with no expiration time. The data remains saved even when the browser tab or browser window is closed.
- **`sessionStorage`:** Keeps data only for the active browser session. The data is cleared as soon as the specific browser tab is closed.
- **TimeVerse decision:** We store the JWT token and basic profile info (username, email, userRole) in `localStorage` so customers do not have to log in again every time they open a new tab or revisit the store. We clear this storage when the user logs out.

#### Q19. How do you format currency values (e.g., INR or USD) for the watch prices using JavaScript?
* **Interview Context:** Number formatting in e-commerce applications.
* **Answer:** 
We use the native JavaScript utility class `Intl.NumberFormat`. This correctly formats numeric values based on local currency symbols and decimal formats.
```javascript
const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0
});

console.log(priceFormatter.format(25999)); 
// Output: ₹25,999
```
This is applied dynamically to the product card render loops, cart items list, and orders overview page.

#### Q20. What are Promises and how do you use `async/await` to handle fetch requests instead of `.then()` chaining?
* **Interview Context:** Modern asynchronous JS question asked at Zoho and Freshworks.
* **Answer:** 
A **Promise** is a placeholder object representing the eventual completion (or failure) of an asynchronous operation and its returning value.
`async/await` is syntactic sugar built on top of standard Promises to make asynchronous code write and look like synchronous code, improving readability.
- **Comparison:**
```javascript
// Promise .then() Chaining:
fetch('/api/products')
  .then(res => res.json())
  .then(data => renderProducts(data));

// Async/Await Alternative:
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    renderProducts(data);
  } catch (err) {
    showErrorNotification(err);
  }
}
```

#### Q21. How do you parse the JWT token on the frontend to check if the logged-in user is an ADMIN or CUSTOMER?
* **Interview Context:** Token payload extraction in SPA-like applications.
* **Answer:** 
A JWT consists of three parts separated by dots: Header, Payload, and Signature. The payload contains claims (like user email, id, and roles) encoded in Base64Url format.
To check roles on the client side, we split and decode the second part (payload) of the token:
```javascript
function getRoleFromToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    return decoded.role; // e.g., "ROLE_ADMIN" or "ROLE_CUSTOMER"
  } catch (e) {
    return null;
  }
}
```

#### Q22. How did you implement front-end validation (email regex, password length) before hitting the signup API?
* **Interview Context:** Client-side validation techniques.
* **Answer:** 
We write JavaScript validation helper functions to intercept the register submit event. This prevents hitting backend APIs with garbage data and saves server bandwidth.
```javascript
function validateRegisterForm(email, password, phone) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number standard
  
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!phoneRegex.test(phone)) {
    return "Please enter a valid 10-digit mobile number.";
  }
  return null; // No errors
}
```

#### Q23. What is the purpose of `event.preventDefault()` in the submission handler of the login form?
* **Interview Context:** Essential JavaScript form event handling.
* **Answer:** 
By default, HTML forms trigger a full page reload or navigate to the URL specified in the action attribute when the submit button is clicked.
In our single-page user flow for TimeVerse:
1. We intercept the submit event with a JS event listener.
2. We call `event.preventDefault()` as the very first line inside the event listener callback.
3. This stops the native browser action (reload).
4. This allows us to run local client-side validation first, display loading spinners, and invoke the dynamic backend API using Fetch.

#### Q24. How do you dynamically update the subtotal and grand total of the cart when a customer changes item quantity?
* **Interview Context:** Dynamic DOM calculations.
* **Answer:** 
The Cart state is managed as an array of items stored in memory and sync'd with `localStorage`.
1. Every card item has a quantity input element.
2. We attach a listener (change event) to the inputs.
3. When value changes, we update the quantity in the cart array matching that item ID.
4. We recalculate the totals using an accumulator loop:
```javascript
function updateCartTotals(cartItems) {
  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  document.getElementById('subtotalElement').innerText = priceFormatter.format(subtotal);
  // If we have taxes/delivery charges:
  const grandTotal = subtotal + 150; // flat standard delivery
  document.getElementById('grandTotalElement').innerText = priceFormatter.format(grandTotal);
  
  // Save updated state
  localStorage.setItem('cart', JSON.stringify(cartItems));
}
```

#### Q25. Explain the difference between `let`, `const`, and `var`, and where they are used in your scripts.
* **Interview Context:** Core JavaScript syntax.
* **Answer:** 
- **`var`:** Function-scoped, can be re-declared, and is hoisted. We do not use it in our codebase as it can lead to scoping bugs.
- **`let`:** Block-scoped, cannot be re-declared within the same block, but can be updated. We use it for variables that change state, like loops, quantity values, and total amounts (`let total = 0;`).
- **`const`:** Block-scoped, cannot be updated or re-declared. We use it for constants, imported configurations, static API endpoints, and references to DOM elements:
```javascript
const apiUrl = 'http://localhost:8080/api';
const loginForm = document.getElementById('loginForm');
```

#### Q26. How did you implement search auto-suggest or filtering of watches based on query parameters without reloading the page?
* **Interview Context:** URL manipulation and search techniques.
* **Answer:** 
1. We listen to the `input` event on the search bar.
2. We fetch products matching the search query from `/api/products?search=...`.
3. To update the search query dynamically in the URL address bar without causing a page refresh, we use the HTML5 History API:
```javascript
const newUrl = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(query)}`;
window.history.pushState({ path: newUrl }, '', newUrl);
```
4. This keeps the state shareable (crawlers and users can copy-paste the URL to search results directly) while keeping the frontend loading fluid.

#### Q27. How does front-end pagination work when loading products from the API page by page?
* **Interview Context:** Client-side integration of paginated data.
* **Answer:** 
When products are requested, the backend returns a page wrapper containing the list of products along with metadata like `currentPage`, `totalPages`, and `totalElements`.
1. We keep a tracking variable `let currentPage = 0;`.
2. When fetching products: `fetch(`/api/products?page=${currentPage}&size=8`)`.
3. We render the cards, then read `totalPages` to dynamically create page numbers at the bottom.
4. When a user clicks page "3", we set `currentPage = 2` (0-indexed) and re-trigger our load function.

#### Q28. What is the difference between `==` and `===` in JavaScript, and why is the latter preferred in checkouts?
* **Interview Context:** Fundamental JS comparison behavior.
* **Answer:** 
- `==` performs **loose equality** comparison (performs type conversion before comparing values). E.g., `5 == "5"` returns `true`.
- `===` performs **strict equality** comparison (compares both the value and the type). E.g., `5 === "5"` returns `false`.
- **Preference in TimeVerse:** We always use `===` to prevent comparison errors. For example, comparing cart quantities, user IDs, or API response status codes (e.g., `response.status === 200` rather than `200 == "200"`) ensures type-safety and reduces runtime checkout errors.

#### Q29. How do you handle network errors or server downtime in your `fetch()` operations to keep the user informed?
* **Interview Context:** Error boundaries and UX design.
* **Answer:** 
`fetch()` only rejects the promise when a real network failure occurs (like internet disconnect or server offline). It does *not* throw an error for bad HTTP codes like 404 or 500.
We wrap fetch inside error interception utility:
```javascript
async function executeApiCall(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Handles 400, 401, 500 etc.
      const errorMsg = await response.text();
      throw new Error(errorMsg || `Server responded with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    showToastNotification("Network connection lost. Please check if the server is running.");
    throw error;
  }
}
```

#### Q30. How do you clear user session data (JWT, profile, cart) on the frontend when the user clicks Logout?
* **Interview Context:** Session cleanup patterns.
* **Answer:** 
When the user clicks the Logout button, we run a logout process:
1. Make a POST request to `/api/auth/logout` sending the `Authorization` header containing the JWT, allowing the backend to blacklist the token signature.
2. Clear localStorage items containing user data:
```javascript
function performLogout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("user_profile");
  localStorage.removeItem("user_role");
  // Optional: clear cart if cart is server-backed, or keep local cart.
  window.location.href = "/login.html";
}
```

---

### Section C: Scenario-Based, Debugging & Coding (Questions 31-50)

#### Q31. Scenario: The user clicks the Razorpay payment button, but nothing happens. How do you debug this issue?
* **Interview Context:** Real-world payment gateway troubleshooting.
* **Answer:** 
I would debug the issue step-by-step:
1. **Open Browser Developer Tools (F12):** Check the **Console** tab for JavaScript errors. If it says `Razorpay is not defined`, it means the external script CDN `https://checkout.razorpay.com/v1/checkout.js` failed to load in the head of the HTML.
2. **Inspect the Network Tab:** Look for `/api/payments/create-order` backend request. 
   - If it returned a `500 Server Error`, the issue is in the backend (e.g., expired Razorpay key credentials or connection timeout).
   - If it returned `401 Unauthorized`, the client JWT expired before the payment request was fired.
3. **Trace Javascript execution:** Put a breakpoint at the click handler to verify if the button is properly hooked and input fields (name, email, order ID) are correctly populated.

#### Q32. Coding: Write a JavaScript function that debounces search inputs in the watch search bar.
* **Interview Context:** Extremely popular UI coding challenge at product companies like Zoho, Freshworks, and Amazon.
* **Answer:** 
Debouncing limits the execution of a function until a certain amount of time has elapsed since the last time it was called. This prevents making an API request on every single keypress.
```javascript
function debounce(func, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage in TimeVerse:
const fetchSearchResults = (query) => {
  fetch(`/api/products?search=${query}`)
    .then(res => res.json())
    .then(data => renderProductsList(data));
};

const handleSearchInput = debounce((event) => {
  fetchSearchResults(event.target.value);
}, 400); // Wait 400ms after final keystroke before querying backend

document.getElementById('searchBar').addEventListener('input', handleSearchInput);
```

#### Q33. Scenario: A customer adds an item to the cart, but the navbar badge count doesn't update. What could be the bug?
* **Interview Context:** State management and view updates.
* **Answer:** 
This typically occurs when the UI components are out of sync with the underlying state data:
1. **Cause:** The `addToCart()` function pushes the item to the cart array, but forgets to call the UI render updater function (`updateCartBadge()`) to write the new length to the DOM.
2. **Fix:** Ensure that whenever we modify `localStorage.getItem('cart')`, we trigger a common handler:
```javascript
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Bug fix: Explicitly update the badge layout immediately!
  updateCartBadge();
}
```

#### Q34. Coding: Write a JavaScript snippet to extract and decode the payload of a JWT token stored in `localStorage`.
* **Interview Context:** Tests standard token handling on the client side.
* **Answer:** 
```javascript
function getDecodedTokenPayload() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format");
    }
    const payloadBase64 = parts[1];
    const decodedString = atob(payloadBase64); // Decode Base64 string
    return JSON.parse(decodedString); // Convert back to JSON object
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
}
```

#### Q35. Scenario: The backend returns a CORS error when the frontend tries to call the register API. How do you fix this on the frontend vs backend?
* **Interview Context:** Cross-Origin Resource Sharing (CORS) details.
* **Answer:** 
- **The Issue:** The frontend is hosted on origin `http://localhost:3000` (or local file system) and is attempting to access a backend API on `http://localhost:8080`. The browser blocks this request because the server has not sent CORS headers.
- **Backend Fix (Recommended):** Add CORS configuration to the Spring Boot controllers or application. In TimeVerse, we use `@CrossOrigin(origins = "*")` at controller levels, or write a global configuration in `SecurityConfig`:
```java
// Spring Boot Security configuration:
.cors(cors -> cors.configure(http))
```
- **Frontend Fix:** If you cannot modify the backend, you must run a proxy server (e.g. configure webpack/vite proxy settings in your frontend build tool) to route requests via the same domain.

#### Q36. Coding: Write a function to check if the JWT token stored in the browser has expired.
* **Interview Context:** Token expiration checks.
* **Answer:** 
```javascript
function isTokenExpired() {
  const payload = getDecodedTokenPayload();
  if (!payload || !payload.exp) {
    return true; // Assume expired if token payload cannot be read
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
  return payload.exp < currentTimestamp;
}
```
If this returns `true`, we should automatically redirect the user to `login.html` and clear localStorage.

#### Q37. Scenario: A user opens two tabs of TimeVerse. They log out from one tab. How does the other tab handle API requests?
* **Interview Context:** LocalStorage sharing and token blacklisting.
* **Answer:** 
1. **Authentication Failures:** Both tabs share the same `localStorage`. Tab 1 clears the token when logging out. When Tab 2 tries to trigger an API (like checking out), it finds no token in local storage, or the server rejects the request with a `401 Unauthorized` response because the token is blacklisted.
2. **Graceful logout synchronization:** We can listen to changes in `localStorage` in other tabs to log them out automatically:
```javascript
window.addEventListener('storage', function(event) {
  if (event.key === 'jwt_token' && event.newValue === null) {
    // Token was removed (User logged out from another tab)
    window.location.reload();
  }
});
```

#### Q38. Coding: Write a fetch block that intercepts 401 unauthorized errors and redirects the user to the login page.
* **Interview Context:** API middleware interceptor pattern.
* **Answer:** 
```javascript
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("jwt_token");
  
  // Set headers
  options.headers = {
    ...options.headers,
    "Authorization": token ? `Bearer ${token}` : '',
    "Content-Type": "application/json"
  };

  const response = await fetch(url, options);
  
  if (response.status === 401) {
    // Token is invalid or expired
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_profile");
    window.location.href = "/login.html?error=Session expired, please login again";
    throw new Error("Unauthorized access - Redirecting to login");
  }
  
  return response;
}
```

#### Q39. Scenario: The login page hangs with a loading spinner indefinitely. What steps do you take in Developer Tools to isolate the root cause?
* **Interview Context:** General debugging and developer diagnostic tool usage.
* **Answer:** 
1. Open Developer Tools and navigate to the **Network** tab.
2. Check the HTTP status of the `/login` or `/verify-login-otp` API request:
   - **Status is `Pending`:** The backend server is frozen, experiencing a deadlock, database lock, or connection timeout.
   - **Status is `Failed`:** The server is offline, or there is a CORS blocker.
   - **Status is `500`:** The backend threw a runtime exception. Inspect the response payload or backend terminal stacktrace.
3. If no request was sent at all, check the **Console** tab for Javascript syntax or logic errors before the fetch call (e.g. `Uncaught ReferenceError: formInput is not defined`).

#### Q40. Coding: Write a JS function to group a flat list of watch products by their category name on the client side.
* **Interview Context:** Tests JS array functions (like reduce).
* **Answer:** 
```javascript
function groupProductsByCategory(products) {
  return products.reduce((acc, product) => {
    const categoryName = product.category ? product.category.name : 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});
}
```

#### Q41. What is JS Event Loop and how does it play a role when waiting for the OTP verification API?
* **Interview Context:** Essential JavaScript runtime mechanics.
* **Answer:** 
JavaScript is single-threaded. The **Event Loop** allows it to perform non-blocking I/O operations by offloading tasks to the browser Web APIs.
When we call `fetch()` to verify an OTP:
1. The fetch request is sent to Web APIs.
2. JavaScript continues executing the next lines (e.g. showing a loading spinner animation).
3. Once the fetch completes, the callback task is queued in the **Microtask Queue**.
4. The Event Loop waits for the call stack to clear, then processes the microtask queue, bringing the HTTP response data back to our JS code.

#### Q42. How does the browser cache static assets (like watch images), and how can you force refresh them if you update a product?
* **Interview Context:** Asset caching strategies.
* **Answer:** 
Browsers cache images based on HTTP cache-control headers from the server.
To force refresh an image if we update a watch model:
- **Cache Busting:** We append a dynamic query parameter or timestamp to the image URL:
```javascript
const imageUrl = `${product.imageUrl}?v=${Date.now()}`;
```
Because the URL is slightly different, the browser bypasses its cache and makes a fresh request to the server.

#### Q43. How do you secure API keys (like Razorpay Client ID) in the frontend code?
* **Interview Context:** Basic web app security principles.
* **Answer:** 
Client-side code is completely public. 
1. **Never store secret keys** (like Razorpay Key Secret) on the frontend.
2. Only key IDs (like `rzp_test_xxxx`) can be declared on the client side.
3. In production, we request these keys dynamically from a secured backend configuration endpoint `/api/config/razorpay-key` instead of hardcoding them in Javascript file bundles.

#### Q44. Scenario: An admin wants to upload a watch image, but gets a 413 Payload Too Large error. What does it mean?
* **Interview Context:** Web standard response errors.
* **Answer:** 
The image file exceeds the maximum size limit allowed by the application gateway, Nginx, or Spring Boot.
- **Fix:** In Spring Boot `application.properties`, configure larger file limits:
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=20MB
```

#### Q45. Coding: Write a script to save a shopping cart state (an array of items) to `localStorage` and retrieve it on page load.
* **Interview Context:** Local storage utility script.
* **Answer:** 
```javascript
const CART_STORAGE_KEY = 'timeverse_shopping_cart';

function saveCart(cartArray) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartArray));
}

function getCart() {
  const cartJson = localStorage.getItem(CART_STORAGE_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
}
```

#### Q46. What is the DOM and how does a Browser paint the Watch Store homepage?
* **Interview Context:** Understanding browser page rendering.
* **Answer:** 
The DOM (Document Object Model) is a structural tree representation of HTML documents.
**Painting sequence:**
1. **Parsing:** Browser reads HTML code and builds DOM tree.
2. **CSSOM:** Parses style rules and builds CSS Object Model.
3. **Render Tree:** Combines DOM and CSSOM to decide which elements are visible.
4. **Layout:** Calculates dimensions and screen positions of elements.
5. **Painting:** Fills in pixels on the screen (colors, text, images).

#### Q47. Scenario: On mobile browsers, the interactive watch slider is lagging. How do you optimize its performance?
* **Interview Context:** Mobile web performance tuning.
* **Answer:** 
1. Use **CSS transitions and transforms** (`translate3d` or `scale`) instead of animating layout values (like `margin-left` or `left`) as transforms trigger hardware acceleration on mobile GPUs.
2. Apply `will-change: transform` to the slider container to notify the browser to optimize rendering.
3. Compress images to WebP formats and resize them to exact display dimensions instead of loading 4K source assets.

#### Q48. Coding: Write a function to filter products in real-time based on a price-range slider.
* **Interview Context:** Data manipulation in JS.
* **Answer:** 
```javascript
function filterProductsByPrice(products, maxPrice) {
  return products.filter(product => product.price <= parseFloat(maxPrice));
}
```

#### Q49. How do you implement a fallback image in HTML if a watch image URL is broken or returns a 404 error?
* **Interview Context:** Defending against broken assets.
* **Answer:** 
We use the HTML image tag's inline `onerror` handler:
```html
<img src="watch_url.jpg" 
     onerror="this.onerror=null; this.src='/assets/images/default-watch-placeholder.png';" 
     alt="TimeVerse Watch">
```
Setting `this.onerror=null` prevents infinite loop scenarios if the placeholder image is also missing.

#### Q50. Scenario: The backend team changed the JSON response structure of `/api/products` from a flat array to a paginated object. How do you refactor the frontend?
* **Interview Context:** Adaptability to backend changes.
* **Answer:** 
- **Old Response:** `[ {id: 1, name: "Rolex"}, {id: 2, name: "Seiko"} ]`
- **New Response:** `{ content: [ {id: 1, name: "Rolex"} ], totalElements: 1, size: 8 }`
- **Refactoring:** Update the API fetch callback from referencing the raw response array to reading the `.content` field of the response object:
```javascript
// Before
const products = await response.json();
renderProducts(products);

// After
const pageData = await response.json();
renderProducts(pageData.content); // Access the content list
renderPagination(pageData.totalPages, pageData.number); // Access metadata
```

---

## Part 2: Backend Interview Questions (51-100)

### Section A: Java 21 & Core Concepts (Questions 51-60)

#### Q51. What features of Java 21 did you use in the TimeVerse Backend, and how do they benefit the project?
* **Interview Context:** Core Java 21 capability question.
* **Answer:** 
1. **Virtual Threads (Project Loom):** Handles massive concurrent customer checkouts efficiently.
2. **Pattern Matching for switch:** Simplifies checking order status or payment states in business logic.
3. **Record Patterns:** Used in DTO parsing for cleaner, immutable data access.
4. **Sequenced Collections:** Uses `getFirst()` or `getLast()` on collections like cart item arrays.

#### Q52. How did you use Record classes in Java 21 to create lightweight DTOs for the watch store?
* **Interview Context:** Java 21 Record syntax and usage.
* **Answer:** 
Records are immutable data carriers that automatically generate boilerplate code like constructors, getters, `equals()`, `hashCode()`, and `toString()`.
In our login flow, we use records for API request bodies:
```java
public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    String password
) {}
```
This reduces code size and ensures that the incoming data cannot be modified.

#### Q53. Explain the difference between `Optional` and a null check, and how it is used in `userRepository.findByEmail()`.
* **Interview Context:** Standard core Java question.
* **Answer:** 
- **Null check:** Relies on manual conditional checks (`if (user == null)`). Forgetting to check can cause `NullPointerException`.
- **`Optional<T>`:** A container object which may or may not contain a non-null value. It forces the programmer to handle empty cases.
In `UserService.java`, we use it to check for existing users:
```java
User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
```
This eliminates manual null checks and integrates with our exception handling middleware.

#### Q54. How do Virtual Threads in Java 21 differ from Platform Threads, and why are they useful for high-concurrency e-commerce backends?
* **Interview Context:** High-level Java concurrency concept.
* **Answer:** 
- **Platform Threads:** Heavyweight wrappers around OS threads. Creating millions of them exhausts system memory.
- **Virtual Threads:** Lightweight, user-mode threads managed by the JVM. A single JVM can run millions of virtual threads.
- **Benefits for TimeVerse:** During peak sales, thousands of users hit checkout APIs. Traditional blocking I/O models block an entire OS thread. With Virtual Threads, when a checkout thread blocks for database writes or Razorpay API, the JVM switches to another task, increasing application throughput.

#### Q55. How do you handle datetime representation (like order time or OTP expiry) using Java 8+ Date-Time API?
* **Interview Context:** Core API standard practices.
* **Answer:** 
We use `LocalDateTime` for database timestamps and token expiration dates because it is thread-safe and timezone-neutral.
- **Creating order timestamp:** `order.setCreatedAt(LocalDateTime.now());`
- **OTP expiration:** `otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));`
In MySQL, these map to the standard `DATETIME(6)` column type.

#### Q56. Explain the concept of Exception Handling in Java and how `@ControllerAdvice` maps it to REST responses.
* **Interview Context:** Core Exception Handling and framework integration.
* **Answer:** 
Java uses standard throw/catch blocks with checked and unchecked exceptions.
In TimeVerse, we use unchecked runtime exceptions for business errors (e.g., `BadRequestException`).
Spring Boot maps these exceptions to JSON responses using a global handler:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse err = new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage());
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }
}
```

#### Q57. What are the Java Collection interfaces, and which ones did you use to model a User's cart containing multiple items?
* **Interview Context:** Core collections framework application.
* **Answer:** 
- **`List`:** Ordered collection (allows duplicates). We use `List<OrderItem>` in our `Order` entity.
- **`Set`:** Unordered collection (no duplicates). We use `Set<Cart>` or custom mappings.
- **`Map`:** Key-Value stores. Used in caching mechanisms.
In our model, a User's cart has a one-to-many relationship with cart items, represented as:
```java
@OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
private List<CartItem> items = new ArrayList<>();
```

#### Q58. How does standard hashing (like BCrypt) protect user passwords, and how is it initialized in Spring Boot?
* **Interview Context:** Practical security hashing.
* **Answer:** 
Hashing is a one-way mathematical function. We cannot reverse a hash back to the original password. BCrypt incorporates a "salt" (random data) to prevent rainbow table attacks.
We register it in our `SecurityConfig` class:
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```
During user registration:
```java
String hashedPassword = passwordEncoder.encode(rawPassword);
user.setPassword(hashedPassword);
```

#### Q59. What is the difference between `Interface` and `Abstract Class` in Java, and how does it relate to your Repository layer?
* **Interview Context:** Standard OOPs concept.
* **Answer:** 
- **Interface:** Defines contract patterns with multiple inheritance. All variables are public static final, and methods are abstract by default.
- **Abstract Class:** Class that cannot be instantiated and can contain state fields, concrete constructors, and non-final fields.
- **Application in TimeVerse:** Our Repository layers are interfaces:
```java
public interface UserRepository extends JpaRepository<User, Long> {}
```
Spring Data JPA uses dynamic proxies to implement these repository interfaces at runtime.

#### Q60. Explain the concept of Stream API and how you used it to calculate the total order amount in the backend.
* **Interview Context:** Functional programming patterns in Java.
* **Answer:** 
The Stream API is a functional-style wrapper introduced in Java 8 to process sequences of elements.
In `OrderService.java`, we calculate order totals from lists of order items:
```java
double totalAmount = orderItems.stream()
    .mapToDouble(item -> item.getPrice() * item.getQuantity())
    .sum();
```
This replaces verbose loops with readable, pipeline-style operations.

---

### Section B: Spring Boot 3 & REST APIs (Questions 61-75)

#### Q61. What is the directory and package structure of your Spring Boot project and what is the role of `pom.xml`?
* **Interview Context:** Standard layout verification question at service companies.
* **Answer:** 
Our package structure follows domain-driven layout:
- `com.timeverse.backend`: Contains main class `TimeVerseBackendApplication`.
- `.config`: Contains configuration classes (Security, Razorpay, Swagger).
- `.controller`: RestControllers handling client API requests.
- `.dto`: Data Transfer Objects (Requests, Responses, API formats).
- `.entity`: JPA Entity models mapped to MySQL tables.
- `.repository`: Database interaction interfaces extending `JpaRepository`.
- `.security`: Custom JWT filters and token parsing mechanisms.
- `.service`: Business logic components.
- **`pom.xml`:** The Maven Project Object Model configuration file. It lists project dependencies (Spring Security, JPA, Lombok, MySQL Driver, Razorpay SDK) and coordinates compilation, packing, and build lifecycle.

#### Q62. How does dependency injection (IoC) work in Spring Boot, and how did you wire `UserService` into `AuthController?`
* **Interview Context:** Core Spring IOC architecture.
* **Answer:** 
Inversion of Control (IoC) shifts the responsibility of creating and managing objects from the developer to the Spring framework.
In TimeVerse, we use **Constructor-based Dependency Injection** (the recommended approach over `@Autowired` field injection because it facilitates unit testing and ensures immutability):
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    // Constructor injection
    public AuthController(UserService userService) {
        this.userService = userService;
    }
}
```

#### Q63. What is the difference between `@Component`, `@Service`, `@Repository`, and `@RestController` in Spring Boot?
* **Interview Context:** Spring stereotype annotations.
* **Answer:** 
- **`@Component`:** The parent stereotype annotation. Any class marked with it is registered as a bean in the Spring container.
- **`@Service`:** Specializes `@Component`. Indicates that the class contains business logic.
- **`@Repository`:** Specializes `@Component`. Handles database interaction and automatically translates persistence exceptions.
- **`@RestController`:** Combines `@Controller` and `@ResponseBody`. Tells Spring that handlers return data serialized to JSON/XML directly to the client instead of rendering templates.

#### Q64. How do you write API endpoints using HTTP request methods (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`) for products?
* **Interview Context:** REST API Design principles.
* **Answer:** 
We use the standard HTTP mapping annotations inside `ProductController`:
- **Get all products:** `@GetMapping("/api/products")`
- **Create new product:** `@PostMapping("/api/products")` (Restricted to `ADMIN` role).
- **Update product:** `@PutMapping("/api/products/{id}")` (Restricted to `ADMIN` role).
- **Delete product:** `@DeleteMapping("/api/products/{id}")` (Restricted to `ADMIN` role).

#### Q65. Explain the role of `@Valid` and Jakarta Validation annotations (`@NotBlank`, `@Email`, `@Size`) in user registration.
* **Interview Context:** Server-side request validation.
* **Answer:** 
Jakarta validation enforces constraints on incoming payloads before executing controller logic.
In `RegisterRequest` DTO, fields are annotated with constraints:
```java
public class RegisterRequest {
    @NotBlank(message = "Username cannot be empty")
    private String username;

    @Email(message = "Please provide a valid email")
    private String email;
}
```
In `AuthController`, we trigger this validation with `@Valid`:
```java
@PostMapping("/register")
public ResponseEntity<ApiResponse<User>> register(@Valid @RequestBody RegisterRequest request)
```
If constraints fail, Spring throws `MethodArgumentNotValidException` which our global exception handler interceptor captures and converts into a structured JSON error list.

#### Q66. How does Spring Boot handle file uploads (e.g. watch images) using `MultipartFile`?
* **Interview Context:** File handling in REST APIs.
* **Answer:** 
In `ProductController`, we declare a file upload endpoint accepting a `multipart/form-data` request:
```java
@PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Product> uploadImage(
        @PathVariable Long id,
        @RequestParam("file") MultipartFile file) throws IOException {
    
    // Save file locally in watch-store uploads directory or Cloud store (AWS S3)
    String imageUrl = productService.saveProductImage(id, file);
    return ResponseEntity.ok(imageUrl);
}
```
Spring extracts the multipart payload automatically from the incoming HTTP stream.

#### Q67. What is Swagger (Springdoc OpenAPI) and how did you configure it to test endpoints without Postman?
* **Interview Context:** API Documentation.
* **Answer:** 
Springdoc OpenAPI generates interactive documentation for our REST endpoints based on OpenAPI 3 standards.
In our `SwaggerConfig` class:
- We configure OpenApi layout details (API Name, Version, Security Schemes).
- We declare the standard JWT authorization scheme to allow testing endpoints that require authorization headers directly from the Swagger UI dashboard (`http://localhost:8080/swagger-ui.html`).

#### Q68. How do you implement query filtering and pagination for products using Spring Data JPA Specifications?
* **Interview Context:** Advanced querying techniques.
* **Answer:** 
We use Spring Data JPA `Specification` to build dynamic queries based on client query parameters (category, minPrice, maxPrice, search).
In `ProductRepository`:
```java
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {}
```
In `ProductService`:
```java
public Page<Product> getFilteredProducts(String search, Long categoryId, Double maxPrice, Pageable pageable) {
    Specification<Product> spec = Specification.where(ProductSpecification.hasSearch(search))
        .and(ProductSpecification.belongsToCategory(categoryId))
        .and(ProductSpecification.hasPriceLessThan(maxPrice));
    return productRepository.findAll(spec, pageable);
}
```

#### Q69. What is the purpose of `@CrossOrigin` on your controllers, and how did you handle CORS in Spring Security Config?
* **Interview Context:** CORS backend solutions.
* **Answer:** 
Browsers enforce the Same-Origin Policy. To allow our frontend (on port 3000 or file system) to make API calls to the backend (on port 8080), the backend must permit the foreign origin.
We add `@CrossOrigin(origins = "*")` at controller classes for quick development, and define explicit rules inside `SecurityConfig` filter chains:
```java
http.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:5500"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    return config;
}));
```

#### Q70. How do you read custom configuration values (like `jwt.secret` or `razorpay.key.id`) from `application.properties`?
* **Interview Context:** Reading environment configs in Spring.
* **Answer:** 
We use the `@Value` annotation to inject property values directly into our Spring Bean fields:
```java
@Component
public class JwtService {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;
}
```

#### Q71. What is the difference between `@RequestBody`, `@PathVariable`, and `@RequestParam`? Explain with examples from product and order endpoints.
* **Interview Context:** Core REST parameters mapping.
* **Answer:** 
- **`@RequestBody`:** Extracts JSON content from the body of HTTP requests and converts it to a Java object. E.g., placing orders:
  ```java
  @PostMapping("/orders")
  public ResponseEntity<Order> createOrder(@RequestBody OrderRequest request)
  ```
- **`@PathVariable`:** Extracts dynamic values path segments directly from the URL. E.g., getting a product:
  ```java
  @GetMapping("/products/{id}")
  public ResponseEntity<Product> getProduct(@PathVariable Long id)
  ```
- **`@RequestParam`:** Extracts query string parameters (from after the `?` in the URL). E.g., filtering:
  ```java
  @GetMapping("/products")
  public ResponseEntity<Page<Product>> getProducts(@RequestParam(defaultValue = "0") int page)
  ```

#### Q72. How does `@RestControllerAdvice` work to handle global exceptions and return structured JSON error responses?
* **Interview Context:** Standard Spring REST Error architecture.
* **Answer:** 
`@RestControllerAdvice` uses Spring's AOP (Aspect-Oriented Programming) to act as an interceptor around all controllers. When any controller throws a runtime exception, execution jumps to this advice handler.
This allows us to map specific Java exceptions to standardized HTTP status codes and payloads, ensuring a consistent contract for our frontend.

#### Q73. What is Lombok and how do annotations like `@Data`, `@Getter`, `@Setter`, and `@RequiredArgsConstructor` save time?
* **Interview Context:** Boilerplate reduction.
* **Answer:** 
Lombok is a Java library that Plugs into our IDE and build process to generate code on the fly during compilation:
- `@Getter` / `@Setter`: Generates getter/setter methods.
- `@Data`: Combines `@ToString`, `@EqualsAndHashCode`, `@Getter`, `@Setter`, and `@RequiredArgsConstructor`.
- `@RequiredArgsConstructor`: Creates a constructor for all final properties, simplifying constructor-based dependency injection.

#### Q74. How does Spring Boot's automatic auto-configuration (`@SpringBootApplication`) bootstrapping work?
* **Interview Context:** Spring Boot internals asked at product companies (Oracle, IBM).
* **Answer:** 
`@SpringBootApplication` is a meta-annotation that includes three key annotations:
1. `@SpringBootConfiguration`: Declares the class as a configuration source.
2. `@ComponentScan`: Scans the current package and sub-packages for Spring components (`@Component`, `@Service`, etc.).
3. `@EnableAutoConfiguration`: Searches for starter jars on the classpath and configures sensible defaults (e.g. if `mysql-connector` is found, it configures a Hikari database pool automatically).

#### Q75. How do you manage database schema changes using `spring.jpa.hibernate.ddl-auto=update` in development?
* **Interview Context:** Database updates in dev environments.
* **Answer:** 
In `application.properties`, `spring.jpa.hibernate.ddl-auto` specifies table initialization behaviors. 
- **`update`:** Inspects entity classes on application startup. If a column or table is missing from MySQL database, Hibernate alters the table structure automatically.
- *Caveat:* While useful for rapid prototyping in development, `update` is disabled in production environments (where we use schema migration scripts like Liquibase or Flyway) to prevent structural data loss.

---

### Section C: Spring Security, JWT & OTP Authentication (Questions 76-90)

#### Q76. Explain the architecture of Spring Security filter chain and how `JwtAuthenticationFilter` fits in.
* **Interview Context:** In-depth security architecture.
* **Answer:** 
Spring Security uses a series of Servlet Filters (the Security Filter Chain) to intercept and validate incoming HTTP requests.
1. The request enters the filter chain.
2. Our custom `JwtAuthenticationFilter` intercepts the request before it reaches the standard username-password validation filter (`UsernamePasswordAuthenticationFilter`).
3. It checks for the `Authorization` header containing `Bearer <token>`.
4. If found, it extracts and validates the token.
5. If the token is valid, it builds an authentication token object and loads the user credentials into the thread-local context `SecurityContextHolder`.

#### Q77. How is stateless authentication achieved in TimeVerse using JWT (JSON Web Token)?
* **Interview Context:** Stateless sessions vs stateful cookies.
* **Answer:** 
In stateless authentication:
1. The server does not store user session data in its RAM memory or database.
2. Instead, all user identification states are packed into the JWT payload, signed with a secret key, and sent to the client.
3. The client sends this JWT in the headers of all future requests.
4. The server validates the cryptographic signature of the incoming token. If valid, the server trusts the payload contents (identity and permissions) instantly.

#### Q78. Walk through the step-by-step OTP login flow for a user in TimeVerse.
* **Interview Context:** Multi-factor authentication design.
* **Answer:** 
1. **Initial Request:** Customer posts email and password to `/api/auth/login`.
2. **First-Step Validation:** Backend validates the password against database hash.
3. **OTP Generation:** If verified, backend generates a random 6-digit OTP code using `SecureRandom`.
4. **Save OTP:** The OTP, user email, expiration (5 mins), and status `verified = false` are saved to the `otp` table.
5. **Send Notification:** An email (using JavaMailSender) or console log notifies the customer of the OTP.
6. **Trigger UI:** Backend returns a success message indicating "OTP sent successfully". The frontend shows the OTP validation modal.
7. **Verify OTP:** Customer submits the OTP. Frontend posts to `/api/auth/verify-login-otp`.
8. **Token Issue:** If OTP matches, is not expired, and not already used, the backend marks the OTP record as verified, deletes old active JWT records, generates a new JWT token, and returns it to the client.

#### Q79. How is the OTP securely generated, stored, and checked for expiration in the database?
* **Interview Context:** Secure database storage for credentials.
* **Answer:** 
- **Generation:** We use `java.security.SecureRandom` instead of `Math.random()` to generate cryptographically strong numbers.
- **Storage:** Saved inside an `Otp` table containing fields: `id`, `email`, `otp`, `expiresAt` (LocalDateTime), and `verified` (boolean).
- **Expiration Check:** In `UserService.java`:
```java
if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
    throw new BadRequestException("OTP expired");
}
```

#### Q80. How is Role-Based Access Control (RBAC) implemented in `SecurityConfig` to restrict product updates to `ADMIN` only?
* **Interview Context:** Role-based access rules.
* **Answer:** 
We configure authorization constraints inside our filter chain by targeting URL patterns and checking roles:
```java
.requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
```
When a JWT containing `"role": "ROLE_CUSTOMER"` makes a `PUT` request to `/api/products/12`, Spring Security matches the path pattern, identifies that the customer lacks `ROLE_ADMIN`, and blocks the request with a `403 Forbidden` error.

#### Q81. Why do we store the signature component of the JWT in the database (`JwtToken` entity) and how does it help with token blacklisting?
* **Interview Context:** JWT revocation strategies (advanced security).
* **Answer:** 
Pure stateless JWTs cannot be revoked easily before their expiration time.
In TimeVerse, we implement token tracking:
1. When a user logs in, we save the signature part of their JWT (`jwtService.extractSignature(token)`) in a `jwt_token` database table.
2. During API requests, `JwtAuthenticationFilter` verifies that the token's signature exists in the database.
3. On Logout:
```java
jwtTokenRepository.deleteByToken(jwtService.extractSignature(token));
```
Because the signature is deleted from our database, any future requests using that JWT fail validation immediately (blacklisted).

#### Q82. What is the difference between Authentication and Authorization? Illustrate with ADMIN vs CUSTOMER features.
* **Interview Context:** Fundamental security concepts.
* **Answer:** 
- **Authentication:** Verifying *who* you are (identity). E.g., the user enters credentials and validates with an OTP to prove they are `suprita@timeverse.com`.
- **Authorization:** Verifying *what* you are allowed to do (permissions). E.g., once authenticated, checking if they have the `ADMIN` role. An admin is authorized to edit watch quantities, whereas a normal user is restricted to viewing watches.

#### Q83. How do you extract the authenticated user's email or ID inside a controller using `SecurityContextHolder`?
* **Interview Context:** Retrieving user context.
* **Answer:** 
Spring Security stores authentication details inside the `SecurityContext` mapped to the current thread. We fetch it like so:
```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String email = auth.getName(); // Extracts email stored as username principal
```
We use this email to query the database and verify the customer identity for cart additions and orders.

#### Q84. How does BCryptPasswordEncoder work and why is it secure against rainbow table attacks?
* **Interview Context:** Cryptographic password storage.
* **Answer:** 
BCrypt uses a salt value along with a configuration work factor (strength). 
1. **Salting:** Appends a unique random string to each password before hashing. If two users use the password `"Password@123"`, their hashes in the database look completely different because of their distinct salt inputs. This defeats pre-computed dictionary tables (rainbow tables).
2. **Key Stretching:** It runs the hashing process multiple times to slow down brute force attacks.

#### Q85. How did you secure endpoints against CSRF attacks in a stateless JWT-based environment?
* **Interview Context:** Cross-Site Request Forgery protections.
* **Answer:** 
In `SecurityConfig`, we disable CSRF:
```java
http.csrf(csrf -> csrf.disable())
```
- **Rationale:** CSRF attacks rely on browsers forwarding cookies automatically during cross-site requests. Since our application does not use session cookies and instead passes JWT tokens in the `Authorization` header, the browser does not append credentials automatically. This makes the REST backend immune to CSRF.

#### Q86. What happens if a client sends an expired JWT? Explain the exception flow and front-end handling.
* **Interview Context:** Handling authentication exceptions.
* **Answer:** 
1. The request hits `JwtAuthenticationFilter`.
2. Inside `JwtService.validateToken()`, parsing the expired JWT throws an `ExpiredJwtException`.
3. The filter catches this exception and writes a JSON structure (HTTP `401 Unauthorized`) directly into the HttpServletResponse body:
   ```json
   { "status": 401, "message": "Token has expired" }
   ```
4. The client-side Fetch interceptor receives this 401 code, deletes the token from local storage, and redirects the user to the login page.

#### Q87. How does a custom user details service load a user from the MySQL database using Spring Security?
* **Interview Context:** Integrating user stores in Spring Security.
* **Answer:** 
We implement the `UserDetailsService` interface and override the `loadUserByUsername` method:
```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPassword())
            .roles(user.getRole()) // e.g., "ADMIN" -> generates "ROLE_ADMIN" authority
            .build();
    }
}
```

#### Q88. What is the purpose of JWT signature extraction and token validation method in `JwtService`?
* **Interview Context:** JWT cryptographic checks.
* **Answer:** 
The JWT signature is created by hashing the encoded Header and Payload using a secret key.
1. When validating, we extract the signature from the token.
2. We re-calculate what the signature should be using our server's `jwt.secret`.
3. If the computed signature matches the token's signature, it proves that the token payload was not altered by the client (data integrity).
4. We also parse the token's claims to verify that the current date is before the token's expiration date (`exp`).

#### Q89. How did you implement password reset flow where OTP verification must happen before password change?
* **Interview Context:** Multi-step business workflow security.
* **Answer:** 
We enforce a secure sequence:
1. **Request Reset:** User posts email to `/api/auth/forgot-password`. We generate an OTP, print/send it, and store it.
2. **Verify OTP:** User inputs the OTP to `/api/auth/verify-otp`. If correct, the backend marks the OTP record as verified.
3. **Change Password:** User posts the new password and OTP to `/api/auth/reset-password`. The backend queries the OTP record:
```java
Otp otpEntity = otpRepository.findByEmailAndOtp(request.getEmail(), request.getOtp())
    .orElseThrow(() -> new BadRequestException("OTP Verification Required"));

if (!otpEntity.isVerified()) {
    throw new BadRequestException("Verify OTP first");
}
```
Only if verified, we update the user's password in the database and delete the OTP session.

#### Q90. Scenario: An admin tries to access the Customer profile API but receives a 403 Forbidden. What config determines this?
* **Interview Context:** Access permission configurations.
* **Answer:** 
This is determined by the `SecurityFilterChain` rules in `SecurityConfig.java` or method-level annotations (like `@PreAuthorize`).
If we configured:
```java
.requestMatchers("/api/auth/profile/**").hasRole("CUSTOMER")
```
And the Admin only has `"ROLE_ADMIN"`, they are denied access. 
- **Fix:** If admins should view profiles, change to:
```java
.requestMatchers("/api/auth/profile/**").hasAnyRole("ADMIN", "CUSTOMER")
```

---

### Section D: Database, JPA, Payments & Scenario (Questions 91-100)

#### Q91. What is the relationship between `User`, `Cart`, and `CartItem` entities? How are they mapped in JPA?
* **Interview Context:** Database normalization and JPA relationship mapping.
* **Answer:** 
- **`User` and `Cart`:** One-to-One relationship. Each user has one unique active cart.
  ```java
  @OneToOne(mappedBy = "user")
  private Cart cart;
  ```
- **`Cart` and `CartItem`:** One-to-Many relationship. A cart can contain multiple items.
  ```java
  @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<CartItem> items;
  ```
- **`CartItem` and `Product`:** Many-to-One relationship. Multiple cart rows can refer to the same watch product.
  ```java
  @ManyToOne
  @JoinColumn(name = "product_id")
  private Product product;
  ```

#### Q92. What are JPA cascade types, and why is `CascadeType.ALL` used on a user's cart or order items?
* **Interview Context:** Cascading operations in ORM.
* **Answer:** 
Cascade types specify how operations performed on a parent entity propagate to its related child entities.
- **Why `ALL` for Orders/Carts:** 
When we save, update, or delete an `Order` object, we want all its related `OrderItem` rows to be saved, updated, or deleted automatically in the database.
```java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
private List<OrderItem> items;
```
If we delete an order, we don't want orphaned item rows in our database. Using `CascadeType.ALL` ensures database integrity without writing manual repository delete queries for each list item.

#### Q93. How did you integrate Razorpay Payment Gateway in Spring Boot? Show the API flow for order creation and verification.
* **Interview Context:** Real-world payment flow question asked by product startups (Zoho, Freshworks).
* **Answer:** 
1. **Initialize Client:** Register `RazorpayClient` bean using key and secret from configuration.
2. **Create Payment Order:** When the user clicks check out, the client sends order details to our backend. We call Razorpay's API to initialize an order:
   ```java
   JSONObject orderRequest = new JSONObject();
   orderRequest.put("amount", amountInPaise); // e.g. Rs 5000 is represented as 500000 paise
   orderRequest.put("currency", "INR");
   orderRequest.put("receipt", "txn_12345");
   Order razorpayOrder = razorpayClient.orders.create(orderRequest);
   ```
3. We store the Razorpay Order ID in our database and return the order ID, amount, and credentials to the frontend.
4. **Checkout Execution:** The frontend opens the Razorpay popup using the order ID. The customer pays.
5. **Verify Payment:** Razorpay returns payment metadata (`razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`). The frontend sends this to `/api/payments/verify`.
6. **Signature Check:** We cryptographically hash the order ID and payment ID using our local key secret and match it with the signature. If it matches, we update the order state to `PAID` in our database.

#### Q94. Explain the difference between eager fetching and lazy fetching in JPA. Which one is used for Category and Products relationship?
* **Interview Context:** Performance optimization in Hibernate.
* **Answer:** 
- **`Eager`:** Associated entities are loaded immediately along with the parent query.
- **`Lazy`:** Associated entities are loaded only when they are accessed in code (e.g. calling `category.getProducts()`).
- **Application in TimeVerse:** For the Category-to-Products relationship, we use **Lazy Fetching** (`FetchType.LAZY`). When we fetch a list of categories to build the navbar dropdown, we don't want Hibernate to pull thousands of watch records associated with those categories. Eager fetching would cause severe performance issues.
```java
@OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
private List<Product> products;
```

#### Q95. Coding/Design: Write a Spring Boot controller method for creating a Razorpay order.
* **Interview Context:** Custom coding request.
* **Answer:** 
```java
@RestController
@RequestMapping("/api/payments")
public class RazorpayController {

    private final RazorpayService razorpayService;

    public RazorpayController(RazorpayService razorpayService) {
        this.razorpayService = razorpayService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<RazorpayOrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            RazorpayOrderResponse response = razorpayService.createRazorpayOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

#### Q96. Scenario: Two users purchase the last watch in stock at the exact same time. How do you handle database concurrency (Pessimistic vs Optimistic Locking)?
* **Interview Context:** High-level database architecture question common at Amazon and Zoho.
* **Answer:** 
This is a concurrency conflict. If both read inventory = 1, both will execute checkout, leading to negative stock.
- **Optimistic Locking:** Assumes conflict is rare. We add a `@Version` field to the Product entity. If User B updates after User A has already completed their write, User B's update fails because the version changed. Spring throws `OptimisticLockingFailureException`.
- **Pessimistic Locking (Recommended for Flash Sales):** Obtains a database-level lock on the row (`SELECT FOR UPDATE`). When User A reads the row, MySQL locks it. User B is forced to wait until User A completes their transaction.
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Optional<Product> findByIdForUpdate(@Param("id") Long id);
```

#### Q97. Coding: Write a JPA query or method definition in `ProductRepository` to find watches under a certain price.
* **Interview Context:** JPA query methods syntax.
* **Answer:** 
Using JPA Query Method conventions:
```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Auto-generates query based on method name pattern
    List<Product> findByPriceLessThanEqualOrderByPriceAsc(Double maxPrice);
    
    // Alternative JPQL implementation:
    @Query("SELECT p FROM Product p WHERE p.price <= :price ORDER BY p.price ASC")
    List<Product> findWatchesUnderPrice(@Param("price") Double price);
}
```

#### Q98. What is N+1 Select Query problem in Hibernate, and how do you resolve it when loading products with categories?
* **Interview Context:** Key database performance bottleneck questions.
* **Answer:** 
The N+1 problem occurs when Hibernate executes 1 query to fetch a list of parent entities (e.g. Products), and then executes N additional queries to load the associated child entity (e.g. Category) for each of the N products returned.
- **How to resolve:** We use a **JOIN FETCH** in JPQL to load both parent and child data in a single SQL query:
```java
@Query("SELECT p FROM Product p JOIN FETCH p.category")
List<Product> findAllProductsWithCategory();
```
This forces Hibernate to execute a single `INNER JOIN` query, saving N database roundtrips.

#### Q99. Scenario: The database connection pool runs out of connections in production. How do you configure and optimize hikari pool settings?
* **Interview Context:** Production system reliability.
* **Answer:** 
1. Check the logs. If it reports `Connection is not available, request timed out after x ms`, we are holding connections too long or database handles are leaking.
2. Ensure all transaction blocks are closed quickly (avoid performing slow external REST calls like Razorpay API inside `@Transactional` methods).
3. Tune pool settings in `application.properties`:
```properties
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.idle-timeout=10000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.connection-timeout=30000
```

#### Q100. HR / Architectural: Explain the system architecture of the TimeVerse E-commerce application to an interviewer.
* **Interview Context:** Standard interview introduction or design summary.
* **Answer:** 
"TimeVerse is a responsive, full-stack E-Commerce watch store utilizing a separated frontend-backend architecture.
- **Presentation Layer:** Built with HTML5, CSS3, JavaScript, and Bootstrap 5. It manages client-side views dynamically, stores auth state in LocalStorage, and handles client payment callbacks via Razorpay's overlay.
- **Application/Security Layer:** Spring Boot 3 REST application running on Java 21. It secures APIs via a stateless Spring Security filter chain running JWT signature validations.
- **Database/Persistence Layer:** MySQL 8 database accessed through Spring Data JPA. We use Hikari connection pool management and transaction controls to manage products, categories, OTP sessions, orders, and payment records.
- **Integration Layer:** External systems integration with Razorpay REST APIs for payment initialization and cryptographic verification."
