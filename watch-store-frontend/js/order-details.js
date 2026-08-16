// Order Details & Tracking Controller for TimeVerse

(function () {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (!orderId) {
        window.location.href = './orders.html';
        return;
    }

    // Currency Formatter
    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    async function loadOrderDetails() {
        const root = document.getElementById('order-details-root');
        if (!root) return;

        try {
            // Load products map for fallback images
            let productMap = {};
            try {
                const products = await api.getAllProducts();
                products.forEach(p => {
                    let img = '';
                    if (p.images && p.images.length > 0) {
                        img = p.images[0].imageUrl;
                    } else if (p.imageUrls && p.imageUrls.length > 0) {
                        img = p.imageUrls[0];
                    }
                    productMap[p.productId] = window.resolveImageUrl ? window.resolveImageUrl(img) : img;
                });
            } catch (pErr) {
                console.warn("Could not cache product images", pErr);
            }

            const order = await api.getOrderById(orderId);

            if (!order || !order.orderId) {
                root.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray);">
                        <h3 class="luxury-text" style="font-size: 1.4rem; color: var(--error); margin-bottom: 15px;">Order Not Found</h3>
                        <p style="color: var(--light-gray); margin-bottom: 25px;">Unable to locate reference #TV-ORD-${orderId}.</p>
                        <a href="./orders.html" class="btn-luxury btn-luxury-solid">Return to My Orders</a>
                    </div>
                `;
                return;
            }

            // Enforce unpaid visibility rule: hide unpaid checkout attempts
            const statusUpper = order.status ? String(order.status).toUpperCase().trim() : 'PLACED';
            if (statusUpper === 'PLACED' || statusUpper === 'PENDING' || statusUpper === 'CREATED') {
                showAlert('Unpaid order attempts are not accessible.', 'error');
                setTimeout(() => {
                    window.location.href = './orders.html';
                }, 1500);
                return;
            }

            const isCancelled = statusUpper === 'CANCELLED';

            // Format dates
            const createdDate = new Date(order.createdAt);
            const formattedCreatedDate = createdDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedCreatedTime = createdDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Estimated Delivery Date (Order date + 4 business days)
            const deliveryEstDate = new Date(createdDate);
            deliveryEstDate.setDate(deliveryEstDate.getDate() + 4);
            const formattedDeliveryDate = deliveryEstDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            // Determine active stage and status labels
            let headlineStatus = "Confirmed & In Preparation";
            let subheadline = `Estimated Delivery by ${formattedDeliveryDate}`;
            let activeHub = "TimeVerse Master Horology Vault";

            if (statusUpper === 'PACKED') {
                headlineStatus = "Inspected & Packed";
                subheadline = `Quality Certified & Ready for Transit`;
                activeHub = "TimeVerse Dispatch Centre";
            } else if (statusUpper === 'SHIPPED') {
                headlineStatus = "Dispatched / In Transit";
                subheadline = `Estimated Delivery by ${formattedDeliveryDate}`;
                activeHub = "Armoured Transit Hub";
            } else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'OUT FOR DELIVERY') {
                headlineStatus = "Out for White-Glove Delivery";
                subheadline = `Arriving Today by Dedicated Courier`;
                activeHub = "Local Distribution Facility";
            } else if (statusUpper === 'DELIVERED') {
                headlineStatus = "Delivered to Collector";
                subheadline = `Handed over successfully`;
                activeHub = "Delivered";
            } else if (isCancelled) {
                headlineStatus = "Order Cancelled";
                subheadline = "This order has been cancelled.";
            }

            // Build Items HTML
            const fallbackImg = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=300';
            let itemsHTML = '';
            let subtotalSum = 0;

            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const price = Number(item.price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = price * qty;
                    subtotalSum += lineTotal;

                    const itemImg = productMap[item.productId] || item.imageUrl || fallbackImg;
                    const resolvedImg = window.resolveImageUrl ? window.resolveImageUrl(itemImg) : itemImg;

                    itemsHTML += `
                        <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 18px 0; flex-wrap: wrap;">
                            <img src="${resolvedImg}" alt="${item.productName}" style="width: 75px; height: 75px; object-fit: contain; background: #141414; border: var(--border); border-radius: 8px; padding: 4px;" onerror="this.src='${fallbackImg}'">
                            <div style="flex: 1; min-width: 200px;">
                                <div style="font-size: 0.75rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Authentic Timepiece</div>
                                <h4 style="color: var(--white); font-size: 1.05rem; font-weight: 500; margin-bottom: 6px;">${item.productName || ('Product #' + item.productId)}</h4>
                                <div style="font-size: 0.85rem; color: var(--light-gray);">
                                    Qty: <strong style="color: var(--white);">${qty}</strong> &nbsp;|&nbsp; 
                                    Unit Price: <span style="color: var(--gold-light); font-weight: 500;">${formatCurrency(price)}</span>
                                </div>
                            </div>
                            <div style="text-align: right; min-width: 100px;">
                                <div style="font-size: 1.1rem; color: var(--gold-light); font-weight: 600;">${formatCurrency(lineTotal)}</div>
                                <span class="badge badge-success" style="font-size: 0.7rem; margin-top: 5px;">Prepaid</span>
                            </div>
                        </div>
                    `;
                });
            } else {
                itemsHTML = `<p style="color: var(--light-gray); font-style: italic;">No item details attached to this order.</p>`;
                subtotalSum = Number(order.totalAmount || 0);
            }

            // Tracking Stepper Calculation
            const steps = [
                { key: 'CONFIRMED', label: 'Ordered', date: formattedCreatedDate },
                { key: 'SHIPPED', label: 'Shipped', date: ['SHIPPED', 'OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'DELIVERED'].includes(statusUpper) ? 'Dispatched' : 'Pending' },
                { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', date: ['OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'DELIVERED'].includes(statusUpper) ? 'In Transit' : 'Pending' },
                { key: 'DELIVERED', label: 'Delivered', date: statusUpper === 'DELIVERED' ? 'Delivered' : formattedDeliveryDate }
            ];

            let progressPercent = 0;
            if (statusUpper === 'CONFIRMED' || statusUpper === 'PACKED') progressPercent = 15;
            else if (statusUpper === 'SHIPPED') progressPercent = 50;
            else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'OUT FOR DELIVERY') progressPercent = 85;
            else if (statusUpper === 'DELIVERED') progressPercent = 100;

            let stepperHTML = '';
            if (isCancelled) {
                stepperHTML = `
                    <div style="padding: 20px; background: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 8px; text-align: center; color: var(--error);">
                        <h4 style="font-size: 1.1rem; margin-bottom: 6px; color: var(--error);">Order Cancelled</h4>
                        <p style="font-size: 0.9rem; margin-bottom: 0;">This order has been CANCELLED. No tracking progress is available.</p>
                        ${order.cancellationReason ? `<div style="font-size: 0.85rem; color: var(--light-gray); margin-top: 8px;">Reason: <em>"${order.cancellationReason}"</em></div>` : ''}
                    </div>
                `;
            } else {
                let stepsItemsHTML = '';
                const stepKeys = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                const currentStatusNormalized = (statusUpper === 'OUT FOR DELIVERY' ? 'OUT_FOR_DELIVERY' : statusUpper);
                const currentIdx = stepKeys.indexOf(currentStatusNormalized);

                steps.forEach((step, idx) => {
                    const isCompleted = (currentIdx > idx) || (statusUpper === 'DELIVERED');
                    const isActive = (currentIdx === idx) || (idx === 0 && currentIdx === -1);

                    let circleClass = '';
                    let circleContent = idx + 1;
                    if (isCompleted) {
                        circleClass = 'completed';
                        circleContent = '✓';
                    } else if (isActive) {
                        circleClass = 'active';
                        circleContent = '●';
                    }

                    stepsItemsHTML += `
                        <div class="stepper-step">
                            <div class="step-circle ${circleClass}">${circleContent}</div>
                            <div class="step-title" style="color: ${isActive || isCompleted ? 'var(--white)' : 'var(--light-gray)'}">${step.label}</div>
                            <div class="step-date">${step.date}</div>
                        </div>
                    `;
                });

                stepperHTML = `
                    <div class="stepper-container">
                        <div class="card-header-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-4 0H1.5A1.5 1.5 0 0 1 0 10.5v-7zm1 0v7a.5.5 0 0 0 .5.5H2a2 2 0 0 1 3.999 0h5a2 2 0 0 1 3.999 0H14.5a.5.5 0 0 0 .5-.5V8.85a.5.5 0 0 0-.11-.313L13.41 6.688A.5.5 0 0 0 13.02 6.5H12V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z"/>
                            </svg>
                            Live Tracking Stepper
                        </div>

                        <div class="stepper-progress-bar">
                            <div class="stepper-connector">
                                <div class="stepper-connector-fill" style="width: ${progressPercent}%;"></div>
                            </div>
                            ${stepsItemsHTML}
                        </div>

                        <div style="text-align: center;">
                            <div class="active-hub-pill">
                                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
                                Active Stage: <strong style="color: var(--white);">${activeHub}</strong>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Refund Info (if cancelled and refund exists)
            let refundHTML = '';
            if (isCancelled) {
                const refundStatus = order.refundStatus || 'INITIATED';
                const refundAmount = order.refundAmount ? formatCurrency(order.refundAmount) : formatCurrency(order.totalAmount);
                refundHTML = `
                    <div class="section-card" style="border-color: rgba(212, 175, 55, 0.3);">
                        <div class="card-header-title" style="color: var(--gold);">
                            Refund Status & Details
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div>
                                <span style="font-size: 0.8rem; color: var(--light-gray); display: block;">Refund Status</span>
                                <span class="badge ${refundStatus.toUpperCase() === 'REFUNDED' ? 'badge-gold' : 'badge-danger'}" style="margin-top: 4px;">${refundStatus}</span>
                            </div>
                            <div>
                                <span style="font-size: 0.8rem; color: var(--light-gray); display: block;">Refund Amount</span>
                                <span style="font-size: 1.1rem; color: var(--gold-light); font-weight: 600;">${refundAmount}</span>
                            </div>
                            <div>
                                <span style="font-size: 0.8rem; color: var(--light-gray); display: block;">Source Gateway</span>
                                <span style="font-size: 0.95rem; color: var(--white);">Razorpay Original Account</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Delivery Address Card
            const addr = order.shippingAddress;
            let addressHTML = '';
            if (addr) {
                addressHTML = `
                    <div class="section-card">
                        <div class="card-header-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            Delivery Address
                        </div>
                        <div style="line-height: 1.7; color: var(--light-gray); font-size: 0.95rem;">
                            <div style="font-weight: 600; color: var(--white); font-size: 1rem; margin-bottom: 4px;">${addr.fullName || localStorage.getItem('fullName') || 'Valued Collector'}</div>
                            <div>${addr.street || ''}</div>
                            <div>${addr.city || ''}${addr.state ? ', ' + addr.state : ''} - ${addr.zipCode || ''}</div>
                            <div>${addr.country || 'India'}</div>
                            <div style="margin-top: 8px; color: var(--gold-light); display: flex; align-items: center; gap: 6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"/>
                                    <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                                </svg>
                                Contact Phone: ${addr.phone || 'Provided during payment'}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                addressHTML = `
                    <div class="section-card">
                        <div class="card-header-title">Delivery Information</div>
                        <p style="color: var(--light-gray);">Standard Insured Armoured Courier Delivery</p>
                    </div>
                `;
            }

            // Payment & Price Summary Card
            const discountAmount = Number(order.discountAmount || 0);
            const totalPaid = Number(order.totalAmount || 0);
            const rawSubtotal = subtotalSum > 0 ? subtotalSum : (totalPaid + discountAmount);

            let couponDiscountRow = '';
            if (discountAmount > 0) {
                couponDiscountRow = `
                    <div class="flex-between" style="padding: 8px 0; color: #39FF14; font-weight: 500;">
                        <span>Promo Privilege (${order.couponCode || 'TIMEVERSE10'})</span>
                        <span>-${formatCurrency(discountAmount)}</span>
                    </div>
                `;
            }

            const paymentSummaryHTML = `
                <div class="section-card">
                    <div class="card-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                            <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/>
                        </svg>
                        Payment & Price Breakdown
                    </div>

                    <div style="font-size: 0.95rem;">
                        <div class="flex-between" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <span style="color: var(--light-gray);">Bag Subtotal</span>
                            <span style="color: var(--white);">${formatCurrency(rawSubtotal)}</span>
                        </div>

                        ${couponDiscountRow}

                        <div class="flex-between" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <span style="color: var(--light-gray);">GST / Luxury Duties (Included)</span>
                            <span style="color: var(--white);">₹0.00</span>
                        </div>

                        <div class="flex-between" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <span style="color: var(--light-gray);">White-Glove Insured Shipping</span>
                            <span style="color: var(--success); font-weight: 500;">COMPLIMENTARY (₹0)</span>
                        </div>

                        <div class="flex-between" style="padding: 14px 0 0 0; margin-top: 10px; border-top: 1px solid rgba(212, 175, 55, 0.2); font-size: 1.15rem;">
                            <span style="color: var(--white); font-weight: 600;">Grand Total Paid</span>
                            <span style="color: var(--gold-light); font-weight: 700; font-size: 1.35rem;">${formatCurrency(totalPaid)}</span>
                        </div>
                    </div>

                    <div style="margin-top: 20px; background: rgba(0,0,0,0.3); border: var(--border); padding: 12px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.8rem; color: var(--light-gray);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--gold)" viewBox="0 0 16 16">
                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                        </svg>
                        Prepaid & Authenticated via Razorpay 256-Bit SSL Encryption
                    </div>
                </div>
            `;

            // Assemble Full Layout
            root.innerHTML = `
                <!-- Status Hero Card -->
                <div class="status-hero-card">
                    <div style="display: flex; align-items: center; gap: 18px;">
                        <div class="status-icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm.5 2.5a.5.5 0 0 0-1 0v3.5a.5.5 0 0 0 .146.354l2.5 2.5a.5.5 0 0 0 .708-.708L8.5 7.293V5z"/>
                            </svg>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px;">Order Reference #TV-ORD-${order.orderId}</div>
                            <h2 class="luxury-text" style="font-size: 1.45rem; color: var(--white); margin: 3px 0;">${headlineStatus}</h2>
                            <div style="font-size: 0.88rem; color: var(--light-gray);">${subheadline}</div>
                        </div>
                    </div>
                    <div>
                        <span class="badge ${isCancelled ? 'badge-danger' : 'badge-gold'}" style="font-size: 0.85rem; padding: 8px 16px; text-transform: uppercase;">${order.status}</span>
                    </div>
                </div>

                <!-- Live Tracking Stepper -->
                ${stepperHTML}

                <!-- Refund details (if cancelled) -->
                ${refundHTML}

                <!-- Ordered Items Card -->
                <div class="section-card">
                    <div class="card-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 7.982C9.664 6.302 10 4.384 10 3a2 2 0 0 0-2-2 2 2 0 0 0-2 2c0 1.384.336 3.302 2 4.982zm0 1.036C6.336 10.698 6 12.616 6 14a2 2 0 0 0 2 2 2 2 0 0 0 2-2c0-1.384-.336-3.302-2-4.982z"/>
                        </svg>
                        Ordered Timepieces (${(order.items || []).length})
                    </div>
                    ${itemsHTML}
                    <div style="font-size: 0.8rem; color: var(--gold-light); margin-top: 15px; display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        </svg>
                        Includes TimeVerse 2-Year International Warranty Certificate & Box
                    </div>
                </div>

                <!-- Delivery Address -->
                ${addressHTML}

                <!-- Payment Breakdown -->
                ${paymentSummaryHTML}
            `;

        } catch (err) {
            console.error('Failed to load order details:', err);
            root.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray);">
                    <h3 class="luxury-text" style="font-size: 1.4rem; color: var(--error); margin-bottom: 15px;">Unable to Load Order</h3>
                    <p style="color: var(--light-gray); margin-bottom: 25px;">${err.message || 'Please check your connection and try again.'}</p>
                    <a href="./orders.html" class="btn-luxury btn-luxury-solid">Return to My Orders</a>
                </div>
            `;
        }
    }

    // Bind Concierge Modal Events
    document.addEventListener('DOMContentLoaded', () => {
        loadOrderDetails();

        const helpBtn = document.getElementById('btn-help-concierge');
        const modal = document.getElementById('concierge-modal');
        const closeBtn = document.getElementById('close-concierge-modal');
        const doneBtn = document.getElementById('btn-concierge-done');

        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        if (doneBtn && modal) {
            doneBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    });

})();
