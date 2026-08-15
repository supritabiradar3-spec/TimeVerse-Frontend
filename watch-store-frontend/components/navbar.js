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
                    );;
                    renderNavbar(); // Re-render once cached
                }
            } catch (e) {
                console.warn('Failed to load profile for navbar cache:', e);
            }
        }
    }

    // Expose global wishlist count updater
    window.updateNavbarWishlistCount = async function () {
        const badgeCounts = document.querySelectorAll('#nav-wishlist-badge-count');
        if (badgeCounts.length === 0) return;

        try {
            if (window.api && typeof window.api.getWishlistCount === 'function') {
                const count = await window.api.getWishlistCount();
                badgeCounts.forEach(el => {
                    el.textContent = count;
                    el.style.display = count > 0 ? 'flex' : 'none';
                });
            }
        } catch (error) {
            console.error('Failed to update wishlist count badge:', error);
        }
    };

    // Expose global cart count updater
    window.updateNavbarCartCount = async function () {
        const badgeCounts = document.querySelectorAll('#nav-cart-badge-count');
        if (badgeCounts.length === 0) return;

        try {
            if (window.api && typeof window.api.getCartCount === 'function') {
                const count = await window.api.getCartCount();
                badgeCounts.forEach(el => {
                    el.textContent = count;
                    el.style.display = count > 0 ? 'flex' : 'none';
                });
            }
        } catch (error) {
            console.error('Failed to update cart count badge:', error);
        }
    };

    // Build the navbar HTML content
    function renderNavbar() {
        const header = document.querySelector('header');
        if (!header) return;

        // Retrieve auth state from localStorage
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role') || 'CUSTOMER';
        const fullName = username || 'Collector';
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

        const dropdownItems = role === 'ADMIN' ? `
            <a href="./admin.html" class="dropdown-item">📊 Dashboard</a>
            <span class="dropdown-item nav-change-pw-btn">🔒 Change Password</span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item logout-link-btn" style="color: var(--error); font-weight: 500;">🚪 Logout</span>
        ` : `
            <a href="./profile.html" class="dropdown-item">👤 My Profile</a>
            <a href="./orders.html" class="dropdown-item">📦 My Orders</a>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item logout-link-btn" style="color: var(--error); font-weight: 500;">🚪 Logout</span>
        `;

        const searchBarHTML = `
            <div class="nav-search-container">
                <input type="text" class="nav-search-input" placeholder="Search timepiece..." aria-label="Search timepiece">
                <span class="nav-search-icon">🔍</span>
            </div>
        `;

        const themeToggleHTML = `
            <button class="theme-toggle-btn" type="button" title="Toggle theme">☀️</button>
        `;

        const wishlistHTML = role === 'ADMIN' ? '' : `
            <a href="./wishlist.html" class="nav-action-btn" title="Wishlist" style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(197, 160, 89, 0.25); border-radius: 50%; text-decoration: none; font-size: 1.1rem;">
                ❤️ <span id="nav-wishlist-badge-count" class="nav-icon-badge" style="display: none;">0</span>
            </a>
        `;
        const cartHTML = role === 'ADMIN' ? '' : `
            <a href="./cart.html" class="nav-action-btn cart-icon-container" title="Cart" style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(197, 160, 89, 0.25); border-radius: 50%; text-decoration: none; font-size: 1.1rem;">
                🛒 <span id="nav-cart-badge-count" class="nav-icon-badge" style="display: none;">0</span>
            </a>
        `;

        const profileMenuHTML = token ? `
            <div class="user-profile-menu">
                <div class="profile-display-btn" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false" aria-label="User Profile Dropdown" style="padding: 4px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(197, 160, 89, 0.25);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16" style="color: var(--gold-light); display: block;">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                </div>
                <div class="profile-dropdown-menu">
                    <div class="profile-dropdown-header" style="padding: 15px 20px; border-bottom: 1px solid rgba(197, 160, 89, 0.15); text-align: left; background: rgba(255, 255, 255, 0.02); border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <span style="font-size: 0.75rem; color: var(--light-gray); display: block;">Welcome,</span>
                        <strong style="font-size: 0.9rem; color: var(--gold-light); display: block; margin-top: 2px; font-family: var(--font-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fullName}</strong>
                        <span class="badge badge-gold" style="font-size: 0.6rem; padding: 2px 6px; margin-top: 5px; border-radius: 2px; display: inline-block;">${role}</span>
                    </div>
                    ${dropdownItems}
                </div>
            </div>
        ` : `
            <a href="./login.html" class="btn-luxury" style="padding: 8px 16px; font-size: 0.75rem;">Login</a>
        `;

        const desktopActionsHTML = `
            ${searchBarHTML}
            ${themeToggleHTML}
            ${wishlistHTML}
            ${cartHTML}
            ${profileMenuHTML}
        `;

        const mobileActionsHTML = `
            ${searchBarHTML}
            <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin-top:15px; flex-wrap:wrap; width:100%;">
                ${themeToggleHTML}
                ${wishlistHTML}
                ${cartHTML}
                ${profileMenuHTML}
            </div>
        `;

        header.innerHTML = `
            <div class="container">
                <a href="./index.html" class="logo" style="display: flex; align-items: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold); display: block;">
                      <path d="M9 3.5L10 6h4l1-2.5M9 20.5l1-2.5h4l1 2.5" />
                      <circle cx="12" cy="12" r="7.5" />
                      <circle cx="12" cy="12" r="5.5" stroke-dasharray="1 2" opacity="0.6" />
                      <path d="M12 12l-2-2" stroke-width="2" />
                      <path d="M12 12l3-0.5" stroke-width="2" />
                      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                      <path d="M19.5 11h1v2h-1z" fill="currentColor" />
                    </svg>
                    <span>Time</span> Verse
                </a>
                
                <button class="mobile-nav-toggle" id="mobile-toggle" aria-label="Toggle Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                </button>

                <ul class="nav-menu" id="nav-menu">
                    ${navLinksHTML}
                    <div class="nav-actions mobile-only-actions">
                        ${mobileActionsHTML}
                    </div>
                </ul>

                <div class="nav-actions desktop-only-actions">
                    ${desktopActionsHTML}
                </div>
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
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
            btn.addEventListener('click', () => {
                const light = !document.body.classList.contains('light-theme');
                document.body.classList.toggle('light-theme', light);
                localStorage.setItem('theme', light ? 'light' : 'dark');
                document.querySelectorAll('.theme-toggle-btn').forEach(b => b.textContent = light ? '🌙' : '☀️');
            });
        });

        // Handle Mobile menu toggles
        const mobileToggle = document.getElementById('mobile-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
            });
        }

        if (token) {
            // Handle dropdown toggles
            document.querySelectorAll('.profile-display-btn').forEach(btn => {
                const parent = btn.closest('.user-profile-menu');

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
                                const displayBtn = menu.querySelector('.profile-display-btn');
                                if (displayBtn) {
                                    displayBtn.setAttribute('aria-expanded', 'false');
                                    displayBtn.focus();
                                }
                            }
                        });
                    }
                });
                listenersBound = true;
            }

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
                            <h3 class="luxury-text" style="font-size: 1.25rem; margin-bottom: 25px; color: var(--gold); text-transform: uppercase; text-align: center;">Change Password</h3>

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

            // Fetch counts & cache user details
            if (role !== 'ADMIN') {
                updateNavbarCartCount();
                updateNavbarWishlistCount();
            }
            fetchProfileDetails();
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

    // Render navbar when page loads
    document.addEventListener('DOMContentLoaded', renderNavbar);

})();