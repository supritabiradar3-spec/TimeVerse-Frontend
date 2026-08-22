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
            // Load products map for fallback/dynamic images
            let productMap = {};
            try {
                const products = await api.getAllProducts();
                if (Array.isArray(products)) {
                    products.forEach(p => {
                        let img = '';
                        if (p.images && p.images.length > 0) {
                            img = p.images[0].imageUrl;
                        } else if (p.imageUrls && p.imageUrls.length > 0) {
                            img = p.imageUrls[0];
                        }
                        productMap[p.productId] = window.resolveImageUrl ? window.resolveImageUrl(img) : img;
                    });
                }
            } catch (pErr) {
                console.warn("Could not cache product images", pErr);
            }
            const order = await api.getOrderById(orderId);
            if (!order || !order.orderId) {
                root.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray); border-radius: 10px;">
                        <h3 class="luxury-text" style="font-size: 1.4rem; color: var(--error); margin-bottom: 15px;">Order Not Found</h3>
                        <p style="color: var(--light-gray); margin-bottom: 25px;">Unable to locate order reference #TV-ORD-${orderId}.</p>
                        <a href="./orders.html" class="btn-luxury btn-luxury-solid">Return to Orders</a>
                    </div>
                `;
                return;
            }
            // Customer ownership verification: customers can only view their own orders
            const currentUserId = (window.auth && typeof window.auth.getUserId === 'function')
                ? window.auth.getUserId()
                : (localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId'), 10) : null);
            const isAdmin = (window.auth && typeof window.auth.isAdmin === 'function')
                ? window.auth.isAdmin()
                : (localStorage.getItem('role') === 'ADMIN');
            if (!isAdmin && currentUserId && order.userId && Number(order.userId) !== Number(currentUserId)) {
                root.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray); border-radius: 10px;">
                        <h3 class="luxury-text" style="font-size: 1.4rem; color: var(--error); margin-bottom: 15px;">Access Denied</h3>
                        <p style="color: var(--light-gray); margin-bottom: 25px;">You do not have authorization to view this order.</p>
                        <a href="./orders.html" class="btn-luxury btn-luxury-solid">Return to Orders</a>
                    </div>
                `;
                return;
            }
            const statusUpper = order.status ? String(order.status).toUpperCase().trim() : 'PLACED';
            const isCancelled = statusUpper === 'CANCELLED';
            const rawPaymentStatus = (order.paymentStatus || '').toUpperCase();
            let isPaid = false;
            let isPendingPayment = false;
            let isFailedPayment = false;
            if (rawPaymentStatus === 'SUCCESS' || rawPaymentStatus === 'PAID' || rawPaymentStatus === 'COMPLETED') {
                isPaid = true;
            } else if (rawPaymentStatus === 'FAILED') {
                isFailedPayment = true;
            } else if (rawPaymentStatus === 'PENDING' || rawPaymentStatus === 'CREATED' || rawPaymentStatus === 'UNPAID') {
                isPendingPayment = true;
            } else {
                if (statusUpper !== "PLACED" && statusUpper !== "CANCELLED") {
                    isPaid = true;
                } else if (isCancelled) {
                    isPaid = false;
                } else {
                    isPendingPayment = true;
                }
            }
            // Format dates
            const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
            const formattedCreatedDate = createdDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            // Estimated Delivery Date (Order date + 4 business days)
            const deliveryEstDate = new Date(createdDate);
            deliveryEstDate.setDate(deliveryEstDate.getDate() + 4);
            const formattedDeliveryDate = deliveryEstDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            // Determine headline status and payment badge
            let headlineStatus = "Order placed & confirmed";
            let deliveryStatusText = "Placed";
            if (isCancelled) {
                headlineStatus = "Order Cancelled";
                deliveryStatusText = "Cancelled";
            } else if (isFailedPayment) {
                headlineStatus = "Payment Failed";
                deliveryStatusText = "Payment Failed";
            } else if (isPendingPayment) {
                headlineStatus = "Order Placed & Awaiting Payment";
                deliveryStatusText = "Payment Pending";
            } else if (statusUpper === 'SHIPPED') {
                headlineStatus = "Order Dispatched & In Transit";
                deliveryStatusText = "Shipped";
            } else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'OUT FOR DELIVERY') {
                headlineStatus = "Out for Delivery";
                deliveryStatusText = "Out for Delivery";
            } else if (statusUpper === 'DELIVERED') {
                headlineStatus = "Order Delivered";
                deliveryStatusText = "Delivered";
            } else {
                headlineStatus = "Order placed & confirmed";
                deliveryStatusText = "Placed";
            }
            const paymentPillClass = isPaid ? 'pill-paid' : (isPendingPayment ? 'pill-pending' : 'pill-danger');
            const paymentPillText = isPaid ? 'PREPAID' : (isPendingPayment ? 'PENDING' : (isCancelled ? 'CANCELLED' : 'FAILED'));
            // Build Stepper Stages
            const stepKeys = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
            const currentStatusNormalized = (statusUpper === 'OUT FOR DELIVERY' ? 'OUT_FOR_DELIVERY' : statusUpper);
            let currentIdx = -1;
            if (statusUpper === 'PLACED' || statusUpper === 'PENDING' || statusUpper === 'CREATED' || statusUpper === 'CONFIRMED' || statusUpper === 'PACKED') {
                currentIdx = 0;
            } else if (statusUpper === 'SHIPPED') {
                currentIdx = 1;
            } else if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'OUT FOR DELIVERY') {
                currentIdx = 2;
            } else if (statusUpper === 'DELIVERED') {
                currentIdx = 3;
            }
            const step1State = currentIdx >= 0 ? (currentIdx > 0 ? 'completed' : 'active') : 'inactive';
            const step2State = currentIdx >= 1 ? (currentIdx > 1 ? 'completed' : 'active') : 'inactive';
            const step3State = currentIdx >= 2 ? (currentIdx > 2 ? 'completed' : 'active') : 'inactive';
            const step4State = currentIdx >= 3 ? 'completed active' : 'inactive';
            const step1Date = formattedCreatedDate;
            const step2Date = (currentIdx >= 1) ? formattedCreatedDate : '<span class="stepper-sub pending">Pending</span>';
            const step3Date = (currentIdx >= 2) ? 'In Transit' : '<span class="stepper-sub pending">Pending</span>';
            const step4Date = (currentIdx >= 3) ? 'Delivered' : formattedDeliveryDate;
            let stepperProgressPercent = 0;
            if (currentIdx === 0) stepperProgressPercent = 0;
            else if (currentIdx === 1) stepperProgressPercent = 33;
            else if (currentIdx === 2) stepperProgressPercent = 66;
            else if (currentIdx === 3) stepperProgressPercent = 100;
            let stepperHTML = '';
            if (isCancelled) {
                const cancelReason = order.cancellationReason || 'Changed my mind';
                stepperHTML = `
                    <div class="order-card" style="border-left: 4px solid #DC2626; background-color: rgba(220, 53, 69, 0.04);">
                        <h3 class="card-section-title" style="color: #DC2626; margin-bottom: 8px;">Order Cancelled</h3>
                        <div style="font-size: 0.86rem; color: #374151; margin-bottom: 6px;">
                            <strong>Cancellation reason:</strong> ${cancelReason}
                        </div>
                        ${isPaid ? `
                            <div style="font-size: 0.84rem; color: #4B5563; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(220, 53, 69, 0.25);">
                                <div><strong>Payment Status:</strong> Paid</div>
                                <div style="margin-top: 3px;"><strong>Refund Status:</strong> <span style="color: #D97706; font-weight: 600;">Refund Initiated</span></div>
                                <div style="margin-top: 3px;"><strong>Refund Amount:</strong> <span style="color: #1F3A5F; font-weight: 700;">${formatCurrency(totalPaid)}</span></div>
                            </div>
                        ` : `
                            <div style="font-size: 0.82rem; color: #6B7280; margin-top: 6px;">
                                <strong>Refund Status:</strong> Not Applicable (Order was unpaid)
                            </div>
                        `}
                    </div>
                `;
            } else {
                stepperHTML = `
                    <div class="order-card">
                        <h3 class="card-section-title">Order Status</h3>
                        <div class="stepper-track-wrap">
                            <div class="stepper-line-bg"></div>
                            <div class="stepper-line-fill" style="width: ${stepperProgressPercent}%;"></div>
                            <div class="stepper-nodes">
                                <!-- Stage 1: Ordered -->
                                <div class="stepper-node ${step1State}">
                                    <div class="stepper-dot"></div>
                                    <div class="stepper-label">Ordered</div>
                                    <div class="stepper-sub">${step1Date}</div>
                                </div>
                                <!-- Stage 2: Shipped -->
                                <div class="stepper-node ${step2State}">
                                    <div class="stepper-dot"></div>
                                    <div class="stepper-label">Shipped</div>
                                    <div class="stepper-sub">${step2Date}</div>
                                </div>
                                <!-- Stage 3: Out for Delivery -->
                                <div class="stepper-node ${step3State}">
                                    <div class="stepper-dot"></div>
                                    <div class="stepper-label">Out for Delivery</div>
                                    <div class="stepper-sub">${step3Date}</div>
                                </div>
                                <!-- Stage 4: Delivered -->
                                <div class="stepper-node ${step4State}">
                                    <div class="stepper-dot"></div>
                                    <div class="stepper-label">Delivered</div>
                                    <div class="stepper-sub">${step4Date}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            // Build Ordered Items Card
            const fallbackImg = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
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
                    const resolvedName = window.resolveProductName ? window.resolveProductName(item.productName, item.productId) : (item.productName || `Timepiece #${item.productId}`);
                    itemsHTML += `
                        <div class="timepiece-item-card" style="border-bottom: 1px solid #F3F4F6; padding-bottom: 10px; margin-bottom: 10px;">
                            <div class="timepiece-img-container">
                                <img src="${resolvedImg}" alt="${resolvedName}" onerror="this.src='${fallbackImg}'">
                            </div>
                            <div class="timepiece-info-col">
                                <h4 class="timepiece-name">${resolvedName}</h4>
                                <div class="timepiece-meta-row">
                                    <span>Qty: <strong style="color: #111827;">${qty}</strong></span>
                                    <span>•</span>
                                    <span>Unit Price: <strong>${formatCurrency(price)}</strong></span>
                                </div>
                                <div class="timepiece-price-tag">${formatCurrency(lineTotal)}</div>
                                <div class="timepiece-badge-auth">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                    Authentic Timepiece
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                itemsHTML = `<p style="color: var(--light-gray); font-style: italic;">No item details attached to this order.</p>`;
                subtotalSum = Number(order.totalAmount || 0);
            }
            // Build Delivery Information Card
            const addr = order.shippingAddress;
            let addressHTML = '';
            if (addr) {
                addressHTML = `
                    <div class="delivery-address-details">
                        <div class="delivery-field-title">Shipping Address</div>
                        <div style="font-weight: 600; color: #111827;">${addr.fullName || localStorage.getItem('fullName') || 'Valued Collector'}</div>
                        <div>${addr.street || ''}</div>
                        <div>${addr.city || ''}${addr.state ? ', ' + addr.state : ''} ${addr.zipCode || ''}</div>
                        ${addr.phone ? `<div style="margin-top: 4px; font-size: 0.82rem; color: #6B7280;">Phone: ${addr.phone}</div>` : ''}
                    </div>
                `;
            }
            // Payment & Price Breakdown Calculation
            const discountAmount = Number(order.discountAmount || 0);
            const totalPaid = Number(order.totalAmount || 0);
            const rawSubtotal = subtotalSum > 0 ? subtotalSum : (totalPaid + discountAmount);
            let couponDiscountRow = '';
            if (discountAmount > 0) {
                couponDiscountRow = `
                    <div class="breakdown-row" style="color: #059669; font-weight: 600;">
                        <span>Promo Privilege (${order.couponCode || 'TIMEVERSE10'})</span>
                        <span>-${formatCurrency(discountAmount)}</span>
                    </div>
                `;
            }
            // Payment Method Text
            let paymentMethodText = 'Prepaid via Razorpay';
            if (isPendingPayment) {
                paymentMethodText = 'Payment Pending — Awaiting Confirmation';
            } else if (isFailedPayment) {
                paymentMethodText = 'Payment Failed';
            } else if (isCancelled) {
                paymentMethodText = 'Order Cancelled — Payment Refund Initiated';
            }
            // Assemble Full Order Details Page HTML
            root.innerHTML = `
                <!-- 1. Top Header Card -->
                <div class="order-header-card">
                    <div class="order-ref-badge">Order #TV-ORD-${order.orderId}</div>
                    <div class="order-headline-row">
                        <h1 class="order-headline-text">${headlineStatus}</h1>
                        <span class="order-payment-pill ${paymentPillClass}">${paymentPillText}</span>
                    </div>
                    <div class="order-dates-meta">
                        <span>Placed on: <strong>${formattedCreatedDate}</strong></span>
                        <span>Estimated delivery: <strong>${formattedDeliveryDate}</strong></span>
                    </div>
                </div>
                <!-- 2. Order Status Stepper Card -->
                ${stepperHTML}
                <!-- 3. Two-Column Grid: Ordered Timepiece + Delivery Information -->
                <div class="order-two-col-grid">
                    <!-- Left: Ordered Timepiece -->
                    <div class="order-card">
                        <h3 class="card-section-title">Ordered Timepiece</h3>
                        ${itemsHTML}
                    </div>
                    <!-- Right: Delivery Information -->
                    <div class="order-card">
                        <h3 class="card-section-title">Delivery Information</h3>
                        <div class="delivery-courier-header">
                            <div class="delivery-courier-title">Standard Insured</div>
                            <div class="delivery-courier-sub">Armoured Courier Delivery</div>
                        </div>
                        <div class="delivery-info-row">
                            <div class="delivery-field-title">Estimated Delivery</div>
                            <div class="delivery-field-val">${formattedDeliveryDate}</div>
                        </div>
                        <div class="delivery-info-row">
                            <div class="delivery-field-title">Delivery Status</div>
                            <div class="delivery-field-val">${deliveryStatusText}</div>
                        </div>
                        ${addressHTML}
                    </div>
                </div>
                <!-- 4. Payment & Price Breakdown Card (Full Width) -->
                <div class="order-card">
                    <h3 class="card-section-title">Payment & Price Breakdown</h3>
                    <div class="payment-breakdown-list">
                        <div class="breakdown-row">
                            <span>Bag Subtotal</span>
                            <span style="font-weight: 600; color: #111827;">${formatCurrency(rawSubtotal)}</span>
                        </div>
                        ${couponDiscountRow}
                        <div class="breakdown-row">
                            <span>GST / Luxury Duties (Included)</span>
                            <span style="color: #111827;">₹0.00</span>
                        </div>
                        <div class="breakdown-row">
                            <span>Insured Shipping</span>
                            <span style="color: #059669; font-weight: 600;">Complimentary</span>
                        </div>
                        <div class="breakdown-row grand-total">
                            <span>Grand Total Paid</span>
                            <span class="grand-total-amount">${formatCurrency(totalPaid)}</span>
                        </div>
                    </div>
                    <div class="payment-gateway-note">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>${paymentMethodText}</span>
                    </div>
                </div>
                <!-- 5. TimeVerse Authenticity Card -->
                <div class="order-card">
                    <h3 class="card-section-title">TimeVerse Authenticity</h3>
                    <div class="authenticity-items-grid">
                        <div class="auth-check-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <span>Authentic Timepiece</span>
                        </div>
                        <div class="auth-check-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>2-Year International Warranty</span>
                        </div>
                        <div class="auth-check-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>Warranty Certificate</span>
                        </div>
                        <div class="auth-check-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                            <span>Insured Delivery</span>
                        </div>
                    </div>
                    <div class="authenticity-note">
                        Includes warranty certificate & original box
                    </div>
                </div>
                <!-- 6. Bottom Actions: Outside and directly below the main order boxes -->
                <div class="order-bottom-actions-row">
                    <a href="./products.html" class="btn-order-action btn-continue-shopping">Continue Shopping</a>
                    <div class="order-invoice-download-col">
                        <button id="download-invoice-btn" class="btn-order-action btn-download-invoice">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Download Invoice PDF</span>
                        </button>
                        <span id="invoice-status-msg" style="font-size: 0.76rem; color: #DC2626; display: none; margin-top: 4px;"></span>
                    </div>
                </div>
            `;
            // Bind Invoice Download Button
            const invoiceBtn = document.getElementById('download-invoice-btn');
            if (invoiceBtn) {
                invoiceBtn.addEventListener('click', () => {
                    downloadOrderInvoicePDF(order, rawSubtotal, totalPaid, discountAmount, formattedCreatedDate, formattedDeliveryDate, headlineStatus, paymentMethodText, statusUpper);
                });
            }
        } catch (err) {
            console.error('Failed to load order details:', err);
            root.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; border: var(--border); background-color: var(--dark-gray); border-radius: 10px;">
                    <h3 class="luxury-text" style="font-size: 1.4rem; color: var(--error); margin-bottom: 15px;">Unable to Load Order</h3>
                    <p style="color: var(--light-gray); margin-bottom: 25px;">${err.message || 'Please check your connection and try again.'}</p>
                    <a href="./orders.html" class="btn-luxury btn-luxury-solid">Return to Orders</a>
                </div>
            `;
        }
    }
    async function downloadOrderInvoicePDF(order, rawSubtotal, totalPaid, discountAmount, formattedCreatedDate, formattedDeliveryDate, headlineStatus, paymentMethodText, statusUpper) {
        const btn = document.getElementById('download-invoice-btn');
        const statusMsg = document.getElementById('invoice-status-msg');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFFFFF"></path>
                </svg>
                <span>Preparing Invoice...</span>
            `;
        }
        if (statusMsg) {
            statusMsg.style.display = 'none';
            statusMsg.textContent = '';
        }
        try {
            const addr = order.shippingAddress || {};
            const customerName = addr.fullName || localStorage.getItem('fullName') || 'Valued Collector';
            const customerEmail = localStorage.getItem('email') || (order.user && order.user.email) || 'collector@timeverse.com';
            const customerPhone = addr.phone || '';
            const shippingAddressText = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
            const invoiceNo = `TV-INV-${String(order.orderId).padStart(4, '0')}`;
            const fileName = `TimeVerse_Invoice_TV-ORD-${order.orderId}.pdf`;
            // Build item rows for this specific order only
            let pdfItemsRows = '';
            if (order.items && order.items.length > 0) {
                order.items.forEach((item, index) => {
                    const price = Number(item.price || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = price * qty;
                    const resolvedName = window.resolveProductName ? window.resolveProductName(item.productName, item.productId) : (item.productName || `Timepiece #${item.productId}`);
                    const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
                    pdfItemsRows += `
                        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #E5E7EB;">
                            <td style="padding: 10px 12px; color: #111827;">
                                <div style="font-weight: 700; font-size: 13px;">${resolvedName}</div>
                                <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Item Ref: #TV-${item.productId}</div>
                            </td>
                            <td style="padding: 10px 12px; text-align: center; color: #111827; font-weight: 600; font-size: 13px;">${qty}</td>
                            <td style="padding: 10px 12px; text-align: right; color: #4B5563; font-size: 13px;">${formatCurrency(price)}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #1F3A5F; font-size: 13px;">${formatCurrency(lineTotal)}</td>
                        </tr>
                    `;
                });
            } else {
                pdfItemsRows = `
                    <tr>
                        <td colspan="4" style="padding: 14px; text-align: center; color: #6B7280;">Timepiece Order Details</td>
                    </tr>
                `;
            }
            let couponDiscountPdfRow = '';
            if (discountAmount > 0) {
                couponDiscountPdfRow = `
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #059669; font-weight: 600;">
                        <span>Promo Privilege (${order.couponCode || 'TIMEVERSE10'})</span>
                        <span>-${formatCurrency(discountAmount)}</span>
                    </div>
                `;
            }
            // Create A4 Invoice HTML container
            const invoiceWrapper = document.createElement('div');
            invoiceWrapper.style.position = 'fixed';
            invoiceWrapper.style.left = '-9999px';
            invoiceWrapper.style.top = '0';
            invoiceWrapper.style.width = '720px';
            invoiceWrapper.style.zIndex = '-1000';
            invoiceWrapper.innerHTML = `
                <div style="background: #FFFFFF; color: #1F2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px 40px; box-sizing: border-box; font-size: 13px; line-height: 1.5;">
                    <!-- Top Brand Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C5A059; padding-bottom: 16px; margin-bottom: 22px;">
                        <div>
                            <div style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #1F3A5F;">TIMEVERSE</div>
                            <div style="font-size: 11px; letter-spacing: 1px; color: #C5A059; text-transform: uppercase; font-weight: 700; margin-top: 2px;">Premium Timepieces</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: 800; color: #1F3A5F; letter-spacing: 1px;">INVOICE</div>
                            <div style="font-size: 12px; color: #4B5563; margin-top: 4px;"><strong>Invoice No:</strong> ${invoiceNo}</div>
                            <div style="font-size: 12px; color: #4B5563;"><strong>Order No:</strong> TV-ORD-${order.orderId}</div>
                            <div style="font-size: 12px; color: #4B5563;"><strong>Invoice Date:</strong> ${formattedCreatedDate}</div>
                        </div>
                    </div>
                    <!-- Bill To Section -->
                    <div style="margin-bottom: 20px; padding: 14px 18px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #C5A059; margin-bottom: 6px;">BILL TO</div>
                        <div style="font-weight: 700; color: #111827; font-size: 14px;">${customerName}</div>
                        <div style="color: #4B5563; font-size: 12px; margin-top: 2px;">${customerEmail}</div>
                        ${customerPhone ? `<div style="color: #6B7280; font-size: 12px; margin-top: 2px;">Phone: ${customerPhone}</div>` : ''}
                        ${shippingAddressText ? `<div style="color: #4B5563; font-size: 12px; margin-top: 4px; border-top: 1px solid #E5E7EB; padding-top: 4px;"><strong>Shipping Address:</strong> ${shippingAddressText}</div>` : ''}
                    </div>
                    <!-- Ordered Products Section -->
                    <div style="margin-bottom: 22px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1F3A5F; margin-bottom: 8px;">ORDERED PRODUCTS</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background-color: #1F3A5F; color: #FFFFFF; text-align: left;">
                                    <th style="padding: 10px 12px; font-weight: 600;">Product</th>
                                    <th style="padding: 10px 12px; font-weight: 600; text-align: center; width: 60px;">Qty</th>
                                    <th style="padding: 10px 12px; font-weight: 600; text-align: right; width: 110px;">Price</th>
                                    <th style="padding: 10px 12px; font-weight: 600; text-align: right; width: 120px;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pdfItemsRows}
                            </tbody>
                        </table>
                    </div>
                    <!-- Price Breakdown & Status Section -->
                    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 22px;">
                        <!-- Order Status & Payment -->
                        <div style="flex: 1; padding: 14px 16px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1F3A5F; margin-bottom: 8px;">ORDER & PAYMENT DETAILS</div>
                            <div style="font-size: 12px; color: #4B5563; margin-bottom: 5px;"><strong>Order Status:</strong> <span style="color: #111827; font-weight: 600;">${statusUpper}</span></div>
                            <div style="font-size: 12px; color: #4B5563; margin-bottom: 5px;"><strong>Payment Method:</strong> ${paymentMethodText}</div>
                            <div style="font-size: 12px; color: #4B5563;"><strong>Payment Gateway:</strong> Razorpay</div>
                        </div>
                        <!-- Price Breakdown -->
                        <div style="flex: 1; padding: 14px 16px; background-color: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1F3A5F; margin-bottom: 8px;">PRICE BREAKDOWN</div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #4B5563;">
                                <span>Bag Subtotal</span>
                                <span style="font-weight: 600; color: #111827;">${formatCurrency(rawSubtotal)}</span>
                            </div>
                            ${couponDiscountPdfRow}
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #4B5563;">
                                <span>GST / Luxury Duties (Included)</span>
                                <span style="color: #111827;">₹0.00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: #4B5563;">
                                <span>Insured Shipping</span>
                                <span style="color: #059669; font-weight: 600;">Complimentary</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px solid #D1D5DB; padding-top: 6px; color: #1F3A5F;">
                                <span>GRAND TOTAL PAID</span>
                                <span>${formatCurrency(totalPaid)}</span>
                            </div>
                        </div>
                    </div>
                    <!-- TimeVerse Authenticity Card -->
                    <div style="padding: 12px 16px; background-color: #FFFFFF; border: 1px solid #C5A059; border-radius: 6px; margin-bottom: 22px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #C5A059; margin-bottom: 4px;">TIMEVERSE AUTHENTICITY</div>
                        <div style="font-size: 11px; color: #1F3A5F; font-weight: 600;">
                            Authentic Timepiece • 2-Year International Warranty • Warranty Certificate • Insured Delivery
                        </div>
                    </div>
                    <!-- Footer -->
                    <div style="border-top: 1px solid #E5E7EB; padding-top: 14px; text-align: center; color: #6B7280; font-size: 11px;">
                        <div style="font-weight: 700; color: #1F3A5F; margin-bottom: 2px;">Thank you for shopping with TimeVerse.</div>
                        <div>For customer concierge or warranty support, contact support@timeverse.com</div>
                    </div>
                </div>
            `;
            document.body.appendChild(invoiceWrapper);
            if (window.html2pdf) {
                const opt = {
                    margin: [8, 8, 8, 8],
                    filename: fileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                await window.html2pdf().set(opt).from(invoiceWrapper.firstElementChild).save();
            } else {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${fileName}</title>
                            <style>
                                @page { size: A4 portrait; margin: 8mm; }
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #fff; }
                            </style>
                        </head>
                        <body>
                            ${invoiceWrapper.innerHTML}
                            <script>
                                window.onload = function() { window.print(); };
                            <\/script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
            invoiceWrapper.remove();
        } catch (err) {
            console.error('Invoice PDF generation failed:', err);
            if (statusMsg) {
                statusMsg.style.display = 'inline-block';
                statusMsg.style.color = '#DC2626';
                statusMsg.textContent = 'Could not generate invoice. Please try again.';
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download Invoice PDF</span>
                `;
            }
        }
    }
    document.addEventListener('DOMContentLoaded', loadOrderDetails);
})();
