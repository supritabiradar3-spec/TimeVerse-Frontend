// Category Module for TimeVerse
(function () {

    const MAIN_CATEGORY_ORDER = ["Women", "Men", "Kids", "Couples"];

    const MAIN_CATEGORY_IMAGES = {
        "Women": "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=600&auto=format&fit=crop",
        "Men": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop",
        "Kids": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
        "Couples": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop"
    };

    const MAIN_CATEGORY_ICONS = {
        "Women": `
            <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
        `,
        "Men": `
            <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
              <path d="M3 20h18" stroke-width="2" />
            </svg>
        `,
        "Kids": `
            <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="2" width="12" height="20" rx="4" />
              <path d="M6 12h12" />
              <path d="M12 2v20" />
              <circle cx="12" cy="12" r="4" fill="none" />
            </svg>
        `,
        "Couples": `
            <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="12" r="7" />
              <circle cx="15" cy="12" r="7" />
            </svg>
        `
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

            // Map category names to category objects
            const catMap = {};
            categoryList.forEach(c => {
                const name = (c.categoryName || '').trim();
                catMap[name.toLowerCase()] = c;
            });

            let categoriesHTML = "";

            MAIN_CATEGORY_ORDER.forEach(mainGroup => {
                const catObj = catMap[mainGroup.toLowerCase()] || categoryList.find(c => (c.categoryName || '').toLowerCase().includes(mainGroup.toLowerCase()));
                const catId = catObj ? catObj.categoryId : (MAIN_CATEGORY_ORDER.indexOf(mainGroup) + 1);
                const imgUrl = MAIN_CATEGORY_IMAGES[mainGroup] || "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600";
                const iconSVG = MAIN_CATEGORY_ICONS[mainGroup] || MAIN_CATEGORY_ICONS["Men"];

                const linkUrl = `./products.html?categoryId=${catId}&category=${encodeURIComponent(mainGroup)}`;

                categoriesHTML += `
                    <div class="category-card" onclick="window.location.href='${linkUrl}'">
                        <div class="category-card-img-wrapper">
                            <img src="${imgUrl}" alt="${mainGroup} Collection" class="category-card-img">
                        </div>
                        <div class="category-card-info">
                            ${iconSVG}
                            <h3 class="category-card-title">${mainGroup}</h3>
                            <div class="category-sub-links" style="font-size: 0.85rem; color: var(--gold, #A88548); margin-top: 4px; font-weight: 500;">
                                20 Curated Timepieces
                            </div>
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