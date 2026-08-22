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

    // Known ratings mapping for consistent specification matching
    const KNOWN_RATINGS = {
        'titan neo': '4.7',
        'titan neo updated': '4.7',
        'uniquest blue dial watch': '4.3',
        'gosasa luxury watch': '4.8',
        'gosasa luxury hollowed men\'s watch': '4.8',
        'casio vintage digital': '4.5',
        'fossil gen 6': '4.6',
        'rolex submariner date': '4.9',
        'omega speedmaster': '4.9',
        'tag heuer carrera': '4.8',
        'tissot prx': '4.7',
        'seiko 5 sports': '4.4',
        'garmin fenix 7': '4.6',
        'apple watch ultra': '4.8',
        'samsung galaxy watch 6': '4.3',
        'timex marlin': '4.2',
        'citizen eco-drive': '4.5'
    };

    const RATING_POOL = ['4.7', '4.3', '4.8', '4.5', '4.1', '4.6', '4.4', '4.9', '4.2', '4.7', '4.5', '4.8', '4.3', '4.6', '4.4'];

    // Rating helper - uses genuine review rating if present, otherwise computes varied 4.0-4.9 rating
    window.getProductDisplayRating = function (productOrId) {
        if (!productOrId) return '4.5';
        let p = typeof productOrId === 'object' ? productOrId : { productId: productOrId };

        // If genuine review rating exists from backend, use real rating
        if (p.rating !== undefined && p.rating !== null && Number(p.rating) > 0) {
            return Number(p.rating).toFixed(1);
        }

        const name = String(p.name || p.productName || '').trim();
        const nameLower = name.toLowerCase();
        if (KNOWN_RATINGS[nameLower]) {
            return KNOWN_RATINGS[nameLower];
        }

        const id = Number(p.productId || p.id || 1);
        let charCodeSum = 0;
        for (let i = 0; i < name.length; i++) {
            charCodeSum += name.charCodeAt(i) * (i + 1);
        }

        const index = Math.abs(id * 17 + charCodeSum * 7 + 3) % RATING_POOL.length;
        return RATING_POOL[index];
    };

    window.getProductRating = function (productOrId) {
        if (productOrId && typeof productOrId === 'object') {
            if (productOrId.rating !== undefined && productOrId.rating !== null && Number(productOrId.rating) > 0) {
                return { score: Number(productOrId.rating).toFixed(1), count: productOrId.ratingCount || 1 };
            }
        }
        return { score: window.getProductDisplayRating(productOrId), count: 0 };
    };

    window.getStarsHtml = function (score) {
        const val = score || '4.5';
        return `<span class="rating-star">★</span> <span class="rating-value">${val}</span>`;
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

            let rawImgUrl = '';
            if (product.imageUrl) {
                rawImgUrl = product.imageUrl;
            } else if (product.image) {
                rawImgUrl = product.image;
            } else if (product.productImage) {
                rawImgUrl = product.productImage;
            } else if (product.images && product.images.length > 0) {
                rawImgUrl = typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].imageUrl || product.images[0].url || '');
            } else if (product.imageUrls && product.imageUrls.length > 0) {
                rawImgUrl = typeof product.imageUrls[0] === 'string' ? product.imageUrls[0] : (product.imageUrls[0].imageUrl || product.imageUrls[0].url || '');
            }

            if (!rawImgUrl) {
                rawImgUrl = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
            }

            const imgUrl = resolveImageUrl(rawImgUrl);
            const categoryName = CATEGORY_MAP[product.categoryId] || 'Curated Series';
            const displayRating = window.getProductDisplayRating ? window.getProductDisplayRating(product) : '4.5';
            const formattedPrice = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(product.price);

            const isOutOfStock = product.stock <= 0;
            const stockBadge = isOutOfStock
                ? `<span class="badge badge-danger">Out of Stock</span>`
                : `<span class="badge badge-success">In Stock (${product.stock})</span>`;

            const ratingHtml = `<div class="product-card-rating" style="margin-bottom: 15px;"><span class="rating-star">★</span> <span class="rating-value">${displayRating}</span></div>`;

            const overlay = document.createElement('div');
            overlay.className = 'quickview-overlay';
            overlay.innerHTML = `
                <div class="quickview-modal">
                    <button class="quickview-close-btn" title="Close modal">&times;</button>
                    <div class="quickview-content">
                        <div class="quickview-img-container">
                            <img src="${imgUrl}" alt="${product.name}" class="quickview-img" onerror="this.src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400'">
                        </div>
                        <div class="quickview-details">
                            <span class="quickview-category">${categoryName}</span>
                            <h2 class="quickview-title">${product.name}</h2>
                            ${ratingHtml}
                            <div class="quickview-price">${formattedPrice}</div>
                            <div class="quickview-meta">
                                ${stockBadge}
                                <span class="badge badge-gold">Authentic</span>
                            </div>
                            <p class="quickview-desc">${product.description || 'Exquisite horological design crafted for distinction and precision timekeeping.'}</p>
                            <div class="quickview-actions">
                                <a href="./product-details.html?id=${productId}" class="btn-luxury" style="text-align: center; text-decoration: none;">View Full Details</a>
                                <button class="btn-luxury btn-luxury-solid quick-modal-add-btn" data-id="${productId}" ${isOutOfStock ? 'disabled' : ''}>Add to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);

            // Bind close event
            const closeBtn = overlay.querySelector('.quickview-close-btn');
            const closeModal = () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            };

            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

            // Bind modal add to bag
            const addBtn = overlay.querySelector('.quick-modal-add-btn');
            if (addBtn) {
                addBtn.addEventListener('click', async () => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showAlert('Please log in to add items to your cart.', 'error');
                        setTimeout(() => {
                            window.location.href = './login.html';
                        }, 1000);
                        return;
                    }
                    try {
                        await api.addToCart(productId, 1);
                        showAlert('Added to your cart!', 'success');
                        closeModal();
                    } catch (err) {
                        showAlert('Failed to add to cart: ' + err.message, 'error');
                    }
                });
            }

        } catch (error) {
            console.error('Failed to load quick view:', error);
            showAlert('Could not load timepiece quick view.', 'error');
        }
    };

    window.createProductCardHtml = function (product) {
        if (!product) return '';
        const productId = product.productId || product.id || 0;
        const name = window.resolveProductName(product.name || product.productName, productId);
        const description = product.description || '';
        const price = product.price || 0;
        const stock = typeof product.stock === 'number' ? product.stock : 1;
        const categoryId = product.categoryId || 1;
        const images = product.images;
        const imageUrls = product.imageUrls;

        let rawImgUrl = '';
        if (product.imageUrl) {
            rawImgUrl = product.imageUrl;
        } else if (product.image) {
            rawImgUrl = product.image;
        } else if (product.productImage) {
            rawImgUrl = product.productImage;
        } else if (images && images.length > 0) {
            rawImgUrl = typeof images[0] === 'string' ? images[0] : (images[0].imageUrl || images[0].url || '');
        } else if (imageUrls && imageUrls.length > 0) {
            rawImgUrl = typeof imageUrls[0] === 'string' ? imageUrls[0] : (imageUrls[0].imageUrl || imageUrls[0].url || '');
        }

        if (!rawImgUrl) {
            rawImgUrl = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
        }

        const imgUrl = window.resolveImageUrl ? window.resolveImageUrl(rawImgUrl) : rawImgUrl;

        const categoryName = CATEGORY_MAP[categoryId] || 'Collection';
        const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);

        const displayRating = window.getProductDisplayRating ? window.getProductDisplayRating(product) : '4.5';
        const ratingHtml = `<div class="product-card-rating" style="margin-bottom: 0;"><span class="rating-star" style="color: #F59E0B; font-size: 0.85rem; margin-right: 3px;">★</span><span class="rating-value" style="font-weight: 600; font-size: 0.82rem; color: #4B5563;">${displayRating}</span></div>`;

        const isOutOfStock = stock <= 0;
        const badgeHTML = isOutOfStock
            ? `<span class="badge badge-danger product-card-badge">Out of Stock</span>`
            : `<span class="badge badge-gold product-card-badge">In Stock (${stock})</span>`;

        const descExcerpt = description
            ? (description.length > 55 ? description.substring(0, 52) + '...' : description)
            : 'Explore luxury mechanical perfection.';

        const token = localStorage.getItem('token');
        const role = (localStorage.getItem('role') || 'CUSTOMER').toUpperCase();
        const isAdmin = token && role === 'ADMIN';

        // Comprehensive check for Admin portal / Admin Products context
        const isCurrentPageAdmin = (typeof window !== 'undefined' && window.location && (
            window.location.pathname.toLowerCase().includes('admin') ||
            window.location.href.toLowerCase().includes('admin')
        )) || (typeof document !== 'undefined' && (
            !!document.querySelector('.admin-layout') ||
            !!document.querySelector('.admin-sidebar') ||
            !!document.getElementById('products-section') ||
            !!document.getElementById('admin-products-tbody')
        ));

        const isAdminContext = isCurrentPageAdmin || (product && product.isAdminContext) || (isAdmin && isCurrentPageAdmin);

        const isWishlisted = window.wishlistProductIds && window.wishlistProductIds.has(parseInt(productId));

        const heartIcon = isWishlisted
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="#E63946" class="bi bi-heart-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" stroke="#1F3A5F" stroke-width="1.6" class="bi bi-heart" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>`;

        const wishlistButtonHTML = (isAdmin || isAdminContext) ? '' : `
            <button class="wishlist-toggle-icon-btn" data-id="${productId}" title="${isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}" style="position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%; background: #FFFFFF; color: ${isWishlisted ? '#E63946' : '#1F3A5F'}; border: 1px solid rgba(31, 58, 95, 0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                ${heartIcon}
            </button>
        `;

        const addToBagButtonHTML = (isAdmin || isAdminContext) ? '' : `
            <button class="quick-add-cart-btn product-btn-cart"
                    data-id="${productId}"
                    title="Add to Cart"
                    aria-label="Add to Cart"
                    ${isOutOfStock ? 'disabled' : ''}
                    style="width: 38px; height: 38px; min-width: 38px; padding: 0; display: flex; align-items: center; justify-content: center; background-color: #1F3A5F; color: #FFFFFF; border: 1px solid #1F3A5F; border-radius: 4px; cursor: pointer; box-sizing: border-box; transition: all 0.2s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </button>
        `;

        const buyNowButtonHTML = (isAdmin || isAdminContext || isCurrentPageAdmin) ? '' : `
            <a href="./product-details.html?id=${productId}" class="product-btn-buynow" style="padding: 10px 16px; font-size: 0.8rem; text-align: center; flex: 1; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center; letter-spacing: 0.3px; background-color: #1F3A5F; color: #FFFFFF; border: 1px solid #1F3A5F; border-radius: 4px; box-sizing: border-box;">Buy Now</a>
        `;

        const cardActionsHTML = (buyNowButtonHTML || addToBagButtonHTML) ? `
            <div class="product-card-actions" style="display: flex; gap: 8px; margin-top: auto; align-items: center;">
                ${buyNowButtonHTML}
                ${addToBagButtonHTML}
            </div>
        ` : '';

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
                    
                    <div class="product-card-rating-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        ${ratingHtml}
                        <span class="product-stock-indicator" style="font-size: 0.85rem; font-weight: 700; color: #1F3A5F; white-space: nowrap;">(${stock})</span>
                    </div>

                    <p class="product-card-desc" style="font-size: 0.78rem; color: #6B7280; line-height: 1.35; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 2.7em;">${descExcerpt}</p>

                    ${cardActionsHTML}
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
