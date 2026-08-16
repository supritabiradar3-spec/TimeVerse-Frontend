// Category Module for TimeVerse
(function () {

    const CATEGORY_IMAGES = {
        "Analog Watches": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2",
        "Digital Watches": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2",
        "Luxury Watches": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2",
        "Sports Watches": "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=600&cb=2"
    };

    const CATEGORY_ORDER = {
        "Analog Watches": 1,
        "Digital Watches": 2,
        "Luxury Watches": 3,
        "Sports Watches": 4
    };

    window.loadHomepageCategories = async function () {

        const grid = document.querySelector(".category-grid");
        if (!grid) return;

        try {

            if (!window.api || typeof window.api.getCategories !== "function") {
                return;
            }

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

            if (!categoryList || categoryList.length === 0) {
                return;
            }

            // Ensure all 4 categories are ordered: 1. Analog Watches, 2. Digital Watches, 3. Luxury Watches, 4. Sports Watches
            categoryList.sort((a, b) => {
                const nameA = a.categoryName || '';
                const nameB = b.categoryName || '';
                const orderA = CATEGORY_ORDER[nameA] || a.categoryId || 99;
                const orderB = CATEGORY_ORDER[nameB] || b.categoryId || 99;
                return orderA - orderB;
            });

            let categoriesHTML = "";

            categoryList.forEach(cat => {

                const categoryName = cat.categoryName;
                const categoryId = cat.categoryId;

                // Load custom category image from localStorage if it exists
                let customCatImg = localStorage.getItem('timeverse_category_img_' + categoryId) || 
                                   localStorage.getItem('timeverse_category_img_' + (categoryName || '').replace(/\s+/g, '_'));

                const expectedURL = CATEGORY_IMAGES[categoryName];

                if (expectedURL) {
                    if (customCatImg !== expectedURL) {
                        localStorage.setItem('timeverse_category_img_' + categoryId, expectedURL);
                        localStorage.setItem('timeverse_category_img_' + (categoryName || '').replace(/\s+/g, '_'), expectedURL);
                    }
                    customCatImg = expectedURL;
                }

                const imgUrl = customCatImg || expectedURL || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600";

                const categoryIcons = {
                    "Analog Watches": `
                        <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                    `,
                    "Digital Watches": `
                        <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="6" y="2" width="12" height="20" rx="4" />
                          <path d="M6 12h12" />
                          <path d="M12 2v20" />
                          <circle cx="12" cy="12" r="4" fill="none" />
                        </svg>
                    `,
                    "Luxury Watches": `
                        <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                          <path d="M3 20h18" stroke-width="2" />
                        </svg>
                    `,
                    "Sports Watches": `
                        <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 15 15" />
                          <path d="M16.24 7.76a6 6 0 1 0 0 8.49" />
                        </svg>
                    `
                };

                const iconSVG = categoryIcons[categoryName] || `
                    <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                `;

                categoriesHTML += `
                    <div class="category-card"
                        onclick="window.location.href='./products.html?categoryId=${categoryId}&category=${encodeURIComponent(categoryName)}'">
                        
                        <div class="category-card-img-wrapper">
                            <img
                                src="${imgUrl}"
                                alt="${categoryName}"
                                class="category-card-img">
                        </div>

                        <div class="category-card-info">
                            ${iconSVG}
                            <h3 class="category-card-title">
                                ${categoryName}
                            </h3>
                            <div class="category-card-divider"></div>
                            <div class="btn-view-collection">
                                View Collection &rarr;
                            </div>
                        </div>

                    </div>
                `;
            });

            grid.innerHTML = categoriesHTML;

        } catch (err) {

            console.error("Failed to load categories:", err);
        }

    };

    document.addEventListener("DOMContentLoaded", () => {
        window.loadHomepageCategories();
    });

})();