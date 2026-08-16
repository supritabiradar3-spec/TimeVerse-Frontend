// Cart Page Module for TimeVerse

(function () {
    // Check authentication
    if (!localStorage.getItem('token')) return;

    // Load Cart Items and Render
    async function loadCart() {
        const cartItemsTable = document.getElementById('cart-items-tbody');
        const cartContainer = document.getElementById('cart-page-container');
        if (!cartItemsTable || !cartContainer) return;

        try {
            const cartItems = await api.getCart();

            if (!cartItems || cartItems.length === 0) {
                localStorage.removeItem('cart_coupon_applied');
                renderEmptyCart(cartContainer);
                return;
            }

            let tbodyHTML = '';
            let subtotal = 0;

            cartItems.forEach(item => {
                const itemSubtotal = item.price * item.quantity;
                subtotal += itemSubtotal;

                const formattedPrice = formatCurrency(item.price);
                const formattedSubtotal = formatCurrency(itemSubtotal);
                const fallbackImg = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=150';
                const imageSrc = item.imageUrl || fallbackImg;

                tbodyHTML += `
                    <tr data-id="${item.productId}">
                        <td>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <img src="${imageSrc}" alt="${item.productName}" style="width: 72px; height: 72px; max-width: 72px; max-height: 72px; object-fit: contain; background: #151515; border: var(--border); padding: 5px;" onerror="this.src='${fallbackImg}'">
                                <div>
                                    <h4 class="luxury-text" style="font-size: 0.95rem; margin-bottom: 5px;">
                                        <a href="./product-details.html?id=${item.productId}">${window.resolveProductName ? window.resolveProductName(item.productName, item.productId) : item.productName}</a>
                                    </h4>
                                    <span style="font-size: 0.8rem; color: var(--light-gray);">ID: ${item.productId}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span style="color: var(--gold-light); font-weight: 500;">${formattedPrice}</span>
                        </td>
                        <td>
                            <div class="qty-adjuster" style="margin-bottom: 0;">
                                <button class="qty-btn qty-minus-btn" data-id="${item.productId}" data-qty="${item.quantity}">-</button>
                                <input type="number" class="qty-input cart-qty-input" data-id="${item.productId}" value="${item.quantity}" min="1" max="10">
                                <button class="qty-btn qty-plus-btn" data-id="${item.productId}" data-qty="${item.quantity}">+</button>
                            </div>
                        </td>
                        <td>
                            <span style="color: var(--white); font-weight: 600;">${formattedSubtotal}</span>
                        </td>
                        <td>
                            <button class="nav-action-btn remove-cart-item-btn" data-id="${item.productId}" style="color: var(--error);" title="Remove Watch">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `;
            });

            cartItemsTable.innerHTML = tbodyHTML;
            calculateAndRenderTotals(subtotal);

            // Bind actions
            bindCartActionListeners();
        } catch (err) {
            console.error('Failed to load cart items:', err);
            cartContainer.innerHTML = `<p style="color: var(--error); text-align: center; padding: 40px 0;">Error loading your shopping bag. Please refresh the page.</p>`;
        }
    }

    // Render empty cart layout
    function renderEmptyCart(container) {
        localStorage.removeItem('cart_coupon_applied');
        const applyBtn = document.getElementById('apply-coupon-btn');
        const couponMsg = document.getElementById('coupon-message');
        const couponInput = document.getElementById('coupon-code-input');
        if (applyBtn) {
            applyBtn.textContent = 'Apply';
            applyBtn.disabled = false;
        }
        if (couponMsg) {
            couponMsg.textContent = '';
            couponMsg.style.display = 'none';
        }
        if (couponInput) couponInput.value = '';

        container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; border: var(--border); background-color: var(--dark-gray);">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="var(--gold)" class="bi bi-bag-x" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                  <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 8.793l1.146-1.147a.5.5 0 0 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708z"/>
                  <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/>
                </svg>
                <h3 class="luxury-text" style="font-size: 1.5rem; margin-bottom: 15px; color: var(--gold);">Your Shopping Bag is Empty</h3>
                <p style="color: var(--light-gray); margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">Explore our curated collection of mechanical watches and find your next premium timepiece.</p>
                <a href="./products.html" class="btn-luxury btn-luxury-solid">Browse Timepieces</a>
            </div>
        `;
    }

    // Calculate totals
    function calculateAndRenderTotals(subtotal) {
        // Compute coupon discount
        const applied = localStorage.getItem('cart_coupon_applied') === 'true';
        const discount = applied ? (subtotal * 0.10) : 0;
        const grandTotal = Math.max(0, subtotal - discount);

        document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
        
        const couponRow = document.getElementById('coupon-row');
        const discountVal = document.getElementById('summary-discount');
        if (couponRow && discountVal) {
            if (applied && discount > 0) {
                discountVal.textContent = '-' + formatCurrency(discount);
                couponRow.style.display = 'flex';
            } else {
                couponRow.style.display = 'none';
            }
        }

        document.getElementById('summary-grandtotal').textContent = formatCurrency(grandTotal);

        // Store grand total in local storage for checkout
        localStorage.setItem('checkout_grand_total', grandTotal.toFixed(2));
    }

    // Helper: format currency
    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    // Attach actions on DOM buttons
    function bindCartActionListeners() {
        // Minus Buttons
        document.querySelectorAll('.qty-minus-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const productId = this.getAttribute('data-id');
                const currentQty = parseInt(this.getAttribute('data-qty'));
                if (currentQty <= 1) return; // cannot decrease below 1
                
                try {
                    await api.updateCart(productId, currentQty - 1);
                    await loadCart();
                    if (typeof window.updateNavbarCartCount === 'function') {
                        await window.updateNavbarCartCount();
                    }
                } catch (err) {
                    showAlert(err.message || 'Failed to update quantity.', 'error');
                }
            });
        });

        // Plus Buttons
        document.querySelectorAll('.qty-plus-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const productId = this.getAttribute('data-id');
                const currentQty = parseInt(this.getAttribute('data-qty'));
                if (currentQty >= 10) {
                    showAlert('Maximum quantity limit is 10.', 'error');
                    return;
                }
                
                try {
                    await api.updateCart(productId, currentQty + 1);
                    await loadCart();
                    if (typeof window.updateNavbarCartCount === 'function') {
                        await window.updateNavbarCartCount();
                    }
                } catch (err) {
                    showAlert(err.message || 'Failed to update quantity.', 'error');
                }
            });
        });

        // Direct inputs
        document.querySelectorAll('.cart-qty-input').forEach(input => {
            input.addEventListener('change', async function () {
                const productId = this.getAttribute('data-id');
                let newQty = parseInt(this.value);

                if (isNaN(newQty) || newQty < 1) {
                    newQty = 1;
                } else if (newQty > 10) {
                    newQty = 10;
                    showAlert('Maximum quantity limit is 10.', 'error');
                }

                try {
                    await api.updateCart(productId, newQty);
                    await loadCart();
                    if (typeof window.updateNavbarCartCount === 'function') {
                        await window.updateNavbarCartCount();
                    }
                } catch (err) {
                    showAlert(err.message || 'Failed to update quantity.', 'error');
                }
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-cart-item-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const productId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this timepiece from your shopping bag?')) {
                    try {
                        await api.removeFromCart(productId);
                        showAlert('Watch removed from shopping bag.', 'success');
                        await loadCart();
                        if (typeof window.updateNavbarCartCount === 'function') {
                            await window.updateNavbarCartCount();
                        }
                    } catch (err) {
                        showAlert(err.message || 'Failed to remove item.', 'error');
                    }
                }
            });
        });
    }

    // Initialize cart load on cart page
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('cart-items-tbody')) {
            loadCart();

            // Coupon privileges
            const applyBtn = document.getElementById('apply-coupon-btn');
            const couponInput = document.getElementById('coupon-code-input');
            const couponMsg = document.getElementById('coupon-message');
            
            if (applyBtn && couponInput) {
                // Ensure initial hidden state
                if (couponMsg) {
                    couponMsg.textContent = '';
                    couponMsg.style.display = 'none';
                }

                applyBtn.addEventListener('click', () => {
                    const code = couponInput.value.trim().toUpperCase();
                    if (code === 'TIMEVERSE10') {
                        localStorage.setItem('cart_coupon_applied', 'true');
                        applyBtn.textContent = 'Applied ✓';
                        applyBtn.disabled = true;
                        if (couponMsg) {
                            couponMsg.style.display = 'block';
                            couponMsg.style.setProperty('color', '#39FF14', 'important');
                            couponMsg.textContent = 'Coupon applied! You got 10% OFF.';
                        }
                        loadCart();
                    } else if (code === '') {
                        localStorage.removeItem('cart_coupon_applied');
                        applyBtn.textContent = 'Apply';
                        applyBtn.disabled = false;
                        if (couponMsg) {
                            couponMsg.textContent = '';
                            couponMsg.style.display = 'none';
                        }
                        loadCart();
                    } else {
                        localStorage.removeItem('cart_coupon_applied');
                        applyBtn.textContent = 'Apply';
                        applyBtn.disabled = false;
                        if (couponMsg) {
                            couponMsg.style.display = 'block';
                            couponMsg.style.setProperty('color', '#EF4444', 'important');
                            couponMsg.textContent = 'Invalid coupon code.';
                        }
                        loadCart();
                    }
                });

                couponInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!applyBtn.disabled) {
                            applyBtn.click();
                        }
                    }
                });

                couponInput.addEventListener('input', () => {
                    if (applyBtn.disabled && couponInput.value.trim().toUpperCase() !== 'TIMEVERSE10') {
                        applyBtn.textContent = 'Apply';
                        applyBtn.disabled = false;
                        if (couponMsg) {
                            couponMsg.textContent = '';
                            couponMsg.style.display = 'none';
                        }
                    }
                });
                
                // Show status on load
                if (localStorage.getItem('cart_coupon_applied') === 'true') {
                    couponInput.value = 'TIMEVERSE10';
                    applyBtn.textContent = 'Applied ✓';
                    applyBtn.disabled = true;
                }
            }
        }
    });
})();
