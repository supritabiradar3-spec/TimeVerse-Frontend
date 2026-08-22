// Dynamic Luxury Navbar Component

(function () {
    // Flag to prevent duplicate global window listeners
    let listenersBound = false;

    // Add scroll listener to header
    window.addEventListener('scroll', function () {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // Helper to get active state
    const currentPath = window.location.pathname;

    function isActive(pageName) {
        return currentPath.includes(pageName) ? 'active' : '';
    }

    // Async helper to cache user's profile details (fullName, mobile) in localStorage
    async function fetchProfileDetails() {
        const token = localStorage.getItem('token');
        const userId = auth.getUserId();
        if (token && userId && !localStorage.getItem('fullName')) {
            try {
                const response = await api.getUserProfile(userId);
                if (response.success && response.data) {
                    localStorage.setItem(
                        'fullName',
                        response.data.username || localStorage.getItem('username') || ''
                    );
                    renderNavbar(); // Re-render once cached
                }
            } catch (e) {
                console.warn('Failed to load profile for navbar cache:', e);
            }
        }
    }

    function hasValidCustomerSession() {
        const token = localStorage.getItem('token');
        if (!token) return false;
        const role = (localStorage.getItem('role') || '').toUpperCase();
        if (role === 'ADMIN') return false;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp && (payload.exp * 1000) <= Date.now()) {
                return false;
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    // Expose global wishlist count updater
    window.updateNavbarWishlistCount = async function (explicitCount) {
        const badgeCounts = document.querySelectorAll('.nav-wishlist-badge-count, #nav-wishlist-badge-count');
        const heartSvgs = document.querySelectorAll('.nav-wishlist-heart-svg');

        if (!hasValidCustomerSession()) {
            badgeCounts.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
            heartSvgs.forEach(svg => {
                svg.setAttribute('fill', 'none');
            });
            return;
        }

        try {
            let count = 0;
            if (typeof explicitCount === 'number' && !isNaN(explicitCount)) {
                count = Math.max(0, explicitCount);
            } else if (window.api && typeof window.api.getWishlistCount === 'function') {
                const res = await window.api.getWishlistCount();
                count = parseInt(res, 10) || 0;
            } else if (window.api && typeof window.api.getWishlist === 'function') {
                const res = await window.api.getWishlist();
                count = Array.isArray(res) ? res.length : 0;
            }

            badgeCounts.forEach(el => {
                el.textContent = count > 99 ? '99+' : String(count);
                el.style.display = count > 0 ? 'flex' : 'none';
            });

            heartSvgs.forEach(svg => {
                if (count > 0) {
                    svg.setAttribute('fill', '#E63946');
                } else {
                    svg.setAttribute('fill', 'none');
                }
            });
        } catch (error) {
            badgeCounts.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
            heartSvgs.forEach(svg => {
                svg.setAttribute('fill', 'none');
            });
            if (error && (error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Access denied'))) {
                console.warn('Wishlist count unavailable for unauthenticated session.');
            } else {
                console.warn('Failed to update wishlist count badge:', error);
            }
        }
    };

    // Expose global cart count updater
    window.updateNavbarCartCount = async function (explicitCount) {
        const badgeCounts = document.querySelectorAll('#nav-cart-badge-count, .nav-cart-badge-count');
        if (badgeCounts.length === 0) return;

        if (!hasValidCustomerSession()) {
            badgeCounts.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
            return;
        }

        try {
            let count = 0;
            if (typeof explicitCount === 'number' && !isNaN(explicitCount)) {
                count = Math.max(0, explicitCount);
            } else if (window.api && typeof window.api.getCartCount === 'function') {
                const res = await window.api.getCartCount();
                count = parseInt(res, 10) || 0;
            }

            badgeCounts.forEach(el => {
                el.textContent = count > 99 ? '99+' : String(count);
                el.style.display = count > 0 ? 'flex' : 'none';
            });
        } catch (error) {
            badgeCounts.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
            if (error && (error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Access denied'))) {
                console.warn('Cart count unavailable for unauthenticated session.');
            } else {
                console.warn('Failed to update cart count badge:', error);
            }
        }
    };

    // Build the navbar HTML content
    function renderNavbar() {
        const header = document.querySelector('header');
        if (!header) return;

        // Retrieve auth state from localStorage
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const storedFullName = localStorage.getItem('fullName');
        const role = localStorage.getItem('role') || 'CUSTOMER';
        const rawName = (storedFullName || username || '').trim();
        const fullName = rawName || 'Collector';

        // Determine user display name for welcome pill
        let customerName = 'Profile';
        if (token && rawName) {
            customerName = rawName.split(' ')[0] || rawName;
        }
        const welcomeLabel = token ? `Welcome back, ${customerName}` : 'Welcome back, Profile';
        let navLinksHTML = "";

        if (token && role === "ADMIN") {
            navLinksHTML = `
                <li><a href="./admin.html" class="nav-link ${isActive('admin.html')}">Dashboard</a></li>
                <li><a href="./admin.html#products" class="nav-link">Products</a></li>
                <li><a href="./admin.html#users" class="nav-link">Users</a></li>
                <li><a href="./admin.html#orders" class="nav-link">Orders</a></li>
            `;
        } else {
            navLinksHTML = `
                <li><a href="./index.html" class="nav-link ${isActive('index.html')}">Home</a></li>
                <li><a href="./index.html#categories-section" class="nav-link">Categories</a></li>
                <li><a href="./products.html" class="nav-link ${isActive('products.html')}">Products</a></li>
                <li><a href="#about" class="nav-link nav-about-trigger">About</a></li>
                <li><a href="#contact" class="nav-link nav-contact-trigger">Contact</a></li>
            `;
        }

        let initials = '';
        if (fullName) {
            const parts = fullName.split(' ');
            if (parts.length > 1 && parts[0][0] && parts[1][0]) {
                initials = parts[0][0] + parts[1][0];
            } else if (parts[0] && parts[0][0]) {
                initials = parts[0][0] + (parts[0][1] ? parts[0][1] : '');
            }
            initials = initials.toUpperCase().substring(0, 2);
        }

        const searchHTML = `
            <div class="nav-search-container">
                <span class="nav-search-icon" title="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <input type="text" class="nav-search-input" placeholder="Search watches..." aria-label="Search watches...">
            </div>
        `;

        const dropdownItems = role === 'ADMIN' ? `
            <a href="./admin.html" class="dropdown-item">Dashboard</a>
            <span class="dropdown-item nav-change-pw-btn">Change Password</span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item logout-link-btn" style="color: var(--error); font-weight: 500;">Logout</span>
        ` : `
            <a href="./profile.html" class="dropdown-item">My Profile</a>
            <a href="./orders.html" class="dropdown-item">My Orders</a>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item logout-link-btn" style="color: var(--error); font-weight: 500;">Logout</span>
        `;

        const themeToggleHTML = `
            <button class="theme-toggle-btn nav-action-btn" id="nav-theme-toggle-btn" type="button" title="Theme" aria-label="Theme">
                <span class="theme-crescent-icon">☾</span>
            </button>
        `;

        const wishlistHTML = role === 'ADMIN' ? '' : `
            <a href="./wishlist.html" class="nav-action-btn nav-wishlist-btn" title="Wishlist" aria-label="Wishlist">
                <svg class="nav-wishlist-heart-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#E63946" stroke="#E63946" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span id="nav-wishlist-badge-count" class="nav-wishlist-badge-count nav-icon-badge" style="display: none;">0</span>
            </a>
        `;
        const cartHTML = role === 'ADMIN' ? '' : `
            <a href="./cart.html" class="nav-action-btn nav-cart-btn cart-icon-container" title="Cart" aria-label="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span id="nav-cart-badge-count" class="nav-cart-badge-count nav-icon-badge" style="display: none;">0</span>
            </a>
        `;

        const profileMenuHTML = `
            <div class="user-profile-menu">
                <div class="profile-display-btn nav-action-btn" id="nav-profile-btn" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Account" title="Account">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="profile-dropdown-menu">
                    ${token ? `
                        <div class="profile-dropdown-header">
                            <span class="profile-greeting" style="font-size: 13px; font-weight: 600; color: var(--gold-light, #C5A059);">Welcome back</span>
                            <span class="badge-role" style="margin-top: 4px; display: inline-block;">${role === 'ADMIN' ? 'Admin' : 'Customer'}</span>
                        </div>
                        ${dropdownItems}
                    ` : `
                        <div class="profile-dropdown-header">
                            <span class="profile-greeting" style="font-size: 13px; font-weight: 600; color: var(--gold-light, #C5A059);">Welcome</span>
                        </div>
                        <a href="./login.html" class="dropdown-item">Collector Login</a>
                        <a href="./register.html" class="dropdown-item">Create Account</a>
                    `}
                </div>
            </div>
        `;

        const isPagesDir = window.location.pathname.includes('/pages/');
        const homeHref = isPagesDir ? './index.html' : './pages/index.html';
        const logoSrc = isPagesDir ? './logo.jpg' : './pages/logo.jpg';

        header.innerHTML = `
            <div class="container">
                <div class="nav-left-group">
                    <a href="${homeHref}" class="logo" title="TimeVerse Home" aria-label="TimeVerse Home">
                        <img src="${logoSrc}" alt="TimeVerse Logo" class="brand-logo-img" onerror="if(!this.dataset.retried){this.dataset.retried=true; this.src=(window.location.pathname.includes('/pages/') ? '../logo.jpg' : './logo.jpg');}">
                        <span class="logo-title">TimeVerse</span>
                    </a>

                    <ul class="nav-menu" id="nav-menu">
                        ${navLinksHTML}
                        <div class="nav-actions mobile-only-actions">
                            <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-top:15px; flex-wrap:wrap; width:100%;">
                                <div style="width: 100%; margin-bottom: 8px;">${searchHTML}</div>
                                ${themeToggleHTML}
                                ${wishlistHTML}
                                ${cartHTML}
                                ${profileMenuHTML}
                            </div>
                        </div>
                    </ul>
                </div>

                <div class="nav-actions desktop-only-actions">
                    ${searchHTML}
                    ${themeToggleHTML}
                    ${wishlistHTML}
                    ${cartHTML}
                    ${profileMenuHTML}
                </div>

                <button class="mobile-nav-toggle" id="mobile-toggle" aria-label="Toggle Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        // Bind search input logic for both mobile and desktop
        document.querySelectorAll('.nav-search-input').forEach(input => {
            const searchParams = new URLSearchParams(window.location.search);
            const query = searchParams.get('search') || searchParams.get('q') || '';
            input.value = query;

            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    const val = this.value.trim();
                    window.location.href = `./products.html?search=${encodeURIComponent(val)}`;
                }
            });

            input.addEventListener('input', function () {
                const val = this.value.trim();
                const catalogSearch = document.getElementById('catalog-search');
                if (catalogSearch && catalogSearch.value !== val) {
                    catalogSearch.value = val;
                    catalogSearch.dispatchEvent(new Event('input'));
                }
            });
        });

        document.querySelectorAll('.nav-search-icon').forEach(icon => {
            icon.addEventListener('click', function () {
                const container = this.closest('.nav-search-container');
                if (container) {
                    const input = container.querySelector('.nav-search-input');
                    if (input) {
                        const val = input.value.trim();
                        if (val) {
                            window.location.href = `./products.html?search=${encodeURIComponent(val)}`;
                        } else {
                            input.focus();
                        }
                    }
                }
            });
        });

        const catalogSearch = document.getElementById('catalog-search');
        if (catalogSearch) {
            catalogSearch.addEventListener('input', function () {
                document.querySelectorAll('.nav-search-input').forEach(input => {
                    if (input.value !== catalogSearch.value) {
                        input.value = catalogSearch.value;
                    }
                });
            });
        }

        // Apply persisted theme and wire the toggle in both desktop/mobile navbars.
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('light-theme', savedTheme === 'light');
        const updateThemeButtons = (isLight) => {
            document.querySelectorAll('.theme-toggle-btn').forEach(b => {
                b.setAttribute('title', 'Theme');
                b.setAttribute('aria-label', 'Theme');
            });
        };
        updateThemeButtons(savedTheme === 'light');
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const light = !document.body.classList.contains('light-theme');
                document.body.classList.toggle('light-theme', light);
                localStorage.setItem('theme', light ? 'light' : 'dark');
                updateThemeButtons(light);
            });
        });

        // Handle Mobile menu toggles
        const mobileToggle = document.getElementById('mobile-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenu.classList.toggle('open');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && e.target !== mobileToggle && !mobileToggle.contains(e.target)) {
                    navMenu.classList.remove('open');
                }
            });

            // Close mobile menu when clicking any nav link inside it
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('open');
                });
            });
        }

        // Handle dropdown toggles
        document.querySelectorAll('.profile-display-btn').forEach(btn => {
            const parent = btn.closest('.user-profile-menu');
            if (!parent) return;

            const toggleDropdown = () => {
                // Close all other dropdowns
                document.querySelectorAll('.user-profile-menu').forEach(menu => {
                    if (menu !== parent) {
                        menu.classList.remove('active');
                        const b = menu.querySelector('.profile-display-btn');
                        if (b) b.setAttribute('aria-expanded', 'false');
                    }
                });

                const isActive = parent.classList.toggle('active');
                btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            };

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDropdown();
                }
            });
        });

        // Close dropdown when clicking outside and Escape key (Bound only once globally)
        if (!listenersBound) {
            window.addEventListener('click', () => {
                document.querySelectorAll('.user-profile-menu').forEach(menu => {
                    menu.classList.remove('active');
                    const btn = menu.querySelector('.profile-display-btn');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                });
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.user-profile-menu').forEach(menu => {
                        if (menu.classList.contains('active')) {
                            menu.classList.remove('active');
                            const btn = menu.querySelector('.profile-display-btn');
                            if (btn) {
                                btn.setAttribute('aria-expanded', 'false');
                                btn.focus();
                            }
                        }
                    });
                }
            });
            listenersBound = true;
        }

        if (token) {
            // Handle Change Password modal triggers
            document.querySelectorAll('.nav-change-pw-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    btn.closest('.user-profile-menu').classList.remove('active');
                    btn.closest('.user-profile-menu').querySelector('.profile-display-btn').setAttribute('aria-expanded', 'false');

                    const modal = document.getElementById('change-pw-modal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                });
            });

            // Handle logout
            document.querySelectorAll('.logout-link-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (typeof window.logout === 'function') {
                        await window.logout();
                    } else {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.replace('./login.html');
                    }
                });
            });

            // Inject global Change Password modal if not already present
            if (!document.getElementById('change-pw-modal')) {
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = `
                    <div class="modal-overlay" id="change-pw-modal">
                        <div class="modal-content" style="max-width: 400px;">
                            <button class="close-btn" id="close-change-pw-btn" aria-label="Close modal">&times;</button>
                            <h3 class="luxury-text" style="font-size: 1.25rem; margin-bottom: 25px; color: var(--gold); font-weight: 700; text-align: center;">Change Password</h3>

                            <form id="change-pw-form">
                                <div class="form-group">
                                    <label for="old-password" class="form-label">Current Password</label>
                                    <input type="password" id="old-password" class="form-control" placeholder="Enter current password" required>
                                </div>

                                <div class="form-group">
                                    <label for="change-new-password" class="form-label">New Password</label>
                                    <input type="password" id="change-new-password" class="form-control" placeholder="At least 6 characters" minlength="6" required>
                                </div>

                                <div class="form-group">
                                    <label for="change-confirm-password" class="form-label">Confirm New Password</label>
                                    <input type="password" id="change-confirm-password" class="form-control" placeholder="Re-enter new password" minlength="6" required>
                                </div>

                                <button type="submit" class="btn-luxury btn-luxury-solid" style="width:100%;margin-top:10px;">
                                    Update Security Password
                                </button>
                            </form>
                        </div>
                    </div>
                `;

                document.body.appendChild(modalContainer.firstElementChild);

                const modal = document.getElementById('change-pw-modal');
                const closeBtn = document.getElementById('close-change-pw-btn');
                const form = document.getElementById('change-pw-form');

                if (modal && closeBtn && form) {
                    closeBtn.addEventListener('click', () => {
                        modal.style.display = 'none';
                        form.reset();
                    });

                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                            form.reset();
                        }
                    });

                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();

                        const oldPassword = document.getElementById('old-password').value;
                        const newPassword = document.getElementById('change-new-password').value;
                        const confirmPassword = document.getElementById('change-confirm-password').value;

                        if (newPassword !== confirmPassword) {
                            showAlert('New passwords do not match.', 'error');
                            return;
                        }

                        try {
                            const response = await api.changePassword(oldPassword, newPassword);

                            if (response.success) {
                                showAlert('Password updated successfully!', 'success');
                                modal.style.display = 'none';
                                form.reset();
                            } else {
                                showAlert(response.message || 'Change password failed.', 'error');
                            }
                        } catch (err) {
                            showAlert(err.message || 'Incorrect old password or request failed.', 'error');
                        }
                    });
                }
            }
            fetchProfileDetails();
        }

        // Always update badges based on current user session
        if (hasValidCustomerSession()) {
            updateNavbarCartCount();
            updateNavbarWishlistCount();
        } else {
            document.querySelectorAll('#nav-cart-badge-count, .nav-cart-badge-count, .nav-wishlist-badge-count, #nav-wishlist-badge-count').forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
            document.querySelectorAll('.nav-wishlist-heart-svg').forEach(svg => {
                svg.setAttribute('fill', 'none');
            });
        }

        // Wire event listeners to navbar links for smooth scroll / navigation
        document.querySelectorAll('.nav-about-trigger').forEach(link => {
            link.addEventListener('click', (e) => {
                const onIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '' || window.location.pathname.includes('index.html');
                if (onIndexPage) {
                    e.preventDefault();
                    const aboutSection = document.getElementById('about-section');
                    if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    window.location.href = './index.html#about-section';
                }
            });
        });

        document.querySelectorAll('.nav-contact-trigger').forEach(link => {
            link.addEventListener('click', (e) => {
                const onIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '' || window.location.pathname.includes('index.html');
                if (onIndexPage) {
                    e.preventDefault();
                    const contactSection = document.getElementById('contact-section');
                    if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    window.location.href = './index.html#contact-section';
                }
            });
        });
    }

    // Listen to custom updates across tabs or pages
    window.addEventListener('wishlist-updated', function (e) {
        const explicitCount = e && e.detail && typeof e.detail.count === 'number' ? e.detail.count : undefined;
        if (typeof window.updateNavbarWishlistCount === 'function') {
            window.updateNavbarWishlistCount(explicitCount);
        }
    });

    window.addEventListener('cart-updated', function () {
        if (typeof window.updateNavbarCartCount === 'function') {
            window.updateNavbarCartCount();
        }
    });

    // Render navbar immediately if DOM ready, or when DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNavbar);
    } else {
        renderNavbar();
    }

})();