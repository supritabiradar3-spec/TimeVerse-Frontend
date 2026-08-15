console.log("PRODUCT CARD FILE LOADED");
// Reusable Product Card Component

(function () {
    const CATEGORY_MAP = {
        1: 'Analog Watches',
        2: 'Digital Watches',
        3: 'Luxury Watches',
        4: 'Sports Watches'
    };

    window.resolveImageUrl = function (url) {
        if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const baseUrl = (window.api && window.api.BASE_URL) ? window.api.BASE_URL : 'https://timeverse-backend.onrender.com';
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Deterministic rating helper to provide realistic reviews matching backend products
    window.getProductRating = function (productId) {
        const score = 4.0 + ((productId * 7) % 10) / 10.0;
        const count = 10 + (productId * 13) % 150;
        return { score: score.toFixed(1), count };
    };

    window.getStarsHtml = function (score) {
        const rounded = Math.round(parseFloat(score));
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rounded ? '★' : '☆';
        }
        return `<span class="stars-gold">${stars}</span>`;
    };

    window.openQuickView = async function (productId) {
        try {
            const product = await api.getProductById(productId);

            let rawImgUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400';
            if (product.images && product.images.length > 0 && product.images[0].imageUrl) {
                rawImgUrl = product.images[0].imageUrl;
            } else if (product.imageUrls && product.imageUrls.length > 0) {
                rawImgUrl = product.imageUrls[0];
            }
            const imgUrl = resolveImageUrl(rawImgUrl);
            const categoryName = CATEGORY_MAP[product.categoryId] || 'Curated Series';
            const rating = getProductRating(productId);
            const stars = getStarsHtml(rating.score);
            const formattedPrice = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(product.price);

            const isOutOfStock = product.stock <= 0;
            const stockBadge = isOutOfStock
                ? `<span class="badge badge-danger">Out of Stock</span>`
                : `<span class="badge badge-success">In Stock (${product.stock})</span>`;

            const overlay = document.createElement('div');
            overlay.className = 'quickview-overlay';
            overlay.id = 'quickview-modal-overlay';

            overlay.innerHTML = `
                <div class="quickview-content">
                    <button class="close-btn" id="close-quickview-btn" style="z-index: 10;">&times;</button>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #151515; border: var(--border); padding: 20px; border-radius: 8px; max-height: 400px;">
                        <img src="${imgUrl}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                        <div>
                            <span style="font-size: 0.75rem; color: var(--gold); letter-spacing: 1.5px; text-transform: uppercase;">${categoryName}</span>
                            <h2 class="luxury-text" style="font-size: 1.6rem; margin-top: 5px; margin-bottom: 10px; line-height: 1.2;">${product.name}</h2>
                            <div class="product-card-rating" style="margin-bottom: 15px;">
                                ${stars}
                                <span class="rating-score">${rating.score}</span>
                                <span class="rating-count">(${rating.count} reviews)</span>
                            </div>
                            <div style="font-size: 1.5rem; color: var(--gold-light); font-weight: 600; margin-bottom: 15px;">${formattedPrice}</div>
                            <p style="color: var(--light-gray); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">${product.description || 'Swiss mechanical complications and timeless elegance assemble this curated luxury timepiece.'}</p>
                            <div style="margin-bottom: 20px;">
                                <strong>Availability:</strong> ${stockBadge}
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px;">
                            <a href="./product-details.html?id=${productId}" class="btn-luxury" style="flex: 1; text-align: center; padding: 12px 0; font-size: 0.8rem;">Details</a>
                            <button class="btn-luxury btn-luxury-solid quick-add-cart-btn" data-id="${productId}" ${isOutOfStock ? 'disabled' : ''} style="flex: 1; padding: 12px 0; font-size: 0.8rem;">
                                ${isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const closeBtn = overlay.querySelector('#close-quickview-btn');
            closeBtn.addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });

            overlay.querySelector('.quick-add-cart-btn').addEventListener('click', () => {
                setTimeout(() => overlay.remove(), 800);
            });
        } catch (err) {
            console.error("Failed to load quick view details:", err);
            showAlert("Failed to load product details.", "error");
        }
    };

    window.createProductCardHtml = function (product) {
        const { productId, name, description, price, stock, categoryId, images, imageUrls } = product;

        let rawImgUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400';
        if (images && images.length > 0 && images[0].imageUrl) {
            rawImgUrl = images[0].imageUrl;
        } else if (imageUrls && imageUrls.length > 0) {
            rawImgUrl = imageUrls[0];
        }
        const imgUrl = resolveImageUrl(rawImgUrl);

        const categoryName = CATEGORY_MAP[categoryId] || 'Collection';
        const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);

        const rating = getProductRating(productId);
        const starsHtml = getStarsHtml(rating.score);

        const isOutOfStock = stock <= 0;
        const badgeHTML = isOutOfStock
            ? `<span class="badge badge-danger product-card-badge">Out of Stock</span>`
            : `<span class="badge badge-gold product-card-badge">In Stock (${stock})</span>`;

        const descExcerpt = description
            ? (description.length > 55 ? description.substring(0, 52) + '...' : description)
            : 'Explore luxury mechanical perfection.';

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role') || 'CUSTOMER';
        const isAdmin = token && role === 'ADMIN';

        const isWishlisted = window.wishlistProductIds && window.wishlistProductIds.has(parseInt(productId));

        const wishlistButtonHTML = isAdmin ? '' : `
            <button class="wishlist-toggle-icon-btn" data-id="${productId}" title="Bookmark to Wishlist" style="position: absolute; top: 15px; right: 15px; background: rgba(0, 0, 0, 0.6); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--gold-light); cursor: pointer; z-index: 10; transition: var(--transition);">
                ${isWishlisted ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--gold)" class="bi bi-heart-fill" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    </svg>
                `}
            </button>
        `;

        const addToBagButtonHTML = isAdmin ? '' : `
            <button class="btn-luxury btn-luxury-solid quick-add-cart-btn" 
                    data-id="${productId}" 
                    ${isOutOfStock ? 'disabled' : ''}
                    style="flex: 1.2;">
                ${isOutOfStock ? 'Sold Out' : 'Add to Bag'}
            </button>
        `;

        return `
            <div class="product-card" data-id="${productId}">
                <div class="product-card-img-container">
                    ${badgeHTML}
                    ${wishlistButtonHTML}
                    <a href="./product-details.html?id=${productId}">
                        <img src="${imgUrl}" alt="${name}" class="product-card-img" onerror="this.src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400'">
                    </a>
                </div>
                <div class="product-card-details">
                    <span class="product-card-category">${categoryName}</span>
                    <h3 class="product-card-name" title="${name}">
                        <a href="./product-details.html?id=${productId}">${name}</a>
                    </h3>
                    <div class="product-card-rating">
                        ${starsHtml}
                        <span class="rating-score">${rating.score}</span>
                        <span class="rating-count">(${rating.count})</span>
                    </div>
                    <p style="color: var(--light-gray); font-size: 0.85rem; margin-bottom: 15px;">${descExcerpt}</p>
                    <div class="product-card-price">${formattedPrice}</div>
                    
                    <div class="product-card-actions">
                        <button onclick="openQuickView(${productId})" class="btn-luxury" style="padding: 10px; font-size: 0.75rem; text-align: center; flex: 1;">Quick View</button>
                        ${addToBagButtonHTML}
                    </div>
                </div>
            </div>
        `;
    };

    // Event delegation helper for add to cart
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.quick-add-cart-btn');
        if (!btn) return;

        const productId = btn.dataset.id;

        // Ensure logged in
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Please log in to add items to your shopping bag.', 'error');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = 'Adding...';

            // Call global API helper
            if (window.api && typeof window.api.addToCart === 'function') {
                await window.api.addToCart(productId, 1);
                showAlert('Watch added to shopping bag successfully!', 'success');

                // Update badge dynamically
                if (typeof window.updateNavbarCartCount === 'function') {
                    await window.updateNavbarCartCount();
                }
            } else {
                showAlert('Cart controller not initialized.', 'error');
            }
        } catch (err) {
            showAlert(err.message || 'Failed to add item to cart.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Add to Bag';
        }
    });
    // Event delegation helper for wishlist toggle
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.wishlist-toggle-icon-btn');
        if (btn) {
            const productId = btn.getAttribute('data-id');
            if (!productId) return;

            const token = localStorage.getItem('token');
            if (!token) {
                showAlert('Please log in to add items to your wishlist.', 'error');
                setTimeout(() => {
                    window.location.href = './login.html';
                }, 1500);
                return;
            }

            try {
                btn.disabled = true;
                const heartSvg = btn.querySelector('svg');
                // Call add API
                const res = await api.addToWishlist(productId);
                showAlert('Watch bookmarked to wishlist successfully!', 'success');

                if (!window.wishlistProductIds) {
                    window.wishlistProductIds = new Set();
                }
                window.wishlistProductIds.add(parseInt(productId));

                if (heartSvg) {
                    heartSvg.outerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--gold)" class="bi bi-heart-fill" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                        </svg>
                    `;
                }

                if (typeof window.updateNavbarWishlistCount === 'function') {
                    await window.updateNavbarWishlistCount();
                }
            } catch (err) {
                if (err.message && err.message.includes('already exists')) {
                    try {
                        await api.removeFromWishlist(productId);
                        showAlert('Timepiece removed from wishlist.', 'success');

                        if (window.wishlistProductIds) {
                            window.wishlistProductIds.delete(parseInt(productId));
                        }

                        const heartSvg = btn.querySelector('svg');
                        if (heartSvg) {
                            heartSvg.outerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                                    <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                                </svg>
                            `;
                        }

                        if (typeof window.updateNavbarWishlistCount === 'function') {
                            await window.updateNavbarWishlistCount();
                        }
                    } catch (remErr) {
                        showAlert('Failed to toggle wishlist state.', 'error');
                    }
                } else {
                    showAlert(err.message || 'Failed to toggle wishlist.', 'error');
                }
            } finally {
                btn.disabled = false;
            }
        }
    });
})();
