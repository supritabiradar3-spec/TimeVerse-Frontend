// Products Catalog Module for TimeVerse
// Professional View Collection Flow: Watch Type -> Customer Group (Women | Men | Kids | Couples)

(function () {
    const CATEGORY_MAP = {
        1: 'Women',
        2: 'Men',
        3: 'Kids',
        4: 'Couples',
        25: 'Women',
        26: 'Men',
        27: 'Kids',
        28: 'Couples'
    };

    const SUBCATEGORIES = ['Analog', 'Digital', 'Luxury', 'Sports'];

    const CUSTOMER_GROUPS = [
        { name: 'Women', id: 25 },
        { name: 'Men', id: 26 },
        { name: 'Kids', id: 27 },
        { name: 'Couples', id: 28 }
    ];

    const WATCH_COLLECTIONS = [
        { name: 'Analog Watches', subcategory: 'Analog' },
        { name: 'Digital Watches', subcategory: 'Digital' },
        { name: 'Luxury Watches', subcategory: 'Luxury' },
        { name: 'Sports Watches', subcategory: 'Sports' }
    ];

    // Current catalog state
    const state = {
        keyword: '',
        categoryId: null,
        subcategory: null,
        minPrice: null,
        maxPrice: null,
        inStock: null,
        page: 0,
        size: 20,
        sortBy: 'productId',
        direction: 'asc'
    };

    let allLoadedCategories = [];

    function getCustomerGroups() {
        const canonicalGroups = ['Women', 'Men', 'Kids', 'Couples'];
        if (allLoadedCategories && allLoadedCategories.length > 0) {
            return canonicalGroups.map((groupName, idx) => {
                const clean = groupName.toLowerCase();
                const matched = allLoadedCategories.find(c => {
                    if (!c || !c.categoryName) return false;
                    const name = c.categoryName.toLowerCase().trim();
                    if (name === clean) return true;
                    if (clean === 'kids' && (name.includes('kid') || name.includes('child') || name.includes('youth'))) return true;
                    if (clean === 'couples' && (name.includes('couple') || name.includes('pair'))) return true;
                    return false;
                });
                return {
                    name: groupName,
                    id: matched ? matched.categoryId : (idx + 1)
                };
            });
        }
        return [
            { name: 'Women', id: 25 },
            { name: 'Men', id: 26 },
            { name: 'Kids', id: 27 },
            { name: 'Couples', id: 28 }
        ];
    }

    function getCategoryNameById(id) {
        if (!id && id !== 0) return null;
        if (allLoadedCategories && allLoadedCategories.length > 0) {
            const matched = allLoadedCategories.find(c => String(c.categoryId) === String(id));
            if (matched && matched.categoryName) return matched.categoryName;
        }
        return CATEGORY_MAP[id] || 'Collection';
    }
    window.getCategoryNameById = getCategoryNameById;

    // Parse URL Query Parameters on initialization
    function parseUrlParameters(categoryList) {
        const params = new URLSearchParams(window.location.search);
        const urlCatId = params.get('categoryId');
        const urlCategoryName = params.get('category') || params.get('mainCategory') || params.get('group');
        const urlSubcategory = params.get('subcategory') || params.get('subCategory') || params.get('watchType');

        // Check if watchType / subcategory was passed
        if (urlSubcategory) {
            const matchedSub = SUBCATEGORIES.find(s => s.toLowerCase() === urlSubcategory.toLowerCase().trim());
            if (matchedSub) {
                state.subcategory = matchedSub;
            }
        }

        // Check if categoryName was actually a watch type (e.g., "Digital Watches")
        if (urlCategoryName && !state.subcategory) {
            const cleanName = urlCategoryName.toLowerCase().trim();
            const matchedWatchCol = WATCH_COLLECTIONS.find(wc =>
                wc.name.toLowerCase() === cleanName || wc.subcategory.toLowerCase() === cleanName
            );
            if (matchedWatchCol) {
                state.subcategory = matchedWatchCol.subcategory;
            }
        }

        // Helper to match category from list by name
        function findCategoryByName(nameKey) {
            if (!categoryList || categoryList.length === 0) return null;
            const target = nameKey.toLowerCase().trim();
            return categoryList.find(c => {
                if (!c || !c.categoryName) return false;
                const cn = c.categoryName.toLowerCase().trim();
                if (cn === target) return true;
                if (target === 'kids' && (cn.includes('kid') || cn.includes('child') || cn.includes('youth'))) return true;
                if (target === 'couples' && (cn.includes('couple') || cn.includes('pair'))) return true;
                if (target === 'women' && cn.includes('women')) return true;
                if (target === 'men' && (cn.includes('men') && !cn.includes('women'))) return true;
                return false;
            });
        }

        // Parse customer group / category ID
        if (urlCatId) {
            const parsedId = parseInt(urlCatId, 10);
            if (!isNaN(parsedId)) {
                const directMatch = categoryList && categoryList.find(c => c.categoryId === parsedId);
                if (directMatch) {
                    state.categoryId = directMatch.categoryId;
                } else {
                    const canonicalGroupMap = { 1: 'women', 2: 'men', 3: 'kids', 4: 'couples' };
                    const groupKey = canonicalGroupMap[parsedId];
                    if (groupKey) {
                        const nameMatch = findCategoryByName(groupKey);
                        if (nameMatch) {
                            state.categoryId = nameMatch.categoryId;
                        } else {
                            state.categoryId = parsedId;
                        }
                    } else {
                        state.categoryId = parsedId;
                    }
                }
            }
        } else if (urlCategoryName && !state.subcategory) {
            const cleanName = urlCategoryName.toLowerCase().trim();
            const matchedCat = findCategoryByName(cleanName);
            if (matchedCat) {
                state.categoryId = matchedCat.categoryId;
            } else {
                const groupMap = { 'women': 'women', 'men': 'men', 'kids': 'kids', 'couples': 'couples' };
                const groupKey = groupMap[cleanName] || (
                    cleanName.includes('kid') || cleanName.includes('child') ? 'kids' :
                    cleanName.includes('couple') || cleanName.includes('pair') ? 'couples' :
                    cleanName.includes('women') ? 'women' :
                    cleanName.includes('men') ? 'men' : null
                );
                if (groupKey) {
                    const mappedCat = findCategoryByName(groupKey);
                    if (mappedCat) {
                        state.categoryId = mappedCat.categoryId;
                    } else {
                        const fallbackMap = { 'women': 25, 'men': 26, 'kids': 27, 'couples': 28 };
                        state.categoryId = fallbackMap[groupKey] || null;
                    }
                }
            }
        }
    }

    // Update Header Banner Title, Breadcrumbs, and Subtitle
    function updateHeaderAndBreadcrumbs() {
        const titleEl = document.getElementById('showroom-page-title') || document.querySelector('.showroom-page-header h1');
        const breadcrumbsEl = document.getElementById('showroom-breadcrumbs') || document.querySelector('.showroom-page-header .breadcrumbs');
        const subtitleEl = document.getElementById('showroom-subtitle');

        const catName = state.categoryId ? getCategoryNameById(state.categoryId) : null;
        const subcatName = state.subcategory || null;

        // Title
        if (titleEl) {
            if (subcatName && catName) {
                titleEl.textContent = `${catName}'s ${subcatName} Watches`;
            } else if (subcatName) {
                titleEl.textContent = `${subcatName} Watches Collection`;
            } else if (catName) {
                titleEl.textContent = `${catName}'s Watch Collection`;
            } else {
                titleEl.textContent = 'The Showroom';
            }
        }

        // Breadcrumbs
        if (breadcrumbsEl) {
            if (subcatName && catName) {
                breadcrumbsEl.innerHTML = `
                    <a href="./index.html">Home</a>
                    <span class="sep">/</span>
                    <a href="./products.html" class="breadcrumb-all-link">Showroom</a>
                    <span class="sep">/</span>
                    <a href="./products.html?subcategory=${encodeURIComponent(subcatName)}" class="breadcrumb-subcat-link">${subcatName} Watches</a>
                    <span class="sep">/</span>
                    <span class="current">${catName}</span>
                `;
                const subcatLink = breadcrumbsEl.querySelector('.breadcrumb-subcat-link');
                if (subcatLink) {
                    subcatLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        state.categoryId = null;
                        state.page = 0;
                        updateUrlState();
                        renderCategoriesSidebar();
                        updateHeaderAndBreadcrumbs();
                        loadProducts();
                    });
                }
                const allLink = breadcrumbsEl.querySelector('.breadcrumb-all-link');
                if (allLink) {
                    allLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        state.subcategory = null;
                        state.categoryId = null;
                        state.page = 0;
                        updateUrlState();
                        renderCategoriesSidebar();
                        updateHeaderAndBreadcrumbs();
                        loadProducts();
                    });
                }
            } else if (subcatName) {
                breadcrumbsEl.innerHTML = `
                    <a href="./index.html">Home</a>
                    <span class="sep">/</span>
                    <a href="./products.html" class="breadcrumb-all-link">Showroom</a>
                    <span class="sep">/</span>
                    <span class="current">${subcatName} Watches</span>
                `;
                const allLink = breadcrumbsEl.querySelector('.breadcrumb-all-link');
                if (allLink) {
                    allLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        state.subcategory = null;
                        state.categoryId = null;
                        state.page = 0;
                        updateUrlState();
                        renderCategoriesSidebar();
                        updateHeaderAndBreadcrumbs();
                        loadProducts();
                    });
                }
            } else if (catName) {
                breadcrumbsEl.innerHTML = `
                    <a href="./index.html">Home</a>
                    <span class="sep">/</span>
                    <a href="./products.html" class="breadcrumb-all-link">Showroom</a>
                    <span class="sep">/</span>
                    <span class="current">${catName}</span>
                `;
            } else {
                breadcrumbsEl.innerHTML = `
                    <a href="./index.html">Home</a>
                    <span class="sep">/</span>
                    <span class="current">Collection</span>
                `;
            }
        }

        // Subtitle
        if (subtitleEl) {
            if (subcatName && catName) {
                subtitleEl.textContent = `Exquisite ${catName}'s ${subcatName} timepieces.`;
            } else if (subcatName) {
                subtitleEl.textContent = `Showing ${subcatName} Watches across Women, Men, Kids & Couples.`;
            } else if (catName) {
                subtitleEl.textContent = `Showing ${catName}'s timepieces across Analog, Digital, Luxury & Sports.`;
            } else {
                subtitleEl.textContent = 'Exquisite mechanical watches, handpicked for you.';
            }
        }
    }

    // Render Categories in Sidebar according to the active View Collection context
    function renderCategoriesSidebar() {
        const categoriesContainer = document.getElementById('categories-list');
        const widgetTitleEl = document.getElementById('filter-widget-category-title') || document.querySelector('.filter-widget-title');
        if (!categoriesContainer) return;

        let categoriesHTML = '';

        if (state.subcategory) {
            // Context: A specific watch type collection is active (e.g. "Digital")
            // Show: Categories -> View All Watch Types -> All [Type] Watches -> Filter by Group: -> Women, Men, Kids, Couples
            if (widgetTitleEl) {
                widgetTitleEl.textContent = 'Categories';
            }

            const isAllSubcatActive = state.subcategory && !state.categoryId;
            const groups = getCustomerGroups();

            categoriesHTML += `
                <li class="filter-category-item" style="margin-bottom: 10px;">
                    <div class="filter-back-to-all"
                         style="font-size: 0.8rem; color: var(--gold, #A88548); cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 4px 6px; border-radius: 4px; transition: background 0.2s ease;">
                        <span>&larr; View All Watch Types</span>
                    </div>
                </li>
                <li class="filter-category-item" style="margin-bottom: 6px;">
                    <div class="filter-category-header filter-all-subcat ${isAllSubcatActive ? 'active' : ''}"
                         style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.92rem; color: ${isAllSubcatActive ? 'var(--gold, #A88548)' : 'var(--white, #fff)'}; background: ${isAllSubcatActive ? 'rgba(168, 133, 72, 0.15)' : 'transparent'}; border: 1px solid ${isAllSubcatActive ? 'rgba(168, 133, 72, 0.3)' : 'transparent'}; transition: all 0.2s ease;">
                        <span>All ${state.subcategory} Watches</span>
                    </div>
                </li>
                <li class="filter-category-item" style="margin: 10px 0 6px 0;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gold, #A88548); padding: 4px 6px; font-weight: 600;">
                        Filter by Group:
                    </div>
                </li>
            `;

            groups.forEach(grp => {
                const isGroupActive = state.categoryId === grp.id;
                categoriesHTML += `
                    <li class="filter-category-item" style="margin: 3px 0;">
                        <div class="filter-group-choice ${isGroupActive ? 'active' : ''}"
                             data-group-id="${grp.id}"
                             data-group-name="${grp.name}"
                             style="display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem; font-weight: ${isGroupActive ? '600' : '400'}; color: ${isGroupActive ? 'var(--gold, #A88548)' : 'var(--white, #fff)'}; background: ${isGroupActive ? 'rgba(168, 133, 72, 0.15)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isGroupActive ? 'rgba(168, 133, 72, 0.3)' : 'rgba(255,255,255,0.04)'}; transition: all 0.2s ease;">
                            <span>${grp.name}</span>
                        </div>
                    </li>
                `;
            });

            categoriesContainer.innerHTML = categoriesHTML;

            // Bind click handler for "View All Watch Types"
            const backBtn = categoriesContainer.querySelector('.filter-back-to-all');
            if (backBtn) {
                backBtn.addEventListener('click', function () {
                    state.subcategory = null;
                    state.categoryId = null;
                    state.page = 0;
                    updateUrlState();
                    renderCategoriesSidebar();
                    updateHeaderAndBreadcrumbs();
                    loadProducts();
                });
            }

            // Bind click handler for "All [Type] Watches"
            const allSubcatBtn = categoriesContainer.querySelector('.filter-all-subcat');
            if (allSubcatBtn) {
                allSubcatBtn.addEventListener('click', function () {
                    state.categoryId = null;
                    state.page = 0;
                    updateUrlState();
                    renderCategoriesSidebar();
                    updateHeaderAndBreadcrumbs();
                    loadProducts();
                });
            }

            // Bind click handlers for Customer Groups
            const groupChoices = categoriesContainer.querySelectorAll('.filter-group-choice');
            groupChoices.forEach(choice => {
                choice.addEventListener('click', function () {
                    const rawGroupId = this.dataset.groupId;
                    const parsedGroupId = parseInt(rawGroupId, 10);
                    state.categoryId = parsedGroupId;
                    state.page = 0;
                    updateUrlState();
                    renderCategoriesSidebar();
                    updateHeaderAndBreadcrumbs();
                    loadProducts();
                });
            });

        } else {
            // Context: General showroom overview (No specific watch type selected yet)
            if (widgetTitleEl) {
                widgetTitleEl.textContent = 'Categories';
            }

            const isAllActive = !state.categoryId && !state.subcategory;

            categoriesHTML += `
                <li class="filter-category-item" style="margin-bottom: 8px;">
                    <div class="filter-category-header filter-all-timepieces ${isAllActive ? 'active' : ''}"
                         data-id=""
                         style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; color: ${isAllActive ? 'var(--gold, #A88548)' : 'var(--white, #fff)'}; background: ${isAllActive ? 'rgba(168, 133, 72, 0.15)' : 'transparent'}; border: 1px solid ${isAllActive ? 'rgba(168, 133, 72, 0.3)' : 'transparent'}; transition: all 0.2s ease;">
                        <span>All Timepieces</span>
                    </div>
                </li>
                <li class="filter-category-item" style="margin: 8px 0 4px 0;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--light-gray, #a0a0a0); padding: 4px 10px; font-weight: 600;">
                        Watch Collections:
                    </div>
                </li>
            `;

            WATCH_COLLECTIONS.forEach(wc => {
                categoriesHTML += `
                    <li class="filter-category-item" style="margin: 4px 0;">
                        <div class="filter-watch-col-choice"
                             data-subcat="${wc.subcategory}"
                             style="display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; border-radius: 5px; cursor: pointer; font-size: 0.92rem; font-weight: 500; color: var(--white, #fff); background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); transition: all 0.2s ease;">
                            <span>${wc.name}</span>
                        </div>
                    </li>
                `;
            });

            categoriesContainer.innerHTML = categoriesHTML;

            // Bind click handler for "All Timepieces"
            const allBtn = categoriesContainer.querySelector('.filter-all-timepieces');
            if (allBtn) {
                allBtn.addEventListener('click', function () {
                    state.categoryId = null;
                    state.subcategory = null;
                    state.page = 0;
                    updateUrlState();
                    renderCategoriesSidebar();
                    updateHeaderAndBreadcrumbs();
                    loadProducts();
                });
            }

            // Bind click handlers for Watch Collections
            const watchColChoices = categoriesContainer.querySelectorAll('.filter-watch-col-choice');
            watchColChoices.forEach(choice => {
                choice.addEventListener('click', function () {
                    const subcat = this.dataset.subcat;
                    state.subcategory = subcat;
                    state.categoryId = null;
                    state.page = 0;
                    updateUrlState();
                    renderCategoriesSidebar();
                    updateHeaderAndBreadcrumbs();
                    loadProducts();
                });
            });
        }
    }

    // Load categories list and insert hierarchical sidebar
    async function loadCategories() {
        try {
            let categoryList = [];
            if (window.api && typeof window.api.getCategories === 'function') {
                const response = await api.getCategories();
                if (response) {
                    if (Array.isArray(response)) {
                        categoryList = response;
                    } else if (response.data && Array.isArray(response.data)) {
                        categoryList = response.data;
                    } else if (response.content && Array.isArray(response.content)) {
                        categoryList = response.content;
                    }
                }
            }

            allLoadedCategories = categoryList;

            // Parse URL Query parameters
            parseUrlParameters(categoryList);

            // Render categories sidebar & update header
            renderCategoriesSidebar();
            updateHeaderAndBreadcrumbs();

        } catch (err) {
            console.error("Failed to load categories in sidebar:", err);
            parseUrlParameters([]);
            renderCategoriesSidebar();
            updateHeaderAndBreadcrumbs();
        }
    }

    function updateUrlState() {
        const url = new URL(window.location);
        if (state.categoryId) {
            url.searchParams.set('categoryId', state.categoryId);
            const catName = getCategoryNameById(state.categoryId);
            if (catName) url.searchParams.set('category', catName);
        } else {
            url.searchParams.delete('categoryId');
            url.searchParams.delete('category');
            url.searchParams.delete('group');
        }

        if (state.subcategory) {
            url.searchParams.set('subcategory', state.subcategory);
        } else {
            url.searchParams.delete('subcategory');
            url.searchParams.delete('watchType');
        }

        window.history.replaceState({}, '', url);
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
                size: typeof state.size === 'number' && !isNaN(state.size) && state.size > 0 ? state.size : 12,
                sortBy: state.sortBy || 'productId',
                direction: state.direction || 'asc'
            };

            if (state.keyword && String(state.keyword).trim()) {
                cleanFilters.keyword = String(state.keyword).trim();
            }
            if (typeof state.categoryId === 'number' && !isNaN(state.categoryId) && state.categoryId > 0) {
                cleanFilters.categoryId = state.categoryId;
            }
            if (state.subcategory && String(state.subcategory).trim()) {
                cleanFilters.subcategory = String(state.subcategory).trim();
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

            const fetchPagePromise = api.filterProducts(cleanFilters).catch(filterErr => {
                console.warn('Filter API fallback:', filterErr);
                return null;
            });

            // Parallel execution of wishlist and products fetching
            const [wishlistItems, res] = await Promise.all([wishlistPromise, fetchPagePromise]);

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
            } else {
                // Fallback to getAllProducts if filter endpoint returned null or failed
                try {
                    const allRes = await api.getAllProducts();
                    let allList = Array.isArray(allRes) ? allRes : (allRes && allRes.data && Array.isArray(allRes.data) ? allRes.data : []);
                    allList = allList.filter(p => p.name && !p.name.includes("Integration Test"));

                    if (cleanFilters.categoryId) {
                        allList = allList.filter(p => p.categoryId === cleanFilters.categoryId);
                    }
                    if (cleanFilters.subcategory) {
                        allList = allList.filter(p => p.subcategory && p.subcategory.toLowerCase() === cleanFilters.subcategory.toLowerCase());
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
                } catch (fallbackErr) {
                    console.error("Catalog fallback error:", fallbackErr);
                }
            }

            // Filter out any test products
            products = (products || []).filter(p => p.name && !p.name.includes("Integration Test"));

            // Populate wishlist IDs
            if (wishlistItems && Array.isArray(wishlistItems)) {
                window.wishlistProductIds = new Set(wishlistItems.map(item => item.productId));
            }

            // Render products
            if (!products || products.length === 0) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                        <h3 style="color: var(--white); font-family: var(--font-title); margin-bottom: 10px;">No Timepieces Found</h3>
                        <p style="color: var(--gray); font-size: 0.9rem;">Try adjusting your search criteria or explore other categories/subcategories.</p>
                    </div>
                `;
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }

            productGrid.innerHTML = products.map(p => createProductCardHtml(p)).join('');

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

        // Initial loadings - sequential to ensure categories & URL parameters are resolved before fetching products
        if (document.getElementById('catalog-products-grid')) {
            await loadCategories();
            await loadProducts();
        }
    });
})();
