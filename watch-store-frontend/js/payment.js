// Checkout and Razorpay Payment Controller for TimeVerse

(function () {
    // Check authentication
    if (!localStorage.getItem('token')) return;

    let cartSubtotal = 0;
    let checkoutTotalAmount = 0;

    // Load checkout items summary
    async function loadCheckoutSummary() {
        const summaryItemsContainer = document.getElementById('checkout-items-summary');
        const checkoutContainer = document.getElementById('checkout-page-container');
        if (!summaryItemsContainer || !checkoutContainer) return;

        try {
            const cartItems = await api.getCart();

            if (!cartItems || cartItems.length === 0) {
                checkoutContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray);">
                        <h3 class="luxury-text" style="font-size: 1.5rem; margin-bottom: 15px; color: var(--gold);">No Timepieces for Checkout</h3>
                        <p style="color: var(--light-gray); margin-bottom: 25px;">Your shopping bag is empty, so you cannot proceed to checkout.</p>
                        <a href="./products.html" class="btn-luxury btn-luxury-solid">Browse Collection</a>
                    </div>
                `;
                return;
            }

            let summaryHTML = '';
            cartSubtotal = 0;

            cartItems.forEach(item => {
                const itemTotal = item.price * item.quantity;
                cartSubtotal += itemTotal;
                
                const formattedPrice = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(item.price);

                summaryHTML += `
                    <div class="flex-between" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 12px 0;">
                        <div>
                            <span style="color: var(--white); font-weight: 500;">${item.productName}</span>
                            <span style="color: var(--gold); margin-left: 10px; font-size: 0.85rem;">x ${item.quantity}</span>
                        </div>
                        <span style="color: var(--gold-light); font-size: 0.95rem;">${formattedPrice}</span>
                    </div>
                `;
            });

            summaryItemsContainer.innerHTML = summaryHTML;
            calculateCheckoutTotals();
        } catch (err) {
            console.error('Failed to load checkout details:', err);
            showAlert('Failed to load order summary. Please reload the page.', 'error');
        }
    }

    // Calculate checkout totals
    function calculateCheckoutTotals() {
        const applied = localStorage.getItem('cart_coupon_applied') === 'true';
        const discount = applied ? (cartSubtotal * 0.10) : 0;
        checkoutTotalAmount = Math.max(0, cartSubtotal - discount);

        document.getElementById('checkout-subtotal').textContent = formatCurrency(cartSubtotal);

        const couponRow = document.getElementById('checkout-coupon-row');
        const discountElem = document.getElementById('checkout-discount');
        if (couponRow && discountElem) {
            if (applied && discount > 0) {
                discountElem.textContent = '-' + formatCurrency(discount);
                couponRow.style.display = 'flex';
            } else {
                couponRow.style.display = 'none';
            }
        }

        document.getElementById('checkout-grandtotal').textContent = formatCurrency(checkoutTotalAmount);
    }

    // Format currency helper
    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    // Process Complete Checkout and Payment Sequence
    async function processPayment(e) {
        e.preventDefault();

        // Get user details
        const name = document.getElementById('shipping-name').value.trim();
        const email = document.getElementById('shipping-email').value.trim();
        const phone = document.getElementById('shipping-phone').value.trim();
        const address = document.getElementById('shipping-address').value.trim();
        const city = document.getElementById('shipping-city').value.trim();
        const state = document.getElementById('shipping-state').value.trim();
        const country = document.getElementById('shipping-country').value.trim();
        const zipcode = document.getElementById('shipping-zipcode').value.trim();

        if (!name || !email || !phone || !address || !city || !state || !country || !zipcode) {
            showAlert('Please complete all shipping address fields.', 'error');
            return;
        }

        const userId = auth.getUserId();
        if (!userId) {
            showAlert('User session invalid. Please log in again.', 'error');
            return;
        }

        try {
            // STEP 1: Save the shipping address for this user.
            const addressResponse = await api.addAddress({
                fullName: name,
                phone,
                street: address,
                city,
                state,
                zipCode: zipcode,
                country,
                isDefault: true
            });

            // STEP 2: Place Order in DB using the saved address.
            showAlert('Creating order...', 'info');
            const couponCode = (localStorage.getItem('cart_coupon_applied') === 'true') ? 'TIMEVERSE10' : null;
            const orderResponse = await api.placeOrder(userId, addressResponse.addressId, couponCode);
            const orderId = orderResponse.orderId;
            const amount = orderResponse.totalAmount;

            // STEP 3: Create Razorpay Order via Backend
            showAlert('Initializing payment transaction...', 'info');
            const razorpayResponse = await api.createRazorpayOrder(userId, orderId, amount);

            const { paymentId, razorpayOrderId, razorpayKey } = razorpayResponse;

            // STEP 4: Configure and Open Razorpay Checkout Modal
            const options = {
                key: razorpayKey, // dynamically loaded from backend response!
                amount: Math.round(amount * 100), // amount in paise
                currency: "INR",
                name: "TimeVerse Watches",
                description: `Bespoke Order Reference #TV-ORD-${orderId}`,
                image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=150",
                order_id: razorpayOrderId,
                handler: async function (response) {
                    try {
                        showAlert('Verifying signature...', 'info');
                        // STEP 5: Call Verify API on payment success
                        const verificationResult = await api.verifyRazorpayPayment(
                            paymentId,
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature
                        );

                        // Clear coupon state on successful order placement
                        localStorage.removeItem('cart_coupon_applied');

                        // Show success layout on window
                        renderPaymentSuccess(orderId);
                        
                        // Clear cart locally if needed (backend does it automatically on placeOrder)
                        if (typeof window.updateNavbarCartCount === 'function') {
                            await window.updateNavbarCartCount();
                        }
                    } catch (verifyErr) {
                        console.error('Payment verification failed:', verifyErr);
                        showAlert(verifyErr.message || 'Payment authentication failed. Please contact support.', 'error');
                        // Update status to FAILED
                        await api.updatePaymentStatus(paymentId, 'FAILED');
                    }
                },
                prefill: {
                    name: name,
                    email: email,
                    contact: phone
                },
                notes: {
                    address: `${address}, ${city} - ${zipcode}`,
                    orderId: orderId.toString()
                },
                theme: {
                    color: "#111111" // Luxury dark theme matching the branding
                },
                modal: {
                    ondismiss: async function () {
                        showAlert('Transaction cancelled by user.', 'error');
                        // Update status to FAILED on modal close
                        try {
                            await api.updatePaymentStatus(paymentId, 'FAILED');
                        } catch (err) {
                            console.warn('Failed to update status on modal exit:', err);
                        }
                    }
                }
            };

            // Instantiate Razorpay checkout
            const rzp = new Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error('Checkout processing error:', err);
            showAlert(err.message || 'Failed to initialize payment. Try checking out again.', 'error');
        }
    }

    // Render Success Page
    function renderPaymentSuccess(orderId) {
        const checkoutPage = document.getElementById('checkout-page-container');
        if (!checkoutPage) return;

        checkoutPage.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; border: var(--border); background-color: var(--dark-gray); max-width: 600px; margin: 40px auto; box-shadow: var(--border-glow);">
                <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 30px auto; color: var(--gold); animation: pulse 2s infinite;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
                      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                </div>
                <h3 class="luxury-text" style="font-size: 1.8rem; margin-bottom: 15px; color: var(--gold);">Payment Authorized</h3>
                <h4 style="color: var(--white); font-weight: 400; margin-bottom: 20px;">Order Reference: #TV-ORD-${orderId}</h4>
                <p style="color: var(--light-gray); margin-bottom: 40px; line-height: 1.8; font-size: 0.95rem;">Thank you for shopping at TimeVerse. Your payment has been processed and your timepiece is being secured. You will be redirected to your Order History in a few moments.</p>
                <a href="./orders.html" class="btn-luxury btn-luxury-solid">View My Orders</a>
            </div>
            
            <style>
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
                }
            </style>
        `;

        // Redirect after 4 seconds
        setTimeout(() => {
            window.location.href = './orders.html';
        }, 4000);
    }

    // Initialize checkout form hooks on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        const checkoutForm = document.getElementById('checkout-shipping-form');

        // Prefill email and username if available
        const emailField = document.getElementById('shipping-email');
        const nameField = document.getElementById('shipping-name');
        if (emailField) emailField.value = localStorage.getItem('email') || '';
        if (nameField) nameField.value = localStorage.getItem('username') || '';

        if (checkoutForm) {
            loadCheckoutSummary();
            checkoutForm.addEventListener('submit', processPayment);
        }
    });
})();
