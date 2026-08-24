// Products Catalog Module for TimeVerse

(function () {
    // Current catalog state
    const state = {
        keyword: '',
        categoryId: null,
        minPrice: null,
        maxPrice: null,
        inStock: null,
        page: 0,
        size: 9,
        sortBy: 'productId',
        direction: 'asc'
    };

    let allLoadedCategories = [];

    // Load categories list and insert in sidebar
    async function loadCategories() {
        const categoriesContainer = document.getElementById('categories-list');
        if (!categoriesContainer) return;

        try {
            const response = await api.getCategories();
            let categoryList = [];

            if (response) {
                if (Array.isArray(response)) {
                    categoryList = response;
                } else if (response.data && Array.isArray(response.data)) {
                    categoryList = response.data;
                } else if (response.content && Array.isArray(response.content)) {
                    categoryList = response.content;
                }
            }

            allLoadedCategories = categoryList;

            // Check URL parameter for category
            const params = new URLSearchParams(window.location.search);
            const urlCatId = params.get('categoryId');
            const urlCategoryName = params.get('category') || params.get('mainCategory');

            if (urlCatId) {
                const parsedId = parseInt(urlCatId, 10);
                if (!isNaN(parsedId) && parsedId > 0) {
                    state.categoryId = parsedId;
                }
            } else if (urlCategoryName) {
                const cleanName = urlCategoryName.toLowerCase().trim();
                const matchedCat = categoryList.find(cat =>
                    cat.categoryName && cat.categoryName.toLowerCase().trim() === cleanName
                );
                if (matchedCat) {
                    state.categoryId = matchedCat.categoryId;
                } else {
                    // Fallback map
                    const catMap = { 'women': 1, 'men': 2, 'kids': 3, 'couples': 4 };
                    if (catMap[cleanName]) {
                        state.categoryId = catMap[cleanName];
                    }
                }
            }

            const isAllActive = !state.categoryId;

            let categoriesHTML = `
                <li class="filter-category-item" style="margin-bottom: 10px;">
                    <span class="filter-category-link ${isAllActive ? 'active' : ''}" data-id="" style="font-weight: 600; cursor: pointer;">
                        All Timepieces
                    </span>
                </li>
            `;

            // Render 4 main categories
            const mainNames = ["Women", "Men", "Kids", "Couples"];
            mainNames.forEach((mainName, idx) => {
                const catObj = categoryList.find(c => (c.categoryName || '').toLowerCase() === mainName.toLowerCase());
                const catId = catObj ? catObj.categoryId : (idx + 1);
                const isActive = state.categoryId === catId;

                categoriesHTML += `
                    <li class="filter-category-item" style="margin: 6px 0;">
                        <span class="filter-category-link ${isActive ? 'active' : ''}"
                              data-id="${catId}"
                              style="font-size: 0.92rem; padding: 6px 10px; display: block; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;">
                            ${mainName}
                        </span>
                    </li>
                `;
            });

            categoriesContainer.innerHTML = categoriesHTML;

            // Bind click handlers for category links
            const links = categoriesContainer.querySelectorAll('.filter-category-link');
            links.forEach(link => {
                link.addEventListener('click', function () {
                    links.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');

                    const rawId = this.dataset.id;
                    const parsedId = parseInt(rawId, 10);
                    if (!isNaN(parsedId) && parsedId > 0) {
                        state.categoryId = parsedId;
                    } else {
                        state.categoryId = null;
                    }
                    state.page = 0;
                    loadProducts();
                });
            });

        } catch (err) {
            console.error("Failed to load categories in sidebar:", err);
        }
    }

    // Load product list using filter api with resilient fallback
    async function loadProducts() {
        const productGrid = document.getElementById('catalog-products-grid');
        const paginationContainer = document.getElementById('catalog-pagination');
        if (!productGrid) return;

        try {
            // Prefetch wishlist concurrently if logged in and not admin
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role') || 'CUSTOMER';
            const wishlistPromise = (token && role !== 'ADMIN' && !window.wishlistProductIds)
                ? api.getWishlist().catch(e => {
                    console.warn("Failed to load wishlist for catalog:", e);
                    return [];
                })
                : Promise.resolve(null);

            // Sanitize filter state before making request
            const cleanFilters = {
                page: typeof state.page === 'number' && !isNaN(state.page) && state.page >= 0 ? state.page : 0,
                size: typeof state.size === 'number' && !isNaN(state.size) && state.size > 0 ? state.size : 9,
                sortBy: state.sortBy || 'productId',
                direction: state.direction || 'asc'
            };

            if (state.keyword && String(state.keyword).trim()) {
                cleanFilters.keyword = String(state.keyword).trim();
            }
            if (typeof state.categoryId === 'number' && !isNaN(state.categoryId) && state.categoryId > 0) {
                cleanFilters.categoryId = state.categoryId;
            }
            if (typeof state.minPrice === 'number' && !isNaN(state.minPrice) && state.minPrice >= 0) {
                cleanFilters.minPrice = state.minPrice;
            }
            if (typeof state.maxPrice === 'number' && !isNaN(state.maxPrice) && state.maxPrice >= 0) {
                cleanFilters.maxPrice = state.maxPrice;
            }
            if (state.inStock === true) {
                cleanFilters.inStock = true;
            }

            let products = [];
            let totalPages = 1;
            let totalElements = 0;

            try {
                const res = await api.filterProducts(cleanFilters);
                if (res && res.content) {
                    products = res.content;
                    totalPages = res.totalPages || 1;
                    totalElements = res.totalElements || products.length;
                } else if (Array.isArray(res)) {
                    products = res;
                    totalElements = res.length;
                    totalPages = 1;
                } else if (res && res.data) {
                    products = Array.isArray(res.data) ? res.data : (res.data.content || []);
                    totalPages = res.data.totalPages || 1;
                    totalElements = res.data.totalElements || products.length;
                }
            } catch (filterErr) {
                console.warn('Filter API fallback to getAllProducts:', filterErr);
                const allRes = await api.getAllProducts();
                let allList = Array.isArray(allRes) ? allRes : (allRes && allRes.data && Array.isArray(allRes.data) ? allRes.data : []);

                // Filter out any integration test products
                allList = allList.filter(p => p.name && !p.name.includes("Integration Test") && p.productId < 109);

                if (cleanFilters.categoryId) {
                    allList = allList.filter(p => p.categoryId === cleanFilters.categoryId);
                }
                if (cleanFilters.keyword) {
                    const kw = cleanFilters.keyword.toLowerCase();
                    allList = allList.filter(p =>
                        (p.name && p.name.toLowerCase().includes(kw)) ||
                        (p.description && p.description.toLowerCase().includes(kw))
                    );
                }
                if (cleanFilters.minPrice !== undefined) {
                    allList = allList.filter(p => p.price >= cleanFilters.minPrice);
                }
                if (cleanFilters.maxPrice !== undefined) {
                    allList = allList.filter(p => p.price <= cleanFilters.maxPrice);
                }
                if (cleanFilters.inStock) {
                    allList = allList.filter(p => p.stock > 0);
                }

                totalElements = allList.length;
                totalPages = Math.ceil(totalElements / cleanFilters.size) || 1;
                const startIdx = cleanFilters.page * cleanFilters.size;
                products = allList.slice(startIdx, startIdx + cleanFilters.size);
            }

            // Filter out any integration test products if present
            products = (products || []).filter(p => p.name && !p.name.includes("Integration Test") && p.productId < 109);

            // Await wishlist to resolve active states
            const wishlistItems = await wishlistPromise;
            if (wishlistItems && Array.isArray(wishlistItems)) {
                window.wishlistProductIds = new Set(wishlistItems.map(item => item.productId));
            }

            // Render products
            if (!products || products.length === 0) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                        <h3 style="color: var(--white); font-family: var(--font-title); margin-bottom: 10px;">No Timepieces Found</h3>
                        <p style="color: var(--gray); font-size: 0.9rem;">Try adjusting your search criteria or explore other categories.</p>
                    </div>
                `;
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }

            productGrid.innerHTML = products.map(p => {
                const mainImage = (p.images && p.images.length > 0)
                    ? p.images[0].imageUrl
                    : 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop';

                const inWishlist = window.wishlistProductIds ? window.wishlistProductIds.has(p.productId) : false;
                const wishlistClass = inWishlist ? 'active' : '';
                const stock = Number(p.stock || 0);
                const outOfStock = stock <= 0;

                const displayName = window.resolveProductName ? window.resolveProductName(p.name, p.productId) : (p.name && p.name.trim().toLowerCase() === 'titan neo updated' ? 'Titan Neo' : p.name);
                const displayRating = (typeof window.getProductDisplayRating === 'function')
                    ? window.getProductDisplayRating(p)
                    : (p.rating ? Number(p.rating).toFixed(1) : '4.8');

                const ratingBadge = `
                    <div class="product-card-rating" style="position: absolute; bottom: 10px; left: 10px; z-index: 5; background: rgba(14, 13, 11, 0.85); backdrop-filter: blur(4px); border: 1px solid rgba(168, 133, 72, 0.3); border-radius: 4px; padding: 3px 8px; display: flex; align-items: center; gap: 4px;">
                        <span style="color: var(--gold, #A88548); font-size: 0.85rem;">★</span>
                        <span style="color: #FFFFFF; font-size: 0.78rem; font-weight: 600; font-family: var(--font-body);">${displayRating}</span>
                    </div>
                `;

                return `
                    <div class="product-card" onclick="window.location.href='./product-details.html?id=${p.productId}'">
                        <div class="product-img-wrapper" style="position: relative;">
                            <img src="${mainImage}" alt="${displayName}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600'">
                            ${ratingBadge}
                            ${token && role !== 'ADMIN' ? `
                                <button class="product-wishlist-btn ${wishlistClass}"
                                        data-product-id="${p.productId}"
                                        onclick="event.stopPropagation(); window.toggleWishlist(${p.productId}, this);"
                                        title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                        <div class="product-info">
                            <h3 class="product-title" title="${displayName}">${displayName}</h3>
                            <div class="product-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
                            <div class="product-actions" onclick="event.stopPropagation();">
                                <button class="btn-product-action btn-add-cart"
                                        data-product-id="${p.productId}"
                                        ${outOfStock ? 'disabled' : ''}
                                        onclick="window.addToCart(${p.productId});">
                                    ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Render Pagination
            if (paginationContainer) {
                if (totalPages <= 1) {
                    paginationContainer.innerHTML = '';
                } else {
                    let pagHTML = `
                        <button class="pagination-btn" ${state.page === 0 ? 'disabled' : ''} onclick="window.changeCatalogPage(${state.page - 1})">
                            &larr; Prev
                        </button>
                    `;

                    for (let i = 0; i < totalPages; i++) {
                        pagHTML += `
                            <button class="pagination-btn ${state.page === i ? 'active' : ''}" onclick="window.changeCatalogPage(${i})">
                                ${i + 1}
                            </button>
                        `;
                    }

                    pagHTML += `
                        <button class="pagination-btn ${state.page === totalPages - 1 ? 'disabled' : ''} onclick="window.changeCatalogPage(${state.page + 1})">
                            Next &rarr;
                        </button>
                    `;
                    paginationContainer.innerHTML = pagHTML;
                }
            }

        } catch (err) {
            console.error("Failed to load catalog products:", err);
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="color: var(--danger, #ff4d4f);">Failed to load products. Please try again later.</p>
                </div>
            `;
        }
    }

    // Exposed pagination helper
    window.changeCatalogPage = function (page) {
        state.page = page;
        loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Global Add to Cart
    window.addToCart = async function (productId) {
        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof showAlert === 'function') {
                showAlert('Please sign in to add items to your cart.', 'error');
            } else {
                alert('Please sign in to add items to your cart.');
            }
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1200);
            return;
        }

        try {
            await api.addToCart({ productId: productId, quantity: 1 });
            if (typeof showAlert === 'function') {
                showAlert('Timepiece added to your cart.', 'success');
            }
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
        } catch (err) {
            console.error("Add to cart error:", err);
            if (typeof showAlert === 'function') {
                showAlert(err.message || 'Failed to add item to cart.', 'error');
            }
        }
    };

    // Global Toggle Wishlist
    window.toggleWishlist = async function (productId, btnElement) {
        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof showAlert === 'function') showAlert('Please sign in to save timepieces to wishlist.', 'error');
            setTimeout(() => window.location.href = './login.html', 1200);
            return;
        }

        try {
            if (!window.wishlistProductIds) window.wishlistProductIds = new Set();

            if (window.wishlistProductIds.has(productId)) {
                await api.removeFromWishlist(productId);
                window.wishlistProductIds.delete(productId);
                if (btnElement) {
                    btnElement.classList.remove('active');
                    btnElement.querySelector('svg').setAttribute('fill', 'none');
                }
                if (typeof showAlert === 'function') showAlert('Removed from wishlist.', 'success');
            } else {
                await api.addToWishlist(productId);
                window.wishlistProductIds.add(productId);
                if (btnElement) {
                    btnElement.classList.add('active');
                    btnElement.querySelector('svg').setAttribute('fill', 'currentColor');
                }
                if (typeof showAlert === 'function') showAlert('Added to wishlist.', 'success');
            }
        } catch (err) {
            console.error("Wishlist error:", err);
            if (typeof showAlert === 'function') showAlert(err.message || 'Wishlist operation failed.', 'error');
        }
    };

    // DOM Setup and listeners binding
    document.addEventListener('DOMContentLoaded', async function () {
        const searchInput = document.getElementById('catalog-search');
        const minPriceInput = document.getElementById('price-min');
        const maxPriceInput = document.getElementById('price-max');
        const inStockCheckbox = document.getElementById('filter-instock');
        const sortSelect = document.getElementById('catalog-sort');

        const params = new URLSearchParams(window.location.search);
        const urlKeyword = params.get('search') || params.get('q') || params.get('keyword');
        if (urlKeyword) {
            state.keyword = urlKeyword.trim();
            if (searchInput) searchInput.value = state.keyword;
        }

        // Search listener (Debounced)
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    state.keyword = this.value.trim();
                    state.page = 0;
                    loadProducts();
                }, 500);
            });
        }

        // Price range listener
        const applyPriceBtn = document.getElementById('apply-price-btn');
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener('click', function () {
                const min = parseFloat(minPriceInput.value);
                const max = parseFloat(maxPriceInput.value);
                state.minPrice = isNaN(min) ? null : min;
                state.maxPrice = isNaN(max) ? null : max;
                state.page = 0;
                loadProducts();
            });
        }

        // Stock availability listener
        if (inStockCheckbox) {
            inStockCheckbox.addEventListener('change', function () {
                state.inStock = this.checked ? true : null;
                state.page = 0;
                loadProducts();
            });
        }

        // Sort selector listener
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                const val = this.value;
                if (val) {
                    const [sortBy, direction] = val.split('-');
                    state.sortBy = sortBy;
                    state.direction = direction;
                } else {
                    state.sortBy = 'productId';
                    state.direction = 'asc';
                }
                state.page = 0;
                loadProducts();
            });
        }

        // Initial loadings
        if (document.getElementById('catalog-products-grid')) {
            await loadCategories();
            await loadProducts();
        }
    });
})();
