// Category Module for TimeVerse
(function () {

    const WATCH_CATEGORIES = [
        { name: "Analog Watches", subcategory: "Analog" },
        { name: "Digital Watches", subcategory: "Digital" },
        { name: "Luxury Watches", subcategory: "Luxury" },
        { name: "Sports Watches", subcategory: "Sports" }
    ];

    const CATEGORY_IMAGES = {
        "Analog Watches": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2",
        "Digital Watches": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2",
        "Luxury Watches": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2",
        "Sports Watches": "../sports-watch.jpg"
    };

    const CATEGORY_ORDER = {
        "Analog Watches": 1,
        "Digital Watches": 2,
        "Luxury Watches": 3,
        "Sports Watches": 4
    };

    const CATEGORY_ICONS = {
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

    window.loadHomepageCategories = async function () {
        const grid = document.querySelector(".category-grid");
        if (!grid) return;

        try {
            let categoryList = [];
            if (window.api && typeof window.api.getCategories === "function") {
                try {
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
                } catch (e) {
                    console.warn("Could not load backend categories for homepage:", e);
                }
            }

            let categoriesHTML = "";

            WATCH_CATEGORIES.forEach(item => {
                const categoryName = item.name;
                const subcat = item.subcategory;
                const imgUrl = CATEGORY_IMAGES[categoryName] || "../sports-watch.jpg";
                const iconSVG = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS["Analog Watches"];

                const viewCollectionUrl = `./products.html?subcategory=${encodeURIComponent(subcat)}`;

                categoriesHTML += `
                    <div class="category-card" onclick="window.location.href='${viewCollectionUrl}'">
                        <div class="category-card-img-wrapper">
                            <img src="${imgUrl}" alt="${categoryName}" class="category-card-img" onerror="this.src='../sports-watch.jpg'">
                        </div>
                        <div class="category-card-info">
                            ${iconSVG}
                            <h3 class="category-card-title">${categoryName}</h3>
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