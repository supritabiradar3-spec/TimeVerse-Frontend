// Admin Dashboard Module for TimeVerse

(function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = (payload.role || '').toUpperCase().replace(/^ROLE_/, '');
        if (role !== "ADMIN") {
            window.location.href = "../index.html";
            return;
        }
    } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    const CATEGORY_MAP = {
        1: 'Analog Watches',
        2: 'Digital Watches',
        3: 'Luxury Watches',
        4: 'Sports Watches'
    };

    const CATEGORY_IMAGES = {
        1: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=400',
        2: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=400',
        3: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400',
        4: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=400'
    };

    let allCachedProducts = [];
    let allCachedOrders = [];
    let allCachedUsers = [];
    let allCachedCategories = [];

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(value || 0));
    }

    function setAdminWelcomeName() {
        const adminName = localStorage.getItem('username') || 'Administrator';
        const usernameEl = document.getElementById('admin-display-name');
        if (usernameEl) usernameEl.textContent = adminName;
    }

    function buildCategoryNameMap(categories) {
        return (categories || []).reduce((map, category) => {
            map[category.categoryId] = category.categoryName || category.name || CATEGORY_MAP[category.categoryId] || 'Collection';
            return map;
        }, {});
    }

    function getInventoryStatus(stock) {
        const value = Number(stock || 0);
        if (value === 0) return { label: 'Out of Stock', className: 'status-out' };
        if (value < 5) return { label: 'Low Stock', className: 'status-low' };
        return { label: 'In Stock', className: 'status-in' };
    }

    function renderMiniBars(canvasId, values, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const max = Math.max(...values, 1);
        const width = canvas.width = canvas.clientWidth || 400;
        const height = canvas.height = 180;

        ctx.clearRect(0, 0, width, height);

        const gap = 16;
        const barWidth = (width - gap * (values.length + 1)) / values.length;

        values.forEach((value, index) => {
            const barHeight = (value / max) * (height - 40);
            const x = gap + index * (barWidth + gap);
            const y = height - barHeight - 20;

            ctx.fillStyle = colors[index % colors.length];
            const radius = Math.min(6, barWidth / 2);
            ctx.beginPath();
            ctx.moveTo(x, height - 20);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, height - 20);
            ctx.closePath();
            ctx.fill();

            // Label value on top of bar
            ctx.fillStyle = '#000000';
            ctx.font = '600 11px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 6);
        });
    }

    function renderLineChart(canvasId, labels, values, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth || 440;
        const height = canvas.height = 190;
        const paddingLeftRight = 32;
        const paddingTop = 20;
        const paddingBottom = 30;

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = paddingTop + ((height - paddingTop - paddingBottom) / 4) * i;
            ctx.beginPath();
            ctx.moveTo(paddingLeftRight, y);
            ctx.lineTo(width - paddingLeftRight, y);
            ctx.stroke();
        }

        if (!values.length) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }

        const max = Math.max(...values, 1);
        const stepX = (width - paddingLeftRight * 2) / Math.max(values.length - 1, 1);

        ctx.beginPath();
        values.forEach((value, index) => {
            const x = paddingLeftRight + index * stepX;
            const y = height - paddingBottom - (value / max) * (height - paddingTop - paddingBottom);
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        values.forEach((value, index) => {
            const x = paddingLeftRight + index * stepX;
            const y = height - paddingBottom - (value / max) * (height - paddingTop - paddingBottom);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.font = '500 10px Outfit';
            ctx.textAlign = 'center';
            if (value > 0) {
                ctx.fillText(value >= 1000 ? `${(value/1000).toFixed(1)}k` : value, x, y - 8);
            }
        });

        if (labels && labels.length) {
            ctx.fillStyle = '#6B6A67';
            ctx.font = '500 11px Outfit';
            ctx.textAlign = 'center';
            labels.forEach((label, index) => {
                const x = paddingLeftRight + index * stepX;
                ctx.fillText(label, x, height - 10);
            });
        }
    }

    function renderDoughnutChart(canvasId, values, colors, labels) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const total = values.reduce((sum, val) => sum + val, 0) || 1;
        const width = canvas.width = canvas.clientWidth || 220;
        const height = canvas.height = 180;
        const cx = width / 2;
        const cy = height / 2;
        const radius = 60;
        let start = -Math.PI / 2;

        ctx.clearRect(0, 0, width, height);
        values.forEach((value, index) => {
            const slice = (value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, start + slice);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            start += slice;
        });

        ctx.beginPath();
        ctx.arc(cx, cy, 33, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '600 14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`${values[0] || 0}`, cx, cy + 5);

        const legend = document.getElementById(`${canvasId}-legend`);
        if (legend) {
            const items = labels.map((label, index) => `
                <div class="chart-legend-item">
                    <span class="legend-swatch" style="background:${colors[index]}"></span>
                    <span>${label}</span>
                </div>
            `).join('');
            legend.innerHTML = items;
        }
    }

    function renderDashboardCharts(products, orders, categories) {
        const categoryMap = buildCategoryNameMap(categories);
        
        // Filter out cancelled orders from all dashboard charts and graphs
        const activeOrders = orders.filter(order => !order.status || order.status.toUpperCase() !== 'CANCELLED');

        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return { key, label: date.toLocaleDateString('en-IN', { month: 'short' }), amount: 0, count: 0 };
        });

        activeOrders.forEach(order => {
            const created = new Date(order.createdAt || Date.now());
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            const monthEntry = monthlyRevenue.find(entry => entry.key === key);
            if (monthEntry) {
                monthEntry.amount += Number(order.totalAmount || 0);
                monthEntry.count += 1;
            }
        });

        renderLineChart('revenueTrendChart', monthlyRevenue.map(item => item.label), monthlyRevenue.map(item => item.amount), '#c5a059');
        renderLineChart('ordersTrendChart', monthlyRevenue.map(item => item.label), monthlyRevenue.map(item => item.count), '#7dd3fc');

        const categoryTotals = {};
        activeOrders.forEach(order => {
            if (!order.items) return;
            order.items.forEach(item => {
                const product = products.find(product => product.productId === item.productId) || null;
                const categoryId = product ? product.categoryId : null;
                const categoryName = categoryId ? (categoryMap[categoryId] || CATEGORY_MAP[categoryId] || 'Other') : 'Other';
                categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (Number(item.price || 0) * Number(item.quantity || 1));
            });
        });

        const salesLabels = Object.keys(categoryTotals).slice(0, 4);
        const salesValues = salesLabels.map(label => categoryTotals[label]);
        renderDoughnutChart('categorySalesChart', salesValues.length ? salesValues : [1], ['#c5a059', '#7dd3fc', '#34d399', '#f59e0b'], salesLabels.length ? salesLabels : ['No sales']);

        const stockCounts = { in: 0, low: 0, out: 0 };
        products.forEach(product => {
            const stock = Number(product.stock || 0);
            if (stock === 0) stockCounts.out += 1;
            else if (stock < 5) stockCounts.low += 1;
            else stockCounts.in += 1;
        });
        renderDoughnutChart('inventoryChart', [stockCounts.in, stockCounts.low, stockCounts.out], ['#34d399', '#f59e0b', '#ef4444'], ['In Stock', 'Low Stock', 'Out of Stock']);

        const productSales = {};
        activeOrders.forEach(order => {
            if (!order.items) return;
            order.items.forEach(item => {
                const name = item.productName || `Product #${item.productId}`;
                productSales[name] = (productSales[name] || 0) + Number(item.quantity || 0);
            });
        });

        const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topProductLabels = topProducts.map(([name]) => name.length > 16 ? `${name.slice(0, 16)}…` : name);
        const topProductValues = topProducts.map(([, qty]) => qty);
        renderMiniBars('topProductsChart', topProductValues.length ? topProductValues : [1], ['#c5a059', '#e8d7b3', '#7dd3fc', '#34d399', '#f59e0b']);
        const topProductsList = document.getElementById('topProductsList');
        if (topProductsList) {
            topProductsList.innerHTML = topProducts.length ? topProducts.map(([name, qty]) => `
                <div class="top-product-row">
                    <span>${name}</span>
                    <strong>${qty} sold</strong>
                </div>
            `).join('') : '<div class="empty-state">No sales data yet.</div>';
        }
    }

    function populateInventoryTable(products, categories) {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        const categoryMap = buildCategoryNameMap(categories);

        if (!products.length) {
            tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No products available.</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(product => {
            const status = getInventoryStatus(product.stock);
            const imageUrl = (product.images && product.images[0] && product.images[0].imageUrl) ||
                (product.imageUrls && product.imageUrls[0]) ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80';
            const resolvedImg = window.resolveImageUrl ? window.resolveImageUrl(imageUrl) : imageUrl;
            const categoryName = categoryMap[product.categoryId] || CATEGORY_MAP[product.categoryId] || 'Collection';
            return `
                <tr>
                    <td><img src="${resolvedImg}" class="inventory-product-image" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80'" /></td>
                    <td><strong>${product.name}</strong><div class="muted-text">#${product.productId}</div></td>
                    <td>${product.sku || product.productId}</td>
                    <td>${categoryName}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${Number(product.stock || 0)}</td>
                    <td><span class="status-badge ${status.className}">${status.label}</span></td>
                </tr>
            `;
        }).join('');
    }

    async function loadDashboard() {
        try {
            allCachedProducts = await api.getAllProducts();
            allCachedOrders = await api.getAllOrders();
            const categoriesRes = await api.getCategories();
            allCachedCategories = categoriesRes.data || categoriesRes || [];
            const usersRes = await api.getAllUsers();
            allCachedUsers = usersRes.data || [];

            const customerIds = new Set(allCachedUsers.filter(u => u && (u.role || '').toUpperCase() === 'CUSTOMER').map(u => u.userId));
            const customerOrders = allCachedOrders.filter(order => order && order.userId && customerIds.has(order.userId));
            const customers = allCachedUsers.filter(user => user && (user.role || '').toUpperCase() === 'CUSTOMER');

            // Apply status filter for active revenue-generating orders
            const revenueOrders = customerOrders.filter(order => !order.status || order.status.toUpperCase() !== 'CANCELLED');

            const revenueSum = revenueOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
            const lowStock = allCachedProducts.filter(product => Number(product.stock || 0) < 5).length;
            const inventoryValue = allCachedProducts.reduce((sum, product) => sum + (Number(product.price || 0) * Number(product.stock || 0)), 0);

            document.getElementById('total-products').innerText = allCachedProducts.length;
            document.getElementById('total-categories-metric').innerText = allCachedCategories.length;
            document.getElementById('total-orders').innerText = revenueOrders.length;
            document.getElementById('total-users').innerText = customers.length;
            document.getElementById('total-revenue').innerText = formatCurrency(revenueSum);
            document.getElementById('low-stock').innerText = lowStock;
            
            const inventoryValueEl = document.getElementById('inventory-value');
            if (inventoryValueEl) inventoryValueEl.innerText = formatCurrency(inventoryValue);

            // Populate Business Analytics fields in analytics-section
            const analyticsRevenue = document.getElementById('analytics-revenue');
            if (analyticsRevenue) analyticsRevenue.innerText = formatCurrency(revenueSum);

            const analyticsOrders = document.getElementById('analytics-orders');
            if (analyticsOrders) analyticsOrders.innerText = revenueOrders.length;

            const analyticsAov = document.getElementById('analytics-aov');
            if (analyticsAov) {
                const aov = revenueOrders.length > 0 ? (revenueSum / revenueOrders.length) : 0;
                analyticsAov.innerText = formatCurrency(aov);
            }

            const analyticsLowStock = document.getElementById('analytics-low-stock');
            if (analyticsLowStock) analyticsLowStock.innerText = lowStock;

            const avgRatingCard = document.getElementById('avg-rating-card');
            if (avgRatingCard) avgRatingCard.style.display = 'none';

            populateInventoryTable(allCachedProducts, allCachedCategories);
            renderDashboardCharts(allCachedProducts, customerOrders, allCachedCategories);
            setAdminWelcomeName();
        } catch (e) {
            console.error('Dashboard stats error:', e);
        }
    }

    async function loadAdminCategories() {
        const tbody = document.getElementById('admin-categories-tbody');
        if (!tbody) return;

        try {
            const categoriesRes = await api.getCategories();
            allCachedCategories = categoriesRes.data || categoriesRes || [];
            
            if (allCachedCategories.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--light-gray);">No categories found.</td></tr>`;
                return;
            }

            let html = '';
            allCachedCategories.forEach(cat => {
                const name = cat.categoryName || cat.name || 'Collection';
                html += `
                    <tr>
                        <td><strong>#${cat.categoryId}</strong></td>
                        <td><span style="color: var(--white); font-weight: 500;">${name}</span></td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-luxury edit-category-btn" 
                                        data-id="${cat.categoryId}" 
                                        data-name="${name}"
                                        style="padding: 5px 10px; font-size: 0.75rem;">
                                    Edit
                                </button>
                                <button class="btn-luxury delete-category-btn" data-id="${cat.categoryId}" style="padding: 5px 10px; font-size: 0.75rem; color: var(--error); border-color: rgba(220,53,69,0.3);">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            // Bind Category Actions
            tbody.querySelectorAll('.edit-category-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    const name = this.getAttribute('data-name');

                    document.getElementById('edit-category-id').value = id;
                    document.getElementById('edit-category-id-display').value = id;
                    document.getElementById('edit-category-name').value = name;

                    document.getElementById('edit-category-modal').style.display = 'flex';
                });
            });

            tbody.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', async function () {
                    const catId = this.getAttribute('data-id');
                    if (confirm(`Are you sure you want to delete Category #${catId}?`)) {
                        try {
                            await api.deleteCategory(catId);
                            showAlert(`Category #${catId} deleted successfully.`, 'success');
                            loadAdminCategories();
                            loadDashboard();
                        } catch (err) {
                            showAlert(`Failed to delete category: ${err.message}`, 'error');
                        }
                    }
                });
            });

        } catch (e) {
            console.error(e);
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--error);">Failed to load categories.</td></tr>`;
        }
    }

    async function loadAdminProducts() {
        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;

        try {
            allCachedProducts = await api.getAllProducts();
            const categoriesRes = await api.getCategories();
            allCachedCategories = categoriesRes.data || categoriesRes || [];

            // Build dynamic Category Map
            const dynamicCategoryMap = {};
            allCachedCategories.forEach(cat => {
                dynamicCategoryMap[cat.categoryId] = cat.categoryName || cat.name;
            });

            if (!allCachedProducts || allCachedProducts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--light-gray);">No timepieces available. Add one.</td></tr>`;
                return;
            }

            let html = '';
            allCachedProducts.forEach(prod => {
                const categoryName = dynamicCategoryMap[prod.categoryId] || CATEGORY_MAP[prod.categoryId] || 'Collection';
                const formattedPrice = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(prod.price);

                let imgUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80';
                if (prod.images && prod.images.length > 0) {
                    imgUrl = prod.images[0].imageUrl;
                } else if (prod.imageUrls && prod.imageUrls.length > 0) {
                    imgUrl = prod.imageUrls[0];
                }
                const resolvedImg = window.resolveImageUrl ? window.resolveImageUrl(imgUrl) : imgUrl;

                // Deterministic Rating stars
                const rating = window.getProductRating ? window.getProductRating(prod.productId) : { score: "4.8" };
                const stars = window.getStarsHtml ? window.getStarsHtml(rating.score) : "★★★★★";

                html += `
                    <tr>
                        <td><strong>#${prod.productId}</strong></td>
                        <td>
                            <img src="${resolvedImg}" alt="${prod.name}" style="width: 50px; height: 50px; object-fit: contain; background: #151515; border: var(--border); padding: 2px;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80'">
                        </td>
                        <td><span style="color: var(--white); font-weight: 500;">${prod.name}</span></td>
                        <td>${categoryName}</td>
                        <td><span style="color: var(--gold-light); font-weight: 600;">${formattedPrice}</span></td>
                        <td>
                            <span style="color: ${prod.stock < 5 ? 'var(--error)' : 'var(--success)'}; font-weight: 500;">
                                ${prod.stock} Qty
                            </span>
                        </td>
                        <td><div class="product-card-rating">${stars}</div></td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-luxury edit-product-btn" 
                                        onclick="editProduct(${prod.productId})"
                                        style="padding: 5px 10px; font-size: 0.75rem;">
                                    Edit
                                </button>
                                <button class="btn-luxury delete-product-btn" data-id="${prod.productId}" style="padding: 5px 10px; font-size: 0.75rem; color: var(--error); border-color: rgba(220,53,69,0.3);">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            // Bind actions
            bindProductActionListeners();
        } catch (err) {
            console.error('Failed to load admin products:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--error); padding: 30px;">Error loading products list.</td></tr>`;
        }
    }

    async function loadAdminOrders() {
        const tbody = document.getElementById('admin-orders-tbody');
        if (!tbody) return;

        try {
            allCachedOrders = await api.getAllOrders();
            const usersRes = await api.getAllUsers();
            allCachedUsers = usersRes.data || [];

            // Filter dashboard orders so only orders belonging to current CUSTOMER user IDs are included safely
            const customerIds = new Set(allCachedUsers.filter(u => u && (u.role || '').toUpperCase() === 'CUSTOMER').map(u => u.userId));
            const customerOrders = allCachedOrders.filter(o => o && o.userId && customerIds.has(o.userId));

            if (customerOrders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--light-gray);">No customer orders placed yet.</td></tr>`;
                return;
            }

            ordersSort(customerOrders);

            let html = '';
            customerOrders.forEach(order => {
                const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                const formattedTotal = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(order.totalAmount);

                let itemsList = '';
                if (order.items && order.items.length > 0) {
                    itemsList = order.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                } else {
                    itemsList = 'No items';
                }

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

                html += `
                    <tr data-id="${order.orderId}">
                        <td><strong>#TV-ORD-${order.orderId}</strong></td>
                        <td>User #${order.userId}</td>
                        <td title="${itemsList}"><span class="table-items-cell" style="max-width: 180px;">${itemsList}</span></td>
                        <td><span style="color: var(--gold-light); font-weight: 600;">${formattedTotal}</span></td>
                        <td><span style="font-size: 0.85rem; color: var(--light-gray);">${date}</span></td>
                        <td><span class="badge ${paymentStatusClass}">${paymentStatusText}</span></td>
                        <td>
                            <select class="form-control admin-status-select" data-id="${order.orderId}" style="padding: 4px 8px; font-size: 0.8rem; width: 140px;">
                                <option value="PLACED" ${order.status === 'PLACED' ? 'selected' : ''}>PLACED</option>
                                <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
                                <option value="PACKED" ${order.status === 'PACKED' ? 'selected' : ''}>PACKED</option>
                                <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
                                <option value="OUT_FOR_DELIVERY" ${order.status === 'OUT_FOR_DELIVERY' || order.status === 'OUT FOR DELIVERY' ? 'selected' : ''}>OUT_FOR_DELIVERY</option>
                                <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                                <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn-luxury view-order-details-btn" data-id="${order.orderId}" style="padding: 4px 8px; font-size: 0.75rem;">
                                View
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            // Bind change status listeners
            tbody.querySelectorAll('.admin-status-select').forEach(select => {
                select.addEventListener('change', async function () {
                    const orderId = this.getAttribute('data-id');
                    let newStatus = this.value;
                    try {
                        await api.updateOrderStatus(orderId, newStatus);
                        showAlert(`Order #${orderId} status changed to ${newStatus}.`, 'success');
                        loadAdminOrders();
                    } catch (err) {
                        showAlert(err.message || 'Failed to update order status.', 'error');
                        loadAdminOrders();
                    }
                });
            });

            // Bind view details listeners
            tbody.querySelectorAll('.view-order-details-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const orderId = parseInt(this.getAttribute('data-id'));
                    const order = customerOrders.find(o => o.orderId === orderId);
                    if (order) showOrderDetailsModal(order);
                });
            });

        } catch (err) {
            console.error('Failed to load admin orders:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--error); padding: 30px;">Error loading orders list.</td></tr>`;
        }
    }

    function ordersSort(orders) {
        orders.sort((a, b) => b.orderId - a.orderId);
    }

    function showOrderDetailsModal(order) {
        const modal = document.getElementById('order-details-modal');
        const body = document.getElementById('order-modal-body');
        if (!modal || !body) return;

        const date = new Date(order.createdAt).toLocaleString();
        const total = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(order.totalAmount);
        
        let itemsHtml = '';
        if(order.items) {
            order.items.forEach(it => {
                const sub = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(it.price * it.quantity);
                itemsHtml += `
                    <tr>
                        <td>${it.productName}</td>
                        <td>${it.quantity}</td>
                        <td>${sub}</td>
                    </tr>
                `;
            });
        }

        let paymentStatusText = "UNPAID";

        const orderStatusUpper = order.status ? order.status.toUpperCase() : "PLACED";
        if (orderStatusUpper !== "PLACED" && orderStatusUpper !== "CANCELLED") {
            paymentStatusText = "PAID";
        } else if (orderStatusUpper === "CANCELLED") {
            if (order.refundStatus && order.refundStatus.toUpperCase() === "REFUNDED") {
                paymentStatusText = "REFUNDED";
            } else {
                paymentStatusText = "UNPAID";
            }
        }

        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Customer Details</h5>
                    <div><strong>Collector ID:</strong> #${order.userId}</div>
                    <div><strong>VIP Category:</strong> Premium Privilege</div>
                    <div><strong>Current Status:</strong> <span class="badge badge-gold" style="font-size:0.75rem;">${order.status}</span></div>
                </div>
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Order Context</h5>
                    <div><strong>Order ID:</strong> #TV-ORD-${order.orderId}</div>
                    <div><strong>Payment status:</strong> ${paymentStatusText}</div>
                    <div><strong>Placed Time:</strong> ${date}</div>
                </div>
            </div>

            <h5 style="color:var(--gold); margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">Ordered Products</h5>
            <table class="admin-table" style="margin-bottom: 20px;">
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="2" style="text-align:right; font-weight:bold;">Grand Total:</td>
                        <td style="color:var(--gold-light); font-weight:bold;">${total}</td>
                    </tr>
                </tbody>
            </table>
        `;
        modal.style.display = 'flex';
    }

    async function loadCustomers() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        try {
            const usersRes = await api.getAllUsers();
            allCachedUsers = usersRes.data || [];
            allCachedOrders = await api.getAllOrders();

            const customers = allCachedUsers.filter(u => u.role === 'CUSTOMER');

            if (customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--light-gray);">No customers found.</td></tr>';
                return;
            }

            let html = '';
            customers.forEach(u => {
                const userOrders = allCachedOrders.filter(o => o.userId === u.userId);
                const orderCount = userOrders.length;
                let spendingSum = 0;
                let lastActive = 'N/A';
                if (orderCount > 0) {
                    userOrders.forEach(o => spendingSum += o.totalAmount);
                    const dates = userOrders.map(o => new Date(o.createdAt));
                    const maxDate = new Date(Math.max(...dates));
                    lastActive = maxDate.toLocaleDateString('en-IN');
                }
                const formattedSpending = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(spendingSum);
                const avatarChar = u.username ? u.username.charAt(0).toUpperCase() : 'C';

                html += `
                    <tr>
                        <td><strong>#${u.userId}</strong></td>
                        <td>
                            <div style="width:32px; height:32px; border-radius:50%; background:var(--gold-dark); color:var(--black); font-weight:bold; display:flex; align-items:center; justify-content:center; font-size:0.85rem;">
                                ${avatarChar}
                            </div>
                        </td>
                        <td><span style="color:var(--white); font-weight:500;">${u.username}</span></td>
                        <td>${u.email}</td>
                        <td><span class="badge badge-gold">${u.role}</span></td>
                        <td><span style="color: var(--gold-light); font-weight:600;">${formattedSpending}</span></td>
                        <td><span style="font-size:0.8rem; color:var(--light-gray);">${lastActive}</span></td>
                        <td>
                            <div style="display:flex; gap: 8px;">
                                <button class="btn-luxury view-customer-details-btn" data-id="${u.userId}" style="padding: 4px 8px; font-size: 0.75rem;">
                                    Profile
                                </button>
                                <button class="btn-luxury" onclick="editUser(${u.userId}, '${u.username}', '${u.email}', '${u.role}')" style="padding: 4px 8px; font-size: 0.75rem; color: var(--gold);">
                                    Edit
                                </button>
                                <button class="btn-luxury" onclick="deleteUser(${u.userId})" style="padding: 4px 8px; font-size: 0.75rem; color: var(--error); border-color: rgba(220,53,69,0.3);">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            tbody.querySelectorAll('.view-customer-details-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const customerId = parseInt(this.getAttribute('data-id'));
                    const customer = allCachedUsers.find(u => u.userId === customerId);
                    if (customer) showCustomerProfileModal(customer);
                });
            });

        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--error);">Failed to load customer files.</td></tr>';
        }
    }

    function showCustomerProfileModal(customer) {
        const modal = document.getElementById('customer-profile-modal');
        const body = document.getElementById('customer-modal-body');
        if (!modal || !body) return;

        const userOrders = allCachedOrders.filter(o => o.userId === customer.userId);
        const orderCount = userOrders.length;
        let spendingSum = 0;
        let lastPurchaseDate = 'N/A';
        let purchasedItems = [];
        let favCategory = 'N/A';
        
        const catCounts = {};

        if (orderCount > 0) {
            userOrders.forEach(o => {
                spendingSum += o.totalAmount;
                if (o.items) {
                    o.items.forEach(it => {
                        purchasedItems.push(`${it.productName} (x${it.quantity})`);
                        const pId = it.productId;
                        const product = allCachedProducts.find(p => p.productId === pId);
                        if (product && product.categoryId) {
                            catCounts[product.categoryId] = (catCounts[product.categoryId] || 0) + 1;
                        }
                    });
                }
            });
            
            const dates = userOrders.map(o => new Date(o.createdAt));
            const maxDate = new Date(Math.max(...dates));
            lastPurchaseDate = maxDate.toLocaleDateString('en-IN');
            
            let maxCount = -1;
            let favCatId = -1;
            for (const catId in catCounts) {
                if (catCounts[catId] > maxCount) {
                    maxCount = catCounts[catId];
                    favCatId = parseInt(catId);
                }
            }
            if (favCatId !== -1) {
                favCategory = CATEGORY_MAP[favCatId] || 'Luxury Collection';
            }
        }

        const totalSpending = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(spendingSum);
        const itemsListStr = purchasedItems.length > 0 ? purchasedItems.join(', ') : 'None';

        body.innerHTML = `
            <div style="display:flex; gap: 20px; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--gold); color: var(--black); font-weight: bold; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">
                    ${customer.username ? customer.username.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                    <h4 style="font-family: var(--font-title); font-size: 1.2rem; color: var(--white); margin: 0;">${customer.username}</h4>
                    <span style="font-size:0.8rem; color: var(--gold-light);">${customer.email}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Activity Profile</h5>
                    <div><strong>Total Orders:</strong> ${orderCount} luxury deliveries</div>
                    <div><strong>Accumulated Spendings:</strong> ${totalSpending}</div>
                    <div><strong>Last Purchase Date:</strong> ${lastPurchaseDate}</div>
                </div>
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Concierge History</h5>
                    <div><strong>Favorite Category:</strong> ${favCategory}</div>
                    <div><strong>Products Purchased:</strong> <span style="font-size:0.85rem; color:var(--light-gray);">${itemsListStr}</span></div>
                    <div><strong>Products Reviewed:</strong> 0</div>
                </div>
            </div>

            <h5 style="color:var(--gold); margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">Wishlist & Reviews</h5>
            <div style="color: var(--light-gray); font-size: 0.85rem; line-height: 1.5;">
                No reviews or wishlist bookmarks recorded in database.
            </div>
        `;
        modal.style.display = 'flex';
    }

    function loadAdminReviews() {
        const tbody = document.getElementById('reviews-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--light-gray); padding: 30px;">No reviews recorded in database yet.</td></tr>`;
        document.getElementById('rev-total').innerText = "0";
    }

    function bindProductActionListeners() {
        // Delete Button Click
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const productId = this.getAttribute('data-id');
                if (confirm(`Are you sure you want to delete timepiece #${productId}?`)) {
                    try {
                        await api.deleteProduct(productId);
                        showAlert(`Watch #${productId} deleted successfully.`, 'success');
                        loadAdminProducts();
                        loadDashboard();
                    } catch (err) {
                        showAlert(`Failed to delete watch: ${err.message}`, 'error');
                    }
                }
            });
        });
    }

    function getStatusBadgeClass(status) {
        if (!status) return 'badge-gold';
        const s = status.toUpperCase();
        if (s === 'PLACED' || s === 'PENDING' || s === 'CREATED') return 'badge-gold';
        if (s === 'CONFIRMED' || s === 'PACKED' || s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED' || s === 'SUCCESS' || s === 'PAID') return 'badge-success';
        if (s === 'CANCELLED') return 'badge-danger';
        return 'badge-gold';
    }

    // Initialize DOM handlers
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('admin-orders-tbody')) {
            const pages = [
                "dashboard",
                "categories",
                "products",
                "orders",
                "customers",
                "inventory",
                "analytics",
                "reviews",
                "settings"
            ];

            pages.forEach(page => {
                const btn = document.getElementById(page + "-btn");
                const section = document.getElementById(page + "-section");

                if (!btn || !section) return;

                btn.addEventListener("click", function () {
                    pages.forEach(p => {
                        const b = document.getElementById(p + "-btn");
                        const s = document.getElementById(p + "-section");
                        if (b) b.classList.remove("active");
                        if (s) s.style.display = "none";
                    });

                    btn.classList.add("active");
                    section.style.display = "block";

                    if (page === "dashboard") loadDashboard();
                    if (page === "categories") loadAdminCategories();
                    if (page === "products") loadAdminProducts();
                    if (page === "orders") loadAdminOrders();
                    if (page === "customers") loadCustomers();
                    if (page === "inventory") loadDashboard();
                    if (page === "analytics") loadDashboard();
                    if (page === "reviews") loadAdminReviews();
                    if (page === "settings") loadStoreSettingsForm();
                });
            });

            // Simple hash router for navbar navigation links
            function handleHashChange() {
                const hash = window.location.hash;
                if (!hash || hash === '#') {
                    const btn = document.getElementById('dashboard-btn');
                    if (btn) btn.click();
                    return;
                }

                let page = hash.substring(1).toLowerCase();
                if (page === 'users') {
                    page = 'customers';
                }

                const btn = document.getElementById(page + "-btn");
                if (btn) {
                    btn.click();
                }
            }

            window.addEventListener('hashchange', handleHashChange);
            if (window.location.hash) {
                setTimeout(handleHashChange, 100);
            }

            // Close Modal bindings
            const closeModalBtn = document.getElementById('close-modal-btn');
            const editModal = document.getElementById('edit-product-modal');
            if (closeModalBtn && editModal) {
                closeModalBtn.addEventListener('click', () => {
                    editModal.style.display = "none";
                });
                editModal.addEventListener('click', function (e) {
                    if (e.target === editModal) {
                        editModal.style.display = "none";
                    }
                });
            }

            const closeOrderBtn = document.getElementById('close-order-modal-btn');
            const orderModal = document.getElementById('order-details-modal');
            if(closeOrderBtn && orderModal) {
                closeOrderBtn.addEventListener('click', () => {
                    orderModal.style.display = 'none';
                });
                orderModal.addEventListener('click', function (e) {
                    if (e.target === orderModal) {
                        orderModal.style.display = 'none';
                    }
                });
            }

            const closeCustomerBtn = document.getElementById('close-customer-modal-btn');
            const customerModal = document.getElementById('customer-profile-modal');
            if(closeCustomerBtn && customerModal) {
                closeCustomerBtn.addEventListener('click', () => {
                    customerModal.style.display = 'none';
                });
                customerModal.addEventListener('click', function(e) {
                    if (e.target === customerModal) {
                        customerModal.style.display = 'none';
                    }
                });
            }

            // Category Modals and Form bindings
            const closeCatBtn = document.getElementById('close-category-modal-btn');
            const cancelCatBtn = document.getElementById('cancel-category-edit-btn');
            const catModal = document.getElementById('edit-category-modal');
            
            if (closeCatBtn) {
                closeCatBtn.addEventListener('click', () => { catModal.style.display = 'none'; });
            }
            if (cancelCatBtn) {
                cancelCatBtn.addEventListener('click', () => { catModal.style.display = 'none'; });
            }
            if (catModal) {
                catModal.addEventListener('click', function(e) {
                    if (e.target === catModal) catModal.style.display = 'none';
                });
            }

            const addCategoryForm = document.getElementById('add-category-form');
            if (addCategoryForm) {
                addCategoryForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const name = document.getElementById('add-category-name').value.trim();
                    if (!name) return;
                    try {
                        await api.createCategory({ categoryName: name });
                        showAlert('Category created successfully.', 'success');
                        addCategoryForm.reset();
                        loadAdminCategories();
                        loadDashboard();
                    } catch(err) {
                        showAlert(`Failed to create category: ${err.message}`, 'error');
                    }
                });
            }

            const editCategoryForm = document.getElementById('edit-category-form');
            if (editCategoryForm) {
                editCategoryForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const id = document.getElementById('edit-category-id').value;
                    const name = document.getElementById('edit-category-name').value.trim();
                    try {
                        await api.updateCategory(id, { categoryName: name });
                        showAlert('Category updated successfully.', 'success');
                        catModal.style.display = 'none';
                        loadAdminCategories();
                        loadDashboard();
                    } catch(err) {
                        showAlert(`Failed to update category: ${err.message}`, 'error');
                    }
                });
            }

            // Add Product form submit
            const addProductForm = document.getElementById('add-product-form');
            if (addProductForm) {
                addProductForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const name = document.getElementById('add-name').value.trim();
                    const description = document.getElementById('add-description').value.trim();
                    const price = parseFloat(document.getElementById('add-price').value);
                    const stock = parseInt(document.getElementById('add-stock').value);
                    const categoryId = parseInt(document.getElementById('add-category').value);
                    const imageUrl = document.getElementById('add-image').value.trim();

                    if (!name || isNaN(price) || isNaN(stock) || isNaN(categoryId)) {
                        showAlert('Please fill in all required fields.', 'error');
                        return;
                    }

                    const imageUrls = imageUrl ? [imageUrl] : [];

                    try {
                        await api.createProduct({ name, description, price, stock, categoryId, imageUrls });
                        showAlert('Product created successfully!', 'success');
                        addProductForm.reset();
                        loadAdminProducts();
                        loadDashboard();
                    } catch (err) {
                        showAlert(`Failed to create product. Warning: ${err.message}`, 'error');
                    }
                });
            }

            // Edit Product form submit
            const editProductForm = document.getElementById('edit-product-form');
            if (editProductForm) {
                editProductForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const id = document.getElementById('edit-product-id').value;
                    const name = document.getElementById('edit-name').value.trim();
                    const description = document.getElementById('edit-description').value.trim();
                    const price = parseFloat(document.getElementById('edit-price').value);
                    const stock = parseInt(document.getElementById('edit-stock').value);
                    const categoryId = parseInt(document.getElementById('edit-category').value);
                    const imageUrl = document.getElementById('edit-image').value.trim();

                    if (!name || isNaN(price) || isNaN(stock) || isNaN(categoryId)) {
                        showAlert('Please fill in all required fields.', 'error');
                        return;
                    }

                    const imageUrls = imageUrl ? [imageUrl] : [];

                    try {
                        await api.updateProduct(id, { name, description, price, stock, categoryId, imageUrls });
                        showAlert(`Watch #${id} updated successfully!`, 'success');
                        document.getElementById("edit-product-modal").style.display = "none";
                        loadAdminProducts();
                        loadDashboard();
                    } catch (err) {
                        showAlert(`Failed to update product. Warning: ${err.message}`, 'error');
                    }
                });
            }

            // Bind store settings form submit
            const storeSettingsForm = document.getElementById('store-settings-form');
            if (storeSettingsForm) {
                storeSettingsForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    localStorage.setItem('timeverse_homepage_banner', document.getElementById('setting-homepage-banner').value.trim());
                    localStorage.setItem('timeverse_admin_banner', document.getElementById('setting-admin-banner').value.trim());
                    localStorage.setItem('timeverse_category_img_1', document.getElementById('setting-cat-analog').value.trim());
                    localStorage.setItem('timeverse_category_img_2', document.getElementById('setting-cat-digital').value.trim());
                    localStorage.setItem('timeverse_category_img_3', document.getElementById('setting-cat-luxury').value.trim());
                    localStorage.setItem('timeverse_category_img_4', document.getElementById('setting-cat-sports').value.trim());
                    showAlert('Brand asset settings saved successfully!', 'success');
                    applyAdminBanner();
                });
            }

            applyAdminBanner();
 
            // Default page load
            loadDashboard();
        }
    });

    // Make functions global for inline button calls
    window.editProduct = function(id) {
        const prod = allCachedProducts.find(p => p.productId == id);
        if (!prod) return;

        let imgUrl = '';
        if (prod.images && prod.images.length > 0) {
            imgUrl = prod.images[0].imageUrl;
        } else if (prod.imageUrls && prod.imageUrls.length > 0) {
            imgUrl = prod.imageUrls[0];
        }

        document.getElementById('edit-product-id').value = prod.productId;
        document.getElementById('edit-name').value = prod.name;
        document.getElementById('edit-description').value = prod.description || '';
        document.getElementById('edit-price').value = prod.price;
        document.getElementById('edit-stock').value = prod.stock;
        document.getElementById('edit-category').value = prod.categoryId;
        document.getElementById('edit-image').value = imgUrl;

        document.getElementById('edit-product-modal').style.display = 'flex';
    };

    window.editUser = function(userId, username, email, role) {
        document.getElementById("edit-user-id").value = userId;
        document.getElementById("edit-username").value = username;
        document.getElementById("edit-email").value = email;
        document.getElementById("edit-role").value = role;
        document.getElementById("edit-user-modal").style.display = "flex";
    };

    window.saveUserEdit = async function() {
        const userId = document.getElementById("edit-user-id").value;
        const username = document.getElementById("edit-username").value.trim();
        const email = document.getElementById("edit-email").value.trim();
        const role = document.getElementById("edit-role").value;

        try {
            await api.updateUserProfile(userId, { username, email, role });
            showAlert("User updated successfully", "success");
            window.closeEditModal();
            loadCustomers();
            loadDashboard();
        } catch (error) {
            console.error(error);
            showAlert("Failed to update user record", "error");
        }
    };

    window.closeEditModal = function() {
        document.getElementById("edit-user-modal").style.display = "none";
    };

    window.deleteUser = async function(userId) {
        if (!confirm("Are you sure you want to delete this customer file?")) {
            return;
        }

        try {
            await api.deleteAccount(userId);
            showAlert("Customer deleted successfully", "success");
            loadCustomers();
            loadDashboard();
        } catch (error) {
            console.error(error);
            showAlert("Failed to delete customer record", "error");
        }
    };

    window.loadStoreSettingsForm = function() {
        const targetBanner = 'https://images.unsplash.com/photo-1526045431048-f857369baa09?q=80&w=1920&cb=2';
        localStorage.setItem('timeverse_homepage_banner', targetBanner);
        localStorage.setItem('timeverse_admin_banner', targetBanner);
        
        localStorage.setItem('timeverse_category_img_1', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_2', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_3', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_4', 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=600&cb=2');

        document.getElementById('setting-homepage-banner').value = targetBanner;
        document.getElementById('setting-admin-banner').value = targetBanner;

        document.getElementById('setting-cat-analog').value = 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2';
        document.getElementById('setting-cat-digital').value = 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2';
        document.getElementById('setting-cat-luxury').value = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2';
        document.getElementById('setting-cat-sports').value = 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=600&cb=2';
    };

    window.applyAdminBanner = function() {
        const targetBanner = 'https://images.unsplash.com/photo-1526045431048-f857369baa09?q=80&w=1920&cb=2';
        let savedAdminBanner = localStorage.getItem('timeverse_admin_banner');
        if (savedAdminBanner !== targetBanner) {
            localStorage.setItem('timeverse_admin_banner', targetBanner);
            savedAdminBanner = targetBanner;
        }
        const heroElement = document.querySelector('.dashboard-hero');
        if (heroElement) {
            heroElement.style.backgroundImage = `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,249,246,0.9)), url('${savedAdminBanner}')`;
        }
    };
 
})();
