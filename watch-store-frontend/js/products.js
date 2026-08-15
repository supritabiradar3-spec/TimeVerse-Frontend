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

            if (response.success && response.data) {

                // Check URL parameter
                const params = new URLSearchParams(window.location.search);
                const urlCategoryName = params.get('category');

                if (urlCategoryName) {
                    const matchedCat = response.data.find(cat =>
                        cat.categoryName.toLowerCase() === urlCategoryName.toLowerCase()
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

                    const isActive =
                        state.categoryId === cat.categoryId ? 'active' : '';

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

                const links =
                    categoriesContainer.querySelectorAll('.filter-category-link');

                links.forEach(link => {
                    link.addEventListener('click', function () {

                        links.forEach(l => l.classList.remove('active'));
                        this.classList.add('active');

                        const id = this.dataset.id;

                        state.categoryId = id ? Number(id) : null;
                        state.page = 0;

                        loadProducts();
                    });
                });
            }

        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }


    // Load product list using filter api
    async function loadProducts() {
        const productGrid = document.getElementById('catalog-products-grid');
        const paginationContainer = document.getElementById('catalog-pagination');
        if (!productGrid) return;

        try {
            // Prefetch wishlist if logged in and not admin
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role') || 'CUSTOMER';
            if (token && role !== 'ADMIN' && !window.wishlistProductIds) {
                try {
                    const wishlist = await api.getWishlist();
                    window.wishlistProductIds = new Set(wishlist.map(item => item.productId));
                } catch (e) {
                    console.warn("Failed to load wishlist for catalog:", e);
                }
            }

            // Fetch filtered, paginated products
            const pageData = await api.filterProducts(state);

            // Note: Spring Boot Page contains: content, number, totalPages, totalElements
            const products = pageData.content || [];
            const currentPage = pageData.number || 0;
            const totalPages = pageData.totalPages || 0;

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

        // Check query params for category filter (e.g. from footer links)
        const params = new URLSearchParams(window.location.search);
        const urlCatId = params.get('categoryId');
        if (urlCatId) {
            state.categoryId = parseInt(urlCatId);
        }

        const urlKeyword = params.get('search') || params.get('q');
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
            await loadCategories();
            await loadProducts();
        }
    });
})();
