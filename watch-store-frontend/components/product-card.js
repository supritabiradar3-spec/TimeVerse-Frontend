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
        if (!url) return 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
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

    window.resolveProductName = function (name, productId) {
        if (!name) return 'Luxury Timepiece';
        const str = String(name).trim();
        if (str.toLowerCase() === 'titan neo updated' || Number(productId) === 1) {
            return 'Titan Neo';
        }
        return str;
    };

    window.openQuickView = async function (productId) {
        try {
            const product = await api.getProductById(productId);

            let rawImgUrl = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
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
                            <h2 class="luxury-text" style="font-size: 1.6rem; margin-top: 5px; margin-bottom: 10px; line-height: 1.2;">${window.resolveProductName(product.name, product.productId || productId)}</h2>
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
        if (!product) return '';
        const productId = product.productId || product.id || 0;
        const name = window.resolveProductName(product.name, productId);
        const description = product.description || '';
        const price = product.price || 0;
        const stock = typeof product.stock === 'number' ? product.stock : 1;
        const categoryId = product.categoryId || 1;
        const images = product.images;
        const imageUrls = product.imageUrls;

        let rawImgUrl = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
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
            <button class="quick-add-cart-btn product-btn-cart"
                    data-id="${productId}"
                    ${isOutOfStock ? 'disabled' : ''}
                    title="Add to Shopping Bag"
                    style="padding: 8px 10px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex: 0 0 38px; width: 38px; height: 38px; min-width: 38px; box-sizing: border-box; background-color: #FFFFFF; color: #1F3A5F; border: 1px solid #1F3A5F; border-radius: 4px; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#1F3A5F" viewBox="0 0 16 16">
                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
            </button>
        `;

        return `
            <div class="product-card" data-id="${productId}" data-name="${name}">
                <div class="product-card-img-container">
                    ${wishlistButtonHTML}
                    <a href="./product-details.html?id=${productId}">
                        <img src="${imgUrl}" alt="${name}" class="product-card-img" onload="if(this.naturalWidth/this.naturalHeight>=1.25){this.classList.add('img-landscape')}else if(this.naturalWidth/this.naturalHeight<=0.85){this.classList.add('img-portrait')}else{this.classList.add('img-square')}" onerror="this.src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400'">
                    </a>
                </div>
                <div class="product-card-details">
                    <span class="product-card-category">${categoryName}</span>
                    <h3 class="product-card-name" title="${name}">
                        <a href="./product-details.html?id=${productId}">${name}</a>
                    </h3>
                    <div class="product-card-price">${formattedPrice}</div>
                    
                    <div class="product-card-rating-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div class="product-card-rating" style="margin-bottom: 0;">
                            ${starsHtml}
                            <span class="rating-score">${rating.score}</span>
                            <span class="rating-count">(${rating.count})</span>
                        </div>
                        <span class="product-stock-indicator" style="font-size: 0.85rem; font-weight: 700; color: #1F3A5F; white-space: nowrap;">(${stock})</span>
                    </div>

                    <div class="product-card-actions" style="display: flex; gap: 8px; margin-top: auto; align-items: center;">
                        <a href="./product-details.html?id=${productId}" class="product-btn-buynow" style="padding: 10px 18px; font-size: 0.8rem; text-align: center; flex: 1; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center; letter-spacing: 0.5px; background-color: #1F3A5F; color: #FFFFFF; border: 1px solid #1F3A5F; border-radius: 4px;">Buy Now</a>
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

        const originalHTML = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                </svg>
            `;

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
            btn.innerHTML = originalHTML;
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

    // Auto-normalize any existing or dynamically loaded images
    window.normalizeProductImages = function () {
        document.querySelectorAll('.product-card-img').forEach(img => {
            if (img.complete && img.naturalWidth && img.naturalHeight) {
                const ar = img.naturalWidth / img.naturalHeight;
                if (ar >= 1.25) img.classList.add('img-landscape');
                else if (ar <= 0.85) img.classList.add('img-portrait');
                else img.classList.add('img-square');
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.normalizeProductImages);
    } else {
        window.normalizeProductImages();
    }
})();
