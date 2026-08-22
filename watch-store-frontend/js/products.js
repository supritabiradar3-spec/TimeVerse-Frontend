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

    // Load categories list and insert in sidebar
    // Load categories list and insert in sidebar
    async function loadCategories() {
        const categoriesContainer = document.getElementById('categories-list');
        if (!categoriesContainer) return;

        try {
            const response = await api.getCategories();

            if (response && response.data && Array.isArray(response.data)) {
                // Check URL parameter for category
                const params = new URLSearchParams(window.location.search);
                const urlCatId = params.get('categoryId');
                const urlCategoryName = params.get('category');

                if (urlCatId) {
                    const parsedId = parseInt(urlCatId, 10);
                    if (!isNaN(parsedId) && parsedId > 0) {
                        state.categoryId = parsedId;
                    }
                } else if (urlCategoryName) {
                    const matchedCat = response.data.find(cat =>
                        cat.categoryName && cat.categoryName.toLowerCase() === urlCategoryName.toLowerCase().trim()
                    );
                    if (matchedCat) {
                        state.categoryId = matchedCat.categoryId;
                    }
                }

                let categoriesHTML = `
                <li class="filter-category-item">
                    <span class="filter-category-link ${!state.categoryId ? 'active' : ''}" data-id="">
                        All Watches
                    </span>
                </li>
            `;

                response.data.forEach(cat => {
                    const isActive = state.categoryId === cat.categoryId ? 'active' : '';
                    categoriesHTML += `
                    <li class="filter-category-item">
                        <span
                            class="filter-category-link ${isActive}"
                            data-id="${cat.categoryId}">
                            ${cat.categoryName}
                        </span>
                    </li>
                `;
                });

                categoriesContainer.innerHTML = categoriesHTML;

                const links = categoriesContainer.querySelectorAll('.filter-category-link');
                links.forEach(link => {
                    link.addEventListener('click', function () {
                        links.forEach(l => l.classList.remove('active'));
                        this.classList.add('active');

                        const rawId = this.dataset.id;
                        const parsedId = parseInt(rawId, 10);
                        state.categoryId = (!isNaN(parsedId) && parsedId > 0) ? parsedId : null;
                        state.page = 0;

                        loadProducts();
                    });
                });
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
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

            const fetchPagePromise = api.filterProducts(cleanFilters).catch(async (filterErr) => {
                console.warn('Filter API request encountered an issue, falling back to getAllProducts:', filterErr);
                const allRes = await api.getAllProducts();
                let allList = Array.isArray(allRes) ? allRes : (allRes && allRes.data && Array.isArray(allRes.data) ? allRes.data : []);

                // Client-side filtering
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
                if (typeof cleanFilters.minPrice === 'number') {
                    allList = allList.filter(p => p.price >= cleanFilters.minPrice);
                }
                if (typeof cleanFilters.maxPrice === 'number') {
                    allList = allList.filter(p => p.price <= cleanFilters.maxPrice);
                }
                if (cleanFilters.inStock === true) {
                    allList = allList.filter(p => p.stock > 0);
                }

                // Client-side sorting
                if (cleanFilters.sortBy === 'price') {
                    allList.sort((a, b) => cleanFilters.direction === 'desc' ? b.price - a.price : a.price - b.price);
                } else if (cleanFilters.sortBy === 'name') {
                    allList.sort((a, b) => cleanFilters.direction === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
                } else {
                    allList.sort((a, b) => cleanFilters.direction === 'desc' ? b.productId - a.productId : a.productId - b.productId);
                }

                const pageSize = cleanFilters.size || 9;
                const totalElements = allList.length;
                const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
                const pageNum = Math.min(cleanFilters.page || 0, totalPages - 1);
                const sliceStart = pageNum * pageSize;
                const pagedSlice = allList.slice(sliceStart, sliceStart + pageSize);

                return {
                    content: pagedSlice,
                    number: pageNum,
                    totalPages: totalPages,
                    totalElements: totalElements
                };
            });

            const [wishlistRes, pageData] = await Promise.all([wishlistPromise, fetchPagePromise]);

            if (wishlistRes && Array.isArray(wishlistRes)) {
                window.wishlistProductIds = new Set(wishlistRes.map(item => item.productId));
                if (typeof window.updateNavbarWishlistCount === 'function') {
                    window.updateNavbarWishlistCount(wishlistRes.length);
                }
            }

            // Note: Spring Boot Page contains: content, number, totalPages, totalElements
            let products = [];
            let currentPage = 0;
            let totalPages = 1;

            if (Array.isArray(pageData)) {
                products = pageData;
                currentPage = 0;
                totalPages = 1;
            } else if (pageData && Array.isArray(pageData.content)) {
                products = pageData.content;
                currentPage = typeof pageData.number === 'number' ? pageData.number : 0;
                totalPages = typeof pageData.totalPages === 'number' ? pageData.totalPages : 1;
            } else if (pageData && pageData.data) {
                if (Array.isArray(pageData.data)) {
                    products = pageData.data;
                } else if (pageData.data.content && Array.isArray(pageData.data.content)) {
                    products = pageData.data.content;
                    currentPage = typeof pageData.data.number === 'number' ? pageData.data.number : 0;
                    totalPages = typeof pageData.data.totalPages === 'number' ? pageData.data.totalPages : 1;
                }
            }

            if (products.length === 0) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray);">
                        <h3 class="luxury-text" style="font-size: 1.3rem; margin-bottom: 10px; color: var(--gold);">No Timepieces Found</h3>
                        <p style="color: var(--light-gray);">We couldn't find any watches matching your filters. Try widening your selection.</p>
                    </div>
                `;
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }

            // Render cards
            let gridHTML = '';
            products.forEach(prod => {
                gridHTML += createProductCardHtml(prod);
            });
            productGrid.innerHTML = gridHTML;

            // Render pagination controls
            if (paginationContainer) {
                renderPagination(currentPage, totalPages);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
            productGrid.innerHTML = `<p style="color: var(--error); text-align: center; grid-column: 1/-1;">Error loading collection. Please try again later.</p>`;
        }
    }

    // Render pagination buttons
    function renderPagination(current, total) {
        const container = document.getElementById('catalog-pagination');
        if (!container) return;

        if (total <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        // Prev button
        html += `<button class="btn-luxury" style="padding: 8px 15px; font-size: 0.75rem;" ${current === 0 ? 'disabled' : ''} id="pagination-prev">Prev</button>`;

        // Page numbers
        for (let i = 0; i < total; i++) {
            const isActive = i === current;
            html += `
                <button class="btn-luxury ${isActive ? 'btn-luxury-solid' : ''}" 
                        style="padding: 8px 15px; font-size: 0.75rem; margin: 0 4px;" 
                        data-page="${i}">
                    ${i + 1}
                </button>
            `;
        }

        // Next button
        html += `<button class="btn-luxury" style="padding: 8px 15px; font-size: 0.75rem;" ${current === total - 1 ? 'disabled' : ''} id="pagination-next">Next</button>`;

        container.innerHTML = html;

        // Bind clicks
        const buttons = container.querySelectorAll('button[data-page]');
        buttons.forEach(btn => {
            btn.addEventListener('click', function () {
                state.page = parseInt(this.getAttribute('data-page'));
                loadProducts();
                window.scrollTo({ top: 300, behavior: 'smooth' });
            });
        });

        const prevBtn = document.getElementById('pagination-prev');
        if (prevBtn && current > 0) {
            prevBtn.addEventListener('click', function () {
                state.page = current - 1;
                loadProducts();
                window.scrollTo({ top: 300, behavior: 'smooth' });
            });
        }

        const nextBtn = document.getElementById('pagination-next');
        if (nextBtn && current < total - 1) {
            nextBtn.addEventListener('click', function () {
                state.page = current + 1;
                loadProducts();
                window.scrollTo({ top: 300, behavior: 'smooth' });
            });
        }
    }

    // DOM Setup and listeners binding
    document.addEventListener('DOMContentLoaded', async function () {
        const searchInput = document.getElementById('catalog-search');
        const minPriceInput = document.getElementById('price-min');
        const maxPriceInput = document.getElementById('price-max');
        const inStockCheckbox = document.getElementById('filter-instock');
        const sortSelect = document.getElementById('catalog-sort');

        // Check query params for category filter (e.g. from footer links or category cards)
        const params = new URLSearchParams(window.location.search);
        const urlCatId = params.get('categoryId');
        const urlCategoryName = params.get('category');

        if (urlCatId) {
            const parsedId = parseInt(urlCatId, 10);
            if (!isNaN(parsedId) && parsedId > 0) {
                state.categoryId = parsedId;
            }
        } else if (urlCategoryName) {
            const catMap = {
                'analog': 1, 'analog watches': 1,
                'digital': 2, 'digital watches': 2,
                'luxury': 3, 'luxury watches': 3,
                'sports': 4, 'sports watches': 4
            };
            const matchedId = catMap[urlCategoryName.toLowerCase().trim()];
            if (matchedId) {
                state.categoryId = matchedId;
            }
        }

        const urlKeyword = params.get('search') || params.get('q') || params.get('keyword');
        if (urlKeyword) {
            state.keyword = urlKeyword.trim();
            if (searchInput) {
                searchInput.value = state.keyword;
            }
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
            const params = new URLSearchParams(window.location.search);
            const urlCategoryName = params.get('category');
            if (urlCategoryName) {
                // When filtering by named category from URL, resolve category list first
                await loadCategories();
                await loadProducts();
            } else {
                // Otherwise load categories and catalog products concurrently
                await Promise.all([loadCategories(), loadProducts()]);
            }
        }
    });
})();
