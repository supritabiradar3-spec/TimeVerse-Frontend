// Orders Page Module for TimeVerse

(function () {
    // Check authentication
    if (!localStorage.getItem('token')) return;

    document.addEventListener('DOMContentLoaded', function () {
        const customerBanner = document.getElementById('order-customer-banner');
        if (customerBanner) {
            const username = localStorage.getItem('username');
            const role = localStorage.getItem('role') || 'CUSTOMER';
            const fullName = localStorage.getItem('fullName') || username || 'Collector';
            customerBanner.innerHTML = `Welcome back, <strong style="color: var(--white);">${fullName}</strong> &nbsp;|&nbsp; Status: <span class="badge badge-gold" style="font-size: 0.75rem; text-transform: uppercase;">${role}</span>`;
        }
    });

    // Load orders list
    async function loadOrders() {
        const ordersContainer = document.getElementById('orders-list-container');
        if (!ordersContainer) return;

        const userId = auth.getUserId();
        if (!userId) {
            ordersContainer.innerHTML = `<p style="color: var(--error); text-align: center;">Unable to identify user session. Please log out and login again.</p>`;
            return;
        }

        try {
            // Cache products map for images lookup
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
                console.warn("Could not load products for images cache", pErr);
            }

            const response = await api.getUserOrders(userId);

            const visibleOrders = (response || []).filter(order => {
                if (!order || !order.status) return false;
                const s = String(order.status).toUpperCase().trim();
                return s !== 'PLACED' && s !== 'PENDING' && s !== 'CREATED';
            });

            if (visibleOrders.length === 0) {
                renderEmptyOrders(ordersContainer);
                return;
            }

            // Sort orders: newest first
            visibleOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let ordersHTML = '';
            visibleOrders.forEach(order => {
                const orderDate = new Date(order.createdAt);
                const formattedDate = orderDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Estimated delivery is order date + 4 days
                const deliveryDate = new Date(orderDate);
                deliveryDate.setDate(orderDate.getDate() + 4);
                const formattedDelivery = deliveryDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const formattedTotal = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(order.totalAmount);

                const statusClass = getStatusBadgeClass(order.status);

                let paymentStatusText = "UNPAID";
                let paymentStatusClass = "badge-danger";

                const orderStatusUpper = order.status ? order.status.toUpperCase() : "PLACED";
                if (orderStatusUpper !== "PLACED" && orderStatusUpper !== "CANCELLED") {
                    paymentStatusText = "PAID";
                    paymentStatusClass = "badge-success";
                } else if (orderStatusUpper === "CANCELLED") {
                    if (order.refundStatus && order.refundStatus.toUpperCase() === "REFUNDED") {
                        paymentStatusText = "REFUNDED";
                        paymentStatusClass = "badge-gold";
                    } else {
                        paymentStatusText = "UNPAID";
                        paymentStatusClass = "badge-danger";
                    }
                }

                // Build items list with images
                let itemsHTML = '';
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        const itemPrice = new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                        }).format(item.price);
                        
                        const fallbackImg = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=150';
                        const imgSrc = productMap[item.productId] || fallbackImg;
                        
                        itemsHTML += `
                            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding: 12px 0; font-size: 0.95rem;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <img src="${imgSrc}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: contain; background: #151515; border: var(--border); padding: 2px;" onerror="this.src='${fallbackImg}'">
                                    <div>
                                        <span style="color: var(--white); font-weight: 500;">${item.productName || ('Product ID: ' + item.productId)}</span>
                                        <div style="font-size: 0.8rem; color: var(--gold); margin-top: 2px;">Qty: ${item.quantity}</div>
                                    </div>
                                </div>
                                <span style="color: var(--light-gray);">${itemPrice}</span>
                            </div>
                        `;
                    });
                } else {
                    itemsHTML = `<p style="color: var(--light-gray); font-style: italic;">No items found in this order.</p>`;
                }

                // Generate timeline
                const steps = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
                let currentStatus = order.status ? order.status.toUpperCase() : "PLACED";
                if (currentStatus === "PENDING" || currentStatus === "CREATED") currentStatus = "PLACED";
                if (currentStatus === "OUT FOR DELIVERY") currentStatus = "OUT_FOR_DELIVERY";

                let timelineHTML = '';
                if (currentStatus === 'CANCELLED') {
                    timelineHTML = `
                        <div style="padding: 15px; background: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.2); color: var(--error); text-align: center; border-radius: 6px; font-weight: 500; letter-spacing: 0.5px; margin-top: 15px; margin-bottom: 15px;">
                            This order has been CANCELLED. No tracking progress is available.
                        </div>
                    `;
                } else {
                    const currentIndex = steps.indexOf(currentStatus);
                    timelineHTML = '<div class="order-timeline" style="display: flex; align-items: center; justify-content: space-between; margin-top: 25px; overflow-x: auto; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03);">';
                    steps.forEach((step, idx) => {
                        let color = "var(--light-gray)"; // Gray
                        if (idx < currentIndex) {
                            color = "var(--success)"; // Green
                        } else if (idx === currentIndex) {
                            color = "var(--gold)"; // Gold
                        } else if (currentStatus === "DELIVERED") {
                            color = "var(--success)"; // If delivered, all are green
                        }
                        
                        const stepLabel = step.replace('_', ' ');
                        timelineHTML += `
                            <div class="timeline-step" style="display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; min-width: 90px;">
                                <div class="step-icon" style="width: 26px; height: 26px; border-radius: 50%; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; color: ${color}; font-weight: bold; font-size: 0.75rem; margin-bottom: 8px; background: rgba(0,0,0,0.5);">
                                    ${idx < currentIndex || currentStatus === "DELIVERED" ? '✔' : idx + 1}
                                </div>
                                <span style="font-size: 0.7rem; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">${stepLabel}</span>
                            </div>
                        `;
                        
                        if (idx < steps.length - 1) {
                            let connectorColor = (idx < currentIndex || currentStatus === "DELIVERED") ? "var(--success)" : "rgba(255,255,255,0.08)";
                            timelineHTML += `
                                <div class="timeline-connector" style="flex-grow: 1; height: 2px; background: ${connectorColor}; margin: 0 5px; margin-bottom: 30px; min-width: 10px;"></div>
                            `;
                        }
                    });
                    timelineHTML += '</div>';
                }

                ordersHTML += `
                    <div class="glass-card order-card-item" style="margin-bottom: 30px; padding: 25px; border-radius: 12px; box-shadow: var(--border-glow); transition: all 0.3s ease; border: 1px solid rgba(212, 175, 55, 0.25);" onmouseover="this.style.borderColor='var(--gold)';" onmouseout="this.style.borderColor='rgba(212, 175, 55, 0.25)';">
                        <div class="flex-between" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 15px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <span style="font-size: 0.8rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px;">Order Reference</span>
                                <h3 style="font-size: 1.15rem; color: var(--white); margin-top: 3px;">#TV-ORD-${order.orderId}</h3>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 0.8rem; color: var(--light-gray); display: block;">Ordered On</span>
                                <span style="font-size: 0.9rem; color: var(--white);">${formattedDate}</span>
                            </div>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <span style="font-size: 0.8rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Purchased Items</span>
                            ${itemsHTML}
                        </div>

                        <!-- Tracking Timeline -->
                        <div style="margin-bottom: 25px;">
                            <span style="font-size: 0.8rem; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; display: block;">Tracking Timeline</span>
                            ${timelineHTML}
                        </div>

                        <div class="flex-between" style="flex-wrap: wrap; gap: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 18px;">
                            <div>
                                <span style="font-size: 0.85rem; color: var(--light-gray); margin-right: 5px;">Payment:</span>
                                <span class="badge ${paymentStatusClass}">${paymentStatusText}</span>
                                <span style="font-size: 0.85rem; color: var(--light-gray); margin-left: 15px; margin-right: 5px;">Est. Delivery:</span>
                                <span style="font-size: 0.9rem; color: var(--white); font-weight: 500;">${formattedDelivery}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 18px;">
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span style="font-size: 0.85rem; color: var(--light-gray);">Total:</span>
                                    <span style="font-size: 1.3rem; color: var(--gold-light); font-weight: 600;">${formattedTotal}</span>
                                </div>
                                <a href="./order-details.html?orderId=${order.orderId}" class="btn-luxury" style="padding: 7px 15px; font-size: 0.75rem; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                                    View Details & Tracking &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });

            ordersContainer.innerHTML = ordersHTML;
        } catch (err) {
            console.error('Failed to load user orders:', err);
            ordersContainer.innerHTML = `<p style="color: var(--error); text-align: center; padding: 40px 0;">Error loading order logs. Please try again later.</p>`;
        }
    }

    // Render empty layout
    function renderEmptyOrders(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; border: var(--border); background-color: var(--dark-gray);">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="var(--gold)" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                  <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
                <h3 class="luxury-text" style="font-size: 1.5rem; margin-bottom: 15px; color: var(--gold);">No Orders Placed Yet</h3>
                <p style="color: var(--light-gray); margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">You haven't ordered any watches yet. Browse the catalog to start your premium watch collection.</p>
                <a href="./products.html" class="btn-luxury btn-luxury-solid">Explore Watches</a>
            </div>
        `;
    }

    // Helper: get status badge css
    function getStatusBadgeClass(status) {
        if (!status) return 'badge-gold';
        const s = status.toUpperCase();
        if (s === 'PLACED' || s === 'PENDING' || s === 'CREATED') return 'badge-gold';
        if (s === 'CONFIRMED' || s === 'SHIPPED' || s === 'OUT FOR DELIVERY' || s === 'DELIVERED' || s === 'SUCCESS' || s === 'PAID' || s === 'COMPLETED') return 'badge-success';
        return 'badge-danger'; // cancelled, failed, refunded
    }

    // Initialize orders loading on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('orders-list-container')) {
            loadOrders();
        }
    });
})();
