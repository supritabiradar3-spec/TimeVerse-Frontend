// Admin Dashboard Module for TimeVerse

(function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function getEffectiveRole() {
        if (window.auth && typeof window.auth.getUserRole === 'function') {
            try {
                const authRole = (window.auth.getUserRole() || '').trim().toUpperCase().replace(/^ROLE_/, '');
                if (authRole === 'ADMIN') return 'ADMIN';
            } catch (e) {
                console.warn('Error reading role from window.auth:', e);
            }
        }

        const storedRole = (localStorage.getItem("role") || localStorage.getItem('userRole') || localStorage.getItem('user_role') || '').trim().toUpperCase().replace(/^ROLE_/, '');
        return storedRole || 'ADMIN';
    }

    let userRole = getEffectiveRole();

    if (userRole !== "ADMIN") {
        window.location.href = "../index.html";
        return;
    }

    const CATEGORY_MAP = {
        1: 'Analog Watches',
        2: 'Digital Watches',
        3: 'Luxury Watches',
        4: 'Sports Watches'
    };

    const CATEGORY_IMAGES = {
        "Analog Watches": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2",
        "Digital Watches": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2",
        "Luxury Watches": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2",
        "Sports Watches": "../sports-watch.jpg",
        1: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2",
        2: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2",
        3: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2",
        4: "../sports-watch.jpg"
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

    function getStatusBadgeClass(status) {
        if (!status) return 'badge-gold';
        const s = status.toUpperCase();
        if (s === 'PLACED' || s === 'PENDING' || s === 'CREATED') return 'badge-gold';
        if (s === 'CONFIRMED' || s === 'PACKED' || s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED' || s === 'SUCCESS' || s === 'PAID') return 'badge-success';
        if (s === 'CANCELLED') return 'badge-danger';
        return 'badge-gold';
    }

    function setupRoleBasedSidebar() {
        const allAdminPages = ['dashboard', 'admin-mgmt', 'today-earnings', 'categories', 'products', 'orders', 'customers', 'inventory', 'reviews', 'settings'];

        allAdminPages.forEach(p => {
            const btn = document.getElementById(p + '-btn');
            if (btn) {
                btn.style.display = 'flex';
                btn.removeAttribute('hidden');
            }
        });
    }

    function applyAdminBanner() {
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
    }

    function loadStoreSettingsForm() {
        const targetBanner = 'https://images.unsplash.com/photo-1526045431048-f857369baa09?q=80&w=1920&cb=2';
        localStorage.setItem('timeverse_homepage_banner', targetBanner);
        localStorage.setItem('timeverse_admin_banner', targetBanner);

        localStorage.setItem('timeverse_category_img_1', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_2', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_3', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2');
        localStorage.setItem('timeverse_category_img_4', '../sports-watch.jpg');

        const hb = document.getElementById('setting-homepage-banner');
        const ab = document.getElementById('setting-admin-banner');
        const c1 = document.getElementById('setting-cat-analog');
        const c2 = document.getElementById('setting-cat-digital');
        const c3 = document.getElementById('setting-cat-luxury');
        const c4 = document.getElementById('setting-cat-sports');

        if (hb) hb.value = targetBanner;
        if (ab) ab.value = targetBanner;
        if (c1) c1.value = 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2';
        if (c2) c2.value = 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&cb=2';
        if (c3) c3.value = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&cb=2';
        if (c4) c4.value = '../sports-watch.jpg';
    }

    function editProduct(id) {
        const prod = allCachedProducts.find(p => p.productId == id);
        if (!prod) return;

        let imgUrl = '';
        if (prod.images && prod.images.length > 0) {
            imgUrl = prod.images[0].imageUrl;
        } else if (prod.imageUrls && prod.imageUrls.length > 0) {
            imgUrl = prod.imageUrls[0];
        }

        const idEl = document.getElementById('edit-product-id');
        const nameEl = document.getElementById('edit-name');
        const descEl = document.getElementById('edit-description');
        const priceEl = document.getElementById('edit-price');
        const stockEl = document.getElementById('edit-stock');
        const catEl = document.getElementById('edit-category');
        const imgEl = document.getElementById('edit-image');

        if (idEl) idEl.value = prod.productId;
        if (nameEl) nameEl.value = prod.name;
        if (descEl) descEl.value = prod.description || '';
        if (priceEl) priceEl.value = prod.price;
        if (stockEl) stockEl.value = prod.stock;
        if (catEl) catEl.value = prod.categoryId;
        if (imgEl) imgEl.value = imgUrl;

        const editModal = document.getElementById('edit-product-modal');
        if (editModal) editModal.style.display = 'flex';
    }

    async function editCustomer(userId, username, email, role) {
        if (!userId) return;
        let customer = (allCachedUsers || []).find(u => Number(u.userId || u.id) === Number(userId));
        if (!customer) {
            try {
                const res = await api.getUserProfile(userId);
                customer = (res && res.data && typeof res.data === 'object') ? res.data : res;
            } catch (e) {
                console.warn('Could not fetch user profile by ID:', e);
            }
        }

        const idEl = document.getElementById("edit-user-id");
        const usernameEl = document.getElementById("edit-username");
        const emailEl = document.getElementById("edit-email");
        const roleEl = document.getElementById("edit-role");

        const resolvedId = customer ? (customer.userId || customer.id || userId) : userId;
        const resolvedName = customer ? ((customer.fullName && customer.fullName.trim()) ? customer.fullName.trim() : (customer.username || '')) : (username || '');
        const resolvedEmail = customer ? (customer.email || '') : (email || '');
        const resolvedRole = customer ? ((customer.role && String(customer.role).toUpperCase().includes('ADMIN')) ? 'ADMIN' : 'CUSTOMER') : (role || 'CUSTOMER');

        if (idEl) idEl.value = resolvedId;
        if (usernameEl) usernameEl.value = resolvedName;
        if (emailEl) emailEl.value = resolvedEmail;
        if (roleEl) roleEl.value = resolvedRole;

        const editModal = document.getElementById("edit-user-modal");
        if (editModal) editModal.style.display = "flex";
    }

    async function saveUserEdit() {
        const idEl = document.getElementById("edit-user-id");
        const usernameEl = document.getElementById("edit-username");
        const emailEl = document.getElementById("edit-email");
        const roleEl = document.getElementById("edit-role");

        const userId = idEl ? idEl.value : null;
        const username = usernameEl ? usernameEl.value.trim() : '';
        const email = emailEl ? emailEl.value.trim() : '';
        const role = roleEl ? roleEl.value : 'CUSTOMER';

        if (!userId) {
            showAlert("No customer ID specified", "error");
            return;
        }

        try {
            await api.updateUserProfile(userId, { username, email, role });
            showAlert("Customer record updated successfully", "success");
            closeEditModal();
            loadCustomers();
            loadDashboard();
        } catch (error) {
            console.error('Update user error:', error);
            showAlert(error.message || "Failed to update customer record", "error");
        }
    }

    function closeEditModal() {
        const modal = document.getElementById("edit-user-modal");
        if (modal) modal.style.display = "none";
    }

    async function deleteCustomer(userId) {
        if (!userId) return;
        if (!confirm(`Are you sure you want to delete customer #${userId}?`)) {
            return;
        }

        try {
            await api.deleteAccount(userId);
            showAlert("Customer deleted successfully", "success");
            loadCustomers();
            loadDashboard();
        } catch (error) {
            console.error('Delete customer error:', error);
            showAlert(error.message || "Failed to delete customer record", "error");
        }
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

    function unwrapList(response) {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;
        if (response.data && Array.isArray(response.data.content)) return response.data.content;
        if (Array.isArray(response.content)) return response.content;
        if (Array.isArray(response.orders)) return response.orders;
        if (Array.isArray(response.users)) return response.users;
        if (Array.isArray(response.products)) return response.products;
        if (Array.isArray(response.categories)) return response.categories;
        if (Array.isArray(response.items)) return response.items;
        return [];
    }

    function extractCustomerOrders(rawOrders, allUsers) {
        const usersList = unwrapList(allUsers);
        const ordersList = unwrapList(rawOrders);

        const customerUserMap = new Map();
        usersList.forEach(user => {
            if (!user) return;
            const role = String(user.role || '').toUpperCase().trim().replace(/^ROLE_/, '');
            const userId = user.userId != null ? Number(user.userId) : (user.id != null ? Number(user.id) : null);
            if (userId != null && !isNaN(userId) && role === 'CUSTOMER') {
                customerUserMap.set(userId, {
                    ...user,
                    userId: userId
                });
            }
        });

        const uniqueOrderMap = new Map();
        ordersList.forEach(order => {
            if (!order) return;
            const orderId = order.orderId != null ? Number(order.orderId) : (order.id != null ? Number(order.id) : null);
            const userId = order.userId != null ? Number(order.userId) : (order.user && order.user.userId != null ? Number(order.user.userId) : null);

            if (orderId != null && !isNaN(orderId) && userId != null && !isNaN(userId) && customerUserMap.has(userId)) {
                const customer = customerUserMap.get(userId);
                const customerName = (customer.fullName && customer.fullName.trim())
                    ? customer.fullName.trim()
                    : (customer.username || order.customerName || `Customer #${userId}`);
                const customerEmail = customer.email || order.customerEmail || '';
                const items = unwrapList(order.items || order.orderItems);

                uniqueOrderMap.set(orderId, {
                    ...order,
                    orderId: orderId,
                    userId: userId,
                    totalAmount: Number(order.totalAmount || order.amount || 0),
                    customerName: customerName,
                    customerEmail: customerEmail,
                    items: items.length > 0 ? items : (order.items || [])
                });
            }
        });

        return {
            customers: Array.from(customerUserMap.values()),
            customerOrders: Array.from(uniqueOrderMap.values())
        };
    }

    function calculateOrderNetRevenue(order) {
        if (!order) return 0;
        const rawPaymentStatus = (order.paymentStatus || '').toUpperCase().trim();
        const orderStatus = (order.status || '').toUpperCase().trim();
        const refundStatus = (order.refundStatus || '').toUpperCase().trim();

        // If the order is cancelled, revenue is 0
        if (orderStatus === 'CANCELLED') {
            return 0;
        }

        // Only successful/paid orders generate revenue
        const isPaid = (rawPaymentStatus === 'SUCCESS' || rawPaymentStatus === 'PAID' || rawPaymentStatus === 'COMPLETED');
        if (!isPaid) {
            return 0;
        }

        const totalAmount = Number(order.totalAmount || 0);
        const refundAmount = Number(order.refundAmount || 0);

        // Fully or partially refunded
        if (refundStatus === 'REFUNDED') {
            if (refundAmount >= totalAmount || refundAmount <= 0) {
                return 0;
            }
            return Math.max(0, totalAmount - refundAmount);
        }

        return Math.max(0, totalAmount);
    }

    function renderDashboardCharts(products, orders, categories) {
        const categoryMap = buildCategoryNameMap(categories);

        // Use deduplicated customer orders
        const uniqueOrderMap = new Map();
        (orders || []).forEach(o => {
            if (o && o.orderId) uniqueOrderMap.set(o.orderId, o);
        });
        const storeOrders = Array.from(uniqueOrderMap.values());

        // Monthly revenue trend (last 6 months)
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return { key, label: date.toLocaleDateString('en-IN', { month: 'short' }), amount: 0, count: 0 };
        });

        storeOrders.forEach(order => {
            const netRev = calculateOrderNetRevenue(order);
            const created = new Date(order.createdAt || Date.now());
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            const monthEntry = monthlyRevenue.find(entry => entry.key === key);
            if (monthEntry) {
                monthEntry.amount += netRev;
                if (netRev > 0) {
                    monthEntry.count += 1;
                }
            }
        });

        renderLineChart('revenueTrendChart', monthlyRevenue.map(item => item.label), monthlyRevenue.map(item => item.amount), '#c5a059');
        renderLineChart('ordersTrendChart', monthlyRevenue.map(item => item.label), monthlyRevenue.map(item => item.count), '#7dd3fc');

        // Sales by Category (from qualifying paid orders)
        const categoryTotals = {};
        storeOrders.forEach(order => {
            if (calculateOrderNetRevenue(order) <= 0 || !order.items) return;
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
        storeOrders.forEach(order => {
            if (calculateOrderNetRevenue(order) <= 0 || !order.items) return;
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
            const [productsRes, ordersRes, categoriesRes, usersRes] = await Promise.all([
                api.getAllProducts(),
                api.getAllOrders(),
                api.getCategories(),
                api.getAllUsers()
            ]);

            allCachedProducts = Array.isArray(productsRes) ? productsRes : (productsRes && productsRes.data ? productsRes.data : []);
            allCachedCategories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes && categoriesRes.data ? categoriesRes.data : []);
            allCachedUsers = Array.isArray(usersRes) ? usersRes : (usersRes && usersRes.data ? usersRes.data : []);

            const { customers, customerOrders } = extractCustomerOrders(ordersRes, usersRes);
            allCachedOrders = customerOrders;

            // Total valid revenue from current customer unique orders
            const revenueSum = customerOrders.reduce((sum, order) => sum + calculateOrderNetRevenue(order), 0);
            const paidOrders = customerOrders.filter(order => calculateOrderNetRevenue(order) > 0);
            const lowStock = allCachedProducts.filter(product => Number(product.stock || 0) < 5).length;
            const inventoryValue = allCachedProducts.reduce((sum, product) => sum + (Number(product.price || 0) * Number(product.stock || 0)), 0);

            const totalProductsEl = document.getElementById('total-products');
            if (totalProductsEl) totalProductsEl.innerText = allCachedProducts.length;

            const totalCategoriesEl = document.getElementById('total-categories-metric');
            if (totalCategoriesEl) totalCategoriesEl.innerText = allCachedCategories.length;

            const totalOrdersEl = document.getElementById('total-orders');
            if (totalOrdersEl) totalOrdersEl.innerText = customerOrders.length;

            const totalUsersEl = document.getElementById('total-users');
            if (totalUsersEl) totalUsersEl.innerText = customers.length;

            const totalRevenueEl = document.getElementById('total-revenue');
            if (totalRevenueEl) totalRevenueEl.innerText = formatCurrency(revenueSum);

            const lowStockEl = document.getElementById('low-stock');
            if (lowStockEl) lowStockEl.innerText = lowStock;

            const paidOrdersEl = document.getElementById('paid-orders');
            if (paidOrdersEl) paidOrdersEl.innerText = paidOrders.length;

            const inventoryValueEl = document.getElementById('inventory-value');
            if (inventoryValueEl) inventoryValueEl.innerText = formatCurrency(inventoryValue);

            populateInventoryTable(allCachedProducts, allCachedCategories);
            renderDashboardCharts(allCachedProducts, customerOrders, allCachedCategories);
            setAdminWelcomeName();
        } catch (e) {
            console.error('Dashboard stats error:', e);
        }
    }

    async function loadAdminCategories() {
        const grid = document.getElementById('categories-cards-grid');
        const tbody = document.getElementById('admin-categories-tbody');
        if (!grid && !tbody) return;

        try {
            const [categoriesRes, productsRes] = await Promise.all([
                api.getCategories(),
                api.getAllProducts()
            ]);
            allCachedCategories = categoriesRes.data || categoriesRes || [];
            allCachedProducts = Array.isArray(productsRes) ? productsRes : (productsRes && productsRes.data ? productsRes.data : []);

            if (allCachedCategories.length === 0) {
                if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--light-gray);">No categories found.</div>`;
                if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--light-gray);">No categories found.</td></tr>`;
                return;
            }

            // Order mapping: 1. Analog Watches, 2. Digital Watches, 3. Luxury Watches, 4. Sports Watches
            const CATEGORY_ORDER_MAP = {
                "Analog Watches": 1,
                "Digital Watches": 2,
                "Luxury Watches": 3,
                "Sports Watches": 4,
                1: 1,
                2: 2,
                3: 3,
                4: 4
            };

            const sortedCategories = [...allCachedCategories].sort((a, b) => {
                const nameA = a.categoryName || a.name || '';
                const nameB = b.categoryName || b.name || '';
                const orderA = CATEGORY_ORDER_MAP[nameA] || CATEGORY_ORDER_MAP[a.categoryId] || 99;
                const orderB = CATEGORY_ORDER_MAP[nameB] || CATEGORY_ORDER_MAP[b.categoryId] || 99;
                return orderA - orderB;
            });

            let cardsHtml = '';
            let tableHtml = '';

            sortedCategories.forEach((cat) => {
                const name = cat.categoryName || cat.name || 'Collection';
                const catId = cat.categoryId;
                const normalizedKey = Object.keys(CATEGORY_IMAGES).find(k => k.toLowerCase() === name.toLowerCase()) || name;
                const catImg = CATEGORY_IMAGES[normalizedKey] || CATEGORY_IMAGES[catId] || (name.toLowerCase().includes('sport') ? '../sports-watch.jpg' : 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2');
                const fallbackImg = name.toLowerCase().includes('sport') ? '../sports-watch.jpg' : 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&cb=2';
                const productCount = allCachedProducts.filter(p => Number(p.categoryId) === Number(catId)).length;

                cardsHtml += `
                    <div class="category-card" data-id="${catId}">
                        <div class="category-card-img-wrap">
                            <img src="${catImg}" alt="${name}" class="category-card-img" onerror="this.src='${fallbackImg}'">
                        </div>
                        <div class="category-card-title">${name}</div>
                        <div class="category-card-count">${productCount} ${productCount === 1 ? 'Product' : 'Products'}</div>
                        <div class="category-card-actions">
                            <button type="button" class="btn-category-action edit-category-btn"
                                    data-id="${catId}"
                                    data-name="${name}">
                                Edit
                            </button>
                            <button type="button" class="btn-category-action delete-btn delete-category-btn"
                                    data-id="${catId}">
                                Delete
                            </button>
                        </div>
                    </div>
                `;

                tableHtml += `
                    <tr>
                        <td><strong>#${cat.categoryId}</strong></td>
                        <td><span style="color: var(--white); font-weight: 500;">${name}</span></td>
                        <td>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" class="btn-luxury edit-category-btn"
                                        data-id="${cat.categoryId}"
                                        data-name="${name}"
                                        style="padding: 4px 10px; font-size: 0.75rem; background: #0B1F3A; color: #FFFFFF; border: 1px solid #0B1F3A;">
                                    Edit
                                </button>
                                <button type="button" class="btn-luxury delete-category-btn"
                                        data-id="${cat.categoryId}"
                                        style="padding: 4px 10px; font-size: 0.75rem; background: #0B1F3A; color: #FFFFFF; border: 1px solid #0B1F3A;">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            if (grid) grid.innerHTML = cardsHtml;
            if (tbody) tbody.innerHTML = tableHtml;

            // Bind Category Actions for both grid & table
            document.querySelectorAll('.edit-category-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    const name = this.getAttribute('data-name');

                    const idInput = document.getElementById('edit-category-id');
                    const idDisplay = document.getElementById('edit-category-id-display');
                    const nameInput = document.getElementById('edit-category-name');

                    if (idInput) idInput.value = id;
                    if (idDisplay) idDisplay.value = id;
                    if (nameInput) nameInput.value = name;

                    const editModal = document.getElementById('edit-category-modal');
                    if (editModal) editModal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.delete-category-btn').forEach(btn => {
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
            if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--error); padding: 40px;">Failed to load categories.</div>`;
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--error);">Failed to load categories.</td></tr>`;
        }
    }

    function bindProductActionListeners() {
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

    let productsFilterBound = false;
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

            function renderFilteredProducts() {
                const searchInput = document.getElementById('product-search-input');
                const catFilter = document.getElementById('product-category-filter');
                const stockFilter = document.getElementById('product-stock-filter');

                const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
                const selectedCat = catFilter ? catFilter.value : '';
                const selectedStock = stockFilter ? stockFilter.value : '';

                let filtered = (allCachedProducts || []).filter(prod => {
                    if (!prod) return false;
                    const name = String(prod.name || '').toLowerCase();
                    const prodId = String(prod.productId || '');
                    const categoryName = String(dynamicCategoryMap[prod.categoryId] || CATEGORY_MAP[prod.categoryId] || '').toLowerCase();

                    // Search match
                    if (searchTerm && !name.includes(searchTerm) && !prodId.includes(searchTerm) && !categoryName.includes(searchTerm)) {
                        return false;
                    }

                    // Category filter
                    if (selectedCat && String(prod.categoryId) !== String(selectedCat)) {
                        return false;
                    }

                    // Stock filter
                    const stock = Number(prod.stock || 0);
                    if (selectedStock === 'in' && stock < 5) return false;
                    if (selectedStock === 'low' && (stock <= 0 || stock >= 5)) return false;
                    if (selectedStock === 'out' && stock > 0) return false;

                    return true;
                });

                if (filtered.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--light-gray);">No timepieces match the selected filters.</td></tr>`;
                    return;
                }

                let html = '';
                filtered.forEach(prod => {
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

                    // Rating score if genuine data present
                    const ratingScore = (prod.rating !== undefined && prod.rating !== null && Number(prod.rating) > 0)
                        ? `<span class="rating-star">★</span> <span class="rating-value">${Number(prod.rating).toFixed(1)}</span>`
                        : `<span style="color: var(--light-gray); font-size: 0.75rem;">No reviews yet</span>`;

                    html += `
                        <tr>
                            <td><strong>#${prod.productId}</strong></td>
                            <td>
                                <img src="${resolvedImg}" alt="${prod.name}" style="width: 50px; height: 50px; object-fit: contain; background: #151515; border: var(--border); padding: 2px; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80'">
                            </td>
                            <td><span style="color: #111111; font-weight: 600;">${prod.name}</span></td>
                            <td>${categoryName}</td>
                            <td><span style="color: var(--gold-dark); font-weight: 600;">${formattedPrice}</span></td>
                            <td>
                                <span style="color: ${prod.stock < 5 ? 'var(--error)' : 'var(--success)'}; font-weight: 600;">
                                    ${prod.stock} Qty
                                </span>
                            </td>
                            <td><div class="product-card-rating">${ratingScore}</div></td>
                            <td>
                                <div style="display: flex; gap: 6px;">
                                    <button type="button" class="btn-luxury edit-product-btn"
                                            onclick="editProduct(${prod.productId})"
                                            style="padding: 4px 10px; font-size: 0.75rem; background: #0B1F3A; color: #FFFFFF; border: 1px solid #0B1F3A;">
                                        Edit
                                    </button>
                                    <button type="button" class="btn-luxury delete-product-btn"
                                            data-id="${prod.productId}"
                                            style="padding: 4px 10px; font-size: 0.75rem; background: #0B1F3A; color: #FFFFFF; border: 1px solid #0B1F3A;">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;

                // Ensure no buy-now buttons exist in Admin Products
                tbody.querySelectorAll('.product-btn-buynow, .buy-now-btn, #buy-now-btn').forEach(btn => btn.remove());

                // Bind delete buttons
                bindProductActionListeners();
            }

            renderFilteredProducts();

            if (!productsFilterBound) {
                productsFilterBound = true;
                const searchInput = document.getElementById('product-search-input');
                const catFilter = document.getElementById('product-category-filter');
                const stockFilter = document.getElementById('product-stock-filter');

                if (searchInput) searchInput.addEventListener('input', renderFilteredProducts);
                if (catFilter) catFilter.addEventListener('change', renderFilteredProducts);
                if (stockFilter) stockFilter.addEventListener('change', renderFilteredProducts);
            }

        } catch (err) {
            console.error('Failed to load admin products:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--error); padding: 30px;">Error loading products list.</td></tr>`;
        }
    }

    let activeOrderFilter = 'ALL';
    let ordersFilterBound = false;

    async function loadAdminOrders() {
        const tbody = document.getElementById('admin-orders-tbody');
        if (!tbody) return;

        try {
            const [ordersRes, usersRes] = await Promise.all([
                api.getAllOrders(),
                api.getAllUsers()
            ]);

            allCachedUsers = Array.isArray(usersRes) ? usersRes : (usersRes && usersRes.data ? usersRes.data : []);
            const { customers, customerOrders } = extractCustomerOrders(ordersRes, usersRes);
            allCachedOrders = customerOrders;
            const storeOrders = allCachedOrders;

            if (storeOrders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--light-gray);">No customer orders placed yet.</td></tr>`;
                return;
            }

            ordersSort(storeOrders);

            function renderFilteredOrders() {
                const searchInput = document.getElementById('orders-search-input');
                const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

                let filtered = storeOrders.filter(order => {
                    const rawPaymentStatus = (order.paymentStatus || '').toUpperCase().trim();
                    const orderStatusUpper = (order.status || '').toUpperCase().trim();
                    const refundStatusUpper = (order.refundStatus || '').toUpperCase().trim();

                    // Status Filter Logic
                    if (activeOrderFilter === 'PAID') {
                        const isPaid = (rawPaymentStatus === 'SUCCESS' || rawPaymentStatus === 'PAID' || rawPaymentStatus === 'COMPLETED');
                        if (!isPaid || orderStatusUpper === 'CANCELLED' || refundStatusUpper === 'REFUNDED') return false;
                    } else if (activeOrderFilter === 'PENDING') {
                        const isPending = (rawPaymentStatus === 'PENDING' || rawPaymentStatus === 'CREATED' || rawPaymentStatus === 'UNPAID' || !rawPaymentStatus);
                        if (!isPending || orderStatusUpper === 'CANCELLED') return false;
                    } else if (activeOrderFilter === 'FAILED') {
                        if (rawPaymentStatus !== 'FAILED') return false;
                    } else if (activeOrderFilter === 'CANCELLED') {
                        if (orderStatusUpper !== 'CANCELLED') return false;
                    } else if (activeOrderFilter === 'REFUNDED') {
                        if (refundStatusUpper !== 'REFUNDED') return false;
                    }

                    // Search Query Filter
                    if (query) {
                        const orderIdStr = String(order.orderId || '');
                        const name = String(order.customerName || '').toLowerCase();
                        const email = String(order.customerEmail || '').toLowerCase();
                        const itemsStr = (order.items || []).map(it => String(it.productName || '').toLowerCase()).join(' ');

                        if (!orderIdStr.includes(query) && !name.includes(query) && !email.includes(query) && !itemsStr.includes(query)) {
                            return false;
                        }
                    }

                    return true;
                });

                if (filtered.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--light-gray);">No orders match the selected filter.</td></tr>`;
                    return;
                }

                let html = '';
                filtered.forEach(order => {
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
                        itemsList = order.items.map(item => `${item.productName || 'Watch'} (x${item.quantity})`).join(', ');
                    } else {
                        itemsList = 'No items';
                    }

                    const customerName = order.customerName || `Customer #${order.userId}`;
                    const customerEmail = order.customerEmail || '';

                    const rawPaymentStatus = (order.paymentStatus || '').toUpperCase().trim();
                    const orderStatusUpper = (order.status || '').toUpperCase().trim();
                    let paymentStatusText = "Pending";
                    let paymentStatusClass = "badge-gold";

                    if (rawPaymentStatus === 'SUCCESS' || rawPaymentStatus === 'PAID' || rawPaymentStatus === 'COMPLETED') {
                        paymentStatusText = "Paid";
                        paymentStatusClass = "badge-success";
                    } else if (rawPaymentStatus === 'FAILED') {
                        paymentStatusText = "Failed";
                        paymentStatusClass = "badge-danger";
                    } else if (order.refundStatus && order.refundStatus.toUpperCase().trim() === 'REFUNDED') {
                        paymentStatusText = "Refunded";
                        paymentStatusClass = "badge-gold";
                    } else if (orderStatusUpper === 'CANCELLED') {
                        paymentStatusText = "Cancelled";
                        paymentStatusClass = "badge-danger";
                    } else if (rawPaymentStatus === 'PENDING' || rawPaymentStatus === 'CREATED' || rawPaymentStatus === 'UNPAID') {
                        paymentStatusText = "Pending";
                        paymentStatusClass = "badge-gold";
                    }

                    html += `
                        <tr data-id="${order.orderId}">
                            <td><strong>#TV-ORD-${order.orderId}</strong></td>
                            <td>
                                <strong style="color: #111111;">${customerName}</strong>
                                ${customerEmail ? `<div style="font-size: 0.75rem; color: #6B6A67;">${customerEmail}</div>` : ''}
                            </td>
                            <td title="${itemsList}"><span class="table-items-cell" style="max-width: 180px;">${itemsList}</span></td>
                            <td><span style="color: var(--gold-dark); font-weight: 600;">${formattedTotal}</span></td>
                            <td><span style="font-size: 0.85rem; color: #6B6A67;">${date}</span></td>
                            <td><span class="badge ${paymentStatusClass}">${paymentStatusText}</span></td>
                            <td>
                                <select class="form-control admin-status-select" data-id="${order.orderId}" style="padding: 4px 8px; font-size: 0.8rem; width: 140px; font-weight: 500;">
                                    <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                    <option value="PLACED" ${order.status === 'PLACED' ? 'selected' : ''}>Placed</option>
                                    <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                                    <option value="PACKED" ${order.status === 'PACKED' ? 'selected' : ''}>Packed</option>
                                    <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                                    <option value="OUT_FOR_DELIVERY" ${order.status === 'OUT_FOR_DELIVERY' || order.status === 'OUT FOR DELIVERY' ? 'selected' : ''}>Out for Delivery</option>
                                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                                    <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td style="white-space: nowrap; width: 1%; text-align: center;">
                                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: auto; white-space: nowrap;">
                                    <button type="button" class="btn-action-sm view-order-details-btn"
                                            data-id="${order.orderId || order.id}"
                                            onclick="event.preventDefault(); event.stopPropagation(); window.viewAdminOrderDetails(${order.orderId || order.id});">
                                        View Details
                                    </button>
                                    ${(orderStatusUpper !== 'CANCELLED' && orderStatusUpper !== 'DELIVERED') ? `
                                        <button type="button" class="btn-action-sm btn-danger-action cancel-order-btn"
                                                data-id="${order.orderId || order.id}"
                                                onclick="event.preventDefault(); event.stopPropagation(); window.cancelAdminOrder(${order.orderId || order.id});">
                                            Cancel
                                        </button>
                                    ` : ''}
                                </div>
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
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const orderId = this.getAttribute('data-id');
                        if (orderId && window.viewAdminOrderDetails) {
                            window.viewAdminOrderDetails(orderId);
                        }
                    });
                });

                // Bind cancel order listeners
                tbody.querySelectorAll('.cancel-order-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const orderId = this.getAttribute('data-id');
                        if (orderId && window.cancelAdminOrder) {
                            window.cancelAdminOrder(orderId);
                        }
                    });
                });
            }

            renderFilteredOrders();

            if (!ordersFilterBound) {
                ordersFilterBound = true;
                const searchInput = document.getElementById('orders-search-input');
                if (searchInput) searchInput.addEventListener('input', renderFilteredOrders);

                const statusFilterSelect = document.getElementById('orders-status-filter');
                if (statusFilterSelect) {
                    statusFilterSelect.addEventListener('change', function () {
                        activeOrderFilter = this.value || 'ALL';
                        renderFilteredOrders();
                    });
                }
            }

        } catch (err) {
            console.error('Failed to load admin orders:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--error); padding: 30px;">Error loading orders list.</td></tr>`;
        }
    }

    function ordersSort(orders) {
        orders.sort((a, b) => (b.orderId || b.id || 0) - (a.orderId || a.id || 0));
    }

    window.viewAdminOrderDetails = async function (orderId) {
        if (!orderId) return;
        try {
            let order = (allCachedOrders || []).find(o => o && String(o.orderId || o.id) === String(orderId));
            if (!order || !order.items || order.items.length === 0) {
                const fetched = await api.getOrderById(orderId);
                if (fetched) {
                    const resolved = (fetched.data && typeof fetched.data === 'object') ? fetched.data : fetched;
                    order = resolved;
                }
            }
            if (order) {
                showOrderDetailsModal(order);
            } else {
                showAlert(`Unable to load details for Order #${orderId}.`, 'error');
            }
        } catch (err) {
            console.error('Failed to open order details modal:', err);
            showAlert(`Unable to load details for Order #${orderId}.`, 'error');
        }
    };

    window.cancelAdminOrder = async function (orderId) {
        if (!orderId) return;
        if (confirm(`Are you sure you want to cancel Order #TV-ORD-${orderId}?`)) {
            try {
                await api.updateOrderStatus(orderId, 'CANCELLED');
                showAlert(`Order #${orderId} has been cancelled.`, 'success');
                loadAdminOrders();
                loadDashboard();
            } catch (err) {
                showAlert(err.message || 'Failed to cancel order.', 'error');
            }
        }
    };

    async function showOrderDetailsModal(order) {
        const modal = document.getElementById('order-details-modal');
        const body = document.getElementById('order-modal-body');
        if (!modal || !body) return;

        const orderRefId = order.orderId || order.id;

        // If order items are not populated, fetch full order
        if ((!order.items || order.items.length === 0) && orderRefId) {
            try {
                const freshOrder = await api.getOrderById(orderRefId);
                const resolved = (freshOrder && freshOrder.data && typeof freshOrder.data === 'object') ? freshOrder.data : freshOrder;
                if (resolved && resolved.items && resolved.items.length > 0) {
                    order = { ...order, ...resolved };
                }
            } catch (e) {
                console.warn('Could not fetch enriched order details:', e);
            }
        }

        const date = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A';
        const total = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(order.totalAmount || order.amount || 0);

        let itemsHtml = '';
        const orderItems = (order.items && order.items.length > 0) ? order.items : (order.orderItems || []);
        if (orderItems && orderItems.length > 0) {
            orderItems.forEach(it => {
                const itemPrice = Number(it.price || 0);
                const itemQty = Number(it.quantity || 1);
                const sub = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(itemPrice * itemQty);
                itemsHtml += `
                    <tr>
                        <td><strong style="color: #111111;">${it.productName || ('Product #' + (it.productId || ''))}</strong></td>
                        <td>${itemQty}</td>
                        <td style="color: var(--gold-dark); font-weight: 600;">${sub}</td>
                    </tr>
                `;
            });
        } else {
            itemsHtml = `<tr><td colspan="3" style="color:var(--light-gray); font-style:italic; padding: 15px; text-align: center;">No item breakdown available.</td></tr>`;
        }

        const rawPaymentStatus = (order.paymentStatus || '').toUpperCase().trim();
        const orderStatusUpper = (order.status || '').toUpperCase().trim();
        let paymentStatusText = "Pending";
        let paymentStatusBadgeClass = "badge-gold";

        if (rawPaymentStatus === 'SUCCESS' || rawPaymentStatus === 'PAID' || rawPaymentStatus === 'COMPLETED') {
            paymentStatusText = "Paid";
            paymentStatusBadgeClass = "badge-success";
        } else if (rawPaymentStatus === 'FAILED') {
            paymentStatusText = "Failed";
            paymentStatusBadgeClass = "badge-danger";
        } else if (order.refundStatus && String(order.refundStatus).toUpperCase().trim() === 'REFUNDED') {
            paymentStatusText = "Refunded";
            paymentStatusBadgeClass = "badge-gold";
        } else if (orderStatusUpper === 'CANCELLED') {
            paymentStatusText = "Cancelled";
            paymentStatusBadgeClass = "badge-danger";
        }

        let formattedOrderStatus = order.status ? String(order.status).toLowerCase().replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Pending';
        if (orderStatusUpper === 'OUT_FOR_DELIVERY' || orderStatusUpper === 'OUT FOR DELIVERY') formattedOrderStatus = 'Out for Delivery';

        const customerDisplayName = order.customerName || (order.user ? (order.user.fullName || order.user.username) : `Customer #${order.userId || ''}`);
        const customerEmailDisplay = order.customerEmail || (order.user ? order.user.email : 'Not available');

        let cancellationSection = '';
        if (orderStatusUpper === 'CANCELLED' || (order.refundStatus && String(order.refundStatus).toUpperCase().trim() === 'REFUNDED')) {
            cancellationSection = `
                <div style="background: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.2); padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 0.85rem;">
                    ${order.cancellationReason ? `<div><strong>Cancellation Reason:</strong> ${order.cancellationReason}</div>` : ''}
                    ${order.refundStatus ? `<div><strong>Refund Status:</strong> <span class="badge ${String(order.refundStatus).toUpperCase().trim() === 'REFUNDED' ? 'badge-gold' : 'badge-danger'}">${order.refundStatus}</span> (${formatCurrency(order.refundAmount || order.totalAmount)})</div>` : ''}
                </div>
            `;
        }

        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px; font-weight: 700; font-size: 0.95rem;">Customer Details</h5>
                    <div style="margin-bottom: 4px;"><strong>Customer Name:</strong> ${customerDisplayName}</div>
                    <div style="margin-bottom: 4px;"><strong>Email:</strong> ${customerEmailDisplay}</div>
                    <div style="margin-bottom: 4px;"><strong>Collector ID:</strong> #${order.userId || 'N/A'}</div>
                    <div style="margin-top: 6px;"><strong>Order Status:</strong> <span class="badge ${orderStatusUpper === 'CANCELLED' ? 'badge-danger' : 'badge-gold'}" style="font-size:0.75rem;">${formattedOrderStatus}</span></div>
                </div>
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px; font-weight: 700; font-size: 0.95rem;">Order Context</h5>
                    <div style="margin-bottom: 4px;"><strong>Order Reference:</strong> #TV-ORD-${orderRefId}</div>
                    <div style="margin-bottom: 4px;"><strong>Payment Status:</strong> <span class="badge ${paymentStatusBadgeClass}">${paymentStatusText}</span></div>
                    <div style="margin-bottom: 4px;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Razorpay'}</div>
                    <div style="margin-bottom: 4px;"><strong>Placed Time:</strong> ${date}</div>
                </div>
            </div>

            ${cancellationSection}

            <h5 style="color:var(--gold); margin-bottom: 8px; font-weight: 700; font-size: 0.95rem; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 5px;">Ordered Products</h5>
            <table class="admin-table" style="margin-bottom: 20px;">
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="2" style="text-align:right; font-weight:bold;">Grand Total:</td>
                        <td style="color:var(--gold-dark); font-weight:bold; font-size: 1rem;">${total}</td>
                    </tr>
                </tbody>
            </table>
        `;
        modal.style.display = 'flex';
    }

    async function loadCustomers() {
        const grid = document.getElementById('customers-grid');
        const tbody = document.getElementById('customers-table-body');
        const countBadge = document.getElementById('customers-count-badge');
        if (!grid && !tbody) return;

        try {
            const [usersRes, ordersRes] = await Promise.all([
                api.getAllUsers(),
                api.getAllOrders()
            ]);
            allCachedUsers = Array.isArray(usersRes) ? usersRes : (usersRes && usersRes.data ? usersRes.data : []);
            const { customers, customerOrders } = extractCustomerOrders(ordersRes, usersRes);
            allCachedOrders = customerOrders;

            if (countBadge) {
                countBadge.innerText = `${customers.length} ${customers.length === 1 ? 'Customer' : 'Customers'}`;
            }

            if (customers.length === 0) {
                if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--light-gray);">No customer records found.</div>';
                if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--light-gray);">No customers found.</td></tr>';
                return;
            }

            let cardsHtml = '';
            customers.forEach((u, index) => {
                const userOrders = customerOrders.filter(o => o && o.userId === u.userId);
                const spendingSum = userOrders.reduce((sum, o) => sum + calculateOrderNetRevenue(o), 0);
                const formattedSpending = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(spendingSum);

                const displayName = (u.fullName && u.fullName.trim()) ? u.fullName.trim() : (u.username || `Customer`);
                const avatarChar = displayName.charAt(0).toUpperCase() || 'C';
                const roleLabel = (u.role && u.role.toUpperCase() === 'ADMIN') ? 'Admin' : 'Customer';
                const cleanEmail = u.email || 'N/A';
                const displayNum = `${index + 1}.`;

                cardsHtml += `
                    <div class="customer-row-card" data-user-id="${u.userId}">
                        <div class="customer-row-info">
                            <span class="customer-num-tag">${displayNum}</span>
                            <div class="customer-dot-avatar">${avatarChar}</div>
                            <strong class="customer-name-text">${displayName}</strong>

                            <span class="customer-sep">|</span>

                            <span class="customer-email-text">${cleanEmail}</span>

                            <span class="customer-sep">|</span>

                            <span class="customer-role-pill">${roleLabel}</span>

                            <span class="customer-sep">|</span>

                            <strong class="customer-spend-text">${formattedSpending}</strong>

                            <span class="customer-sep">|</span>
                        </div>

                        <div class="customer-row-actions">
                            <button type="button" class="customer-row-btn btn-profile view-customer-details-btn" data-id="${u.userId}" onclick="event.preventDefault(); event.stopPropagation(); window.viewCustomerProfile(${u.userId});">
                                Profile
                            </button>
                            <button type="button" class="customer-row-btn btn-edit edit-customer-btn" data-id="${u.userId}" onclick="event.preventDefault(); event.stopPropagation(); window.editCustomer(${u.userId});">
                                Edit
                            </button>
                            <button type="button" class="customer-row-btn btn-delete delete-customer-btn" data-id="${u.userId}" onclick="event.preventDefault(); event.stopPropagation(); window.deleteCustomer(${u.userId});">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            });

            if (grid) {
                grid.innerHTML = cardsHtml;
                grid.querySelectorAll('.view-customer-details-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const customerId = parseInt(this.getAttribute('data-id'));
                        if (customerId && window.viewCustomerProfile) {
                            window.viewCustomerProfile(customerId);
                        }
                    });
                });
                grid.querySelectorAll('.edit-customer-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const customerId = parseInt(this.getAttribute('data-id'));
                        if (customerId && window.editCustomer) {
                            window.editCustomer(customerId);
                        }
                    });
                });
                grid.querySelectorAll('.delete-customer-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const customerId = parseInt(this.getAttribute('data-id'));
                        if (customerId && window.deleteCustomer) {
                            window.deleteCustomer(customerId);
                        }
                    });
                });
            }

        } catch (e) {
            console.error(e);
            if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--error);">Failed to load customer records.</div>';
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--error);">Failed to load customer files.</td></tr>';
        }
    }

    function showCustomerProfileModal(customer) {
        const modal = document.getElementById('customer-profile-modal');
        const body = document.getElementById('customer-modal-body');
        if (!modal || !body) return;

        const userOrders = (allCachedOrders || []).filter(o => o && o.userId === customer.userId);
        const orderCount = userOrders.length;
        const spendingSum = userOrders.reduce((sum, o) => sum + calculateOrderNetRevenue(o), 0);

        let lastPurchaseDate = 'N/A';
        let purchasedItems = [];
        let favCategory = 'N/A';
        const catCounts = {};

        if (orderCount > 0) {
            userOrders.forEach(o => {
                if (o.items) {
                    o.items.forEach(it => {
                        purchasedItems.push(`${it.productName || ('Product #' + it.productId)} (x${it.quantity})`);
                        const pId = it.productId;
                        const product = (allCachedProducts || []).find(p => p.productId === pId);
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

        let ordersTableHtml = '';
        if (userOrders.length > 0) {
            ordersSort(userOrders);
            const rows = userOrders.map(o => {
                const date = new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                const formattedAmt = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(o.totalAmount);
                const itemsSummary = (o.items && o.items.length > 0)
                    ? o.items.map(it => `${it.productName || ('Watch #' + it.productId)} (x${it.quantity})`).join(', ')
                    : 'No items';

                const rawPayStatus = (o.paymentStatus || '').toUpperCase().trim();
                const ordStatusUpper = (o.status || '').toUpperCase().trim();
                let payBadgeText = "Pending";
                let payBadgeClass = "badge-gold";

                if (rawPayStatus === 'SUCCESS' || rawPayStatus === 'PAID' || rawPayStatus === 'COMPLETED') {
                    payBadgeText = "Paid";
                    payBadgeClass = "badge-success";
                } else if (rawPayStatus === 'FAILED') {
                    payBadgeText = "Failed";
                    payBadgeClass = "badge-danger";
                } else if (o.refundStatus && o.refundStatus.toUpperCase().trim() === 'REFUNDED') {
                    payBadgeText = "Refunded";
                    payBadgeClass = "badge-gold";
                } else if (ordStatusUpper === 'CANCELLED') {
                    payBadgeText = "Cancelled";
                    payBadgeClass = "badge-danger";
                }

                let extraInfo = '';
                if (ordStatusUpper === 'CANCELLED' && o.cancellationReason) {
                    extraInfo = `<div style="font-size: 0.72rem; color: #dc2626;">Reason: ${o.cancellationReason}</div>`;
                }
                if (o.refundStatus && o.refundStatus.toUpperCase().trim() === 'REFUNDED') {
                    extraInfo += `<div style="font-size: 0.72rem; color: #d97706;">Refunded: ${formatCurrency(o.refundAmount || o.totalAmount)}</div>`;
                }

                return `
                    <tr>
                        <td><strong>#TV-ORD-${o.orderId}</strong></td>
                        <td>${date}</td>
                        <td title="${itemsSummary}"><span class="table-items-cell" style="max-width: 140px;">${itemsSummary}</span></td>
                        <td><strong style="color: var(--gold-light);">${formattedAmt}</strong></td>
                        <td><span class="badge ${payBadgeClass}">${payBadgeText}</span></td>
                        <td><span class="badge badge-gold" style="font-size: 0.72rem;">${o.status}</span>${extraInfo}</td>
                    </tr>
                `;
            }).join('');

            ordersTableHtml = `
                <h5 style="color:var(--gold); margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; margin-top: 15px;">Customer Orders History (${userOrders.length})</h5>
                <div style="overflow-x: auto; margin-bottom: 20px;">
                    <table class="admin-table" style="font-size: 0.82rem;">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Products</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Order Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            ordersTableHtml = `
                <h5 style="color:var(--gold); margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; margin-top: 15px;">Customer Orders History (0)</h5>
                <div style="color: var(--light-gray); font-size: 0.85rem; padding: 10px 0 20px;">No orders placed yet by this customer.</div>
            `;
        }

        const customerDisplayName = (customer.fullName && customer.fullName.trim()) ? customer.fullName.trim() : (customer.username || `Customer #${customer.userId}`);

        body.innerHTML = `
            <div style="display:flex; gap: 20px; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--gold); color: var(--black); font-weight: bold; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">
                    ${customer.username ? customer.username.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                    <h4 style="font-family: var(--font-title); font-size: 1.2rem; color: var(--white); margin: 0;">${customerDisplayName}</h4>
                    <span style="font-size:0.8rem; color: var(--gold-light);">${customer.email}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Activity Profile</h5>
                    <div><strong>Total Orders:</strong> ${orderCount} orders</div>
                    <div><strong>Accumulated Spendings:</strong> ${totalSpending}</div>
                    <div><strong>Last Purchase Date:</strong> ${lastPurchaseDate}</div>
                </div>
                <div>
                    <h5 style="color:var(--gold); margin-bottom: 8px;">Concierge History</h5>
                    <div><strong>Favorite Category:</strong> ${favCategory}</div>
                    <div><strong>Products Purchased:</strong> <span style="font-size:0.85rem; color:var(--light-gray);">${itemsListStr}</span></div>
                    <div><strong>Collector ID:</strong> #${customer.userId}</div>
                </div>
            </div>

            ${ordersTableHtml}
        `;
        modal.style.display = 'flex';
    }

    async function loadAdminReviews() {
        const tbody = document.getElementById('reviews-table-body');
        const totalEl = document.getElementById('rev-total');
        const avgEl = document.getElementById('rev-avg');
        const highEl = document.getElementById('rev-highest');
        const lowEl = document.getElementById('rev-lowest');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: var(--light-gray);">Loading reviews...</td></tr>';

        try {
            const productsRes = await api.getAllProducts();
            const products = Array.isArray(productsRes) ? productsRes : (productsRes && (productsRes.content || productsRes.data) ? (productsRes.content || productsRes.data) : []);

            const reviewPromises = products.map(async (p) => {
                try {
                    const pRevs = await api.getProductReviews(p.productId);
                    const list = Array.isArray(pRevs) ? pRevs : (pRevs && pRevs.data ? pRevs.data : []);
                    return list.map(r => ({
                        ...r,
                        productName: p.name || `Product #${p.productId}`
                    }));
                } catch (e) {
                    return [];
                }
            });

            const reviewLists = await Promise.all(reviewPromises);
            const allReviews = reviewLists.flat();

            if (allReviews.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--light-gray); font-style: italic;">No reviews yet</td></tr>';
                if (totalEl) totalEl.innerText = '0';
                if (avgEl) avgEl.innerText = 'N/A';
                if (highEl) highEl.innerText = 'None';
                if (lowEl) lowEl.innerText = 'None';
                return;
            }

            const totalScore = allReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
            const avgRating = (totalScore / allReviews.length).toFixed(1);

            tbody.innerHTML = allReviews.map(r => {
                const customerName = r.username || `Customer #${r.userId}`;
                const ratingNum = Math.min(5, Math.max(1, Number(r.rating) || 5));
                const stars = '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);
                const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                }) : 'N/A';

                return `
                    <tr>
                        <td><strong>${customerName}</strong></td>
                        <td><span style="color: var(--gold-light);">${r.productName}</span></td>
                        <td><span style="color: #f59e0b; font-weight: bold;">${stars}</span></td>
                        <td><span style="color: var(--light-gray); font-size: 0.85rem;">"${r.comment || ''}"</span></td>
                        <td><span style="color: var(--light-gray); font-size: 0.8rem;">${dateStr}</span></td>
                        <td>
                            <div style="display: flex; gap: 6px;">
                                <span style="color: var(--light-gray); font-size: 0.8rem; font-weight: 500;">Verified</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (totalEl) totalEl.innerText = allReviews.length;
            if (avgEl) avgEl.innerText = `${avgRating} ★`;
        } catch (err) {
            console.error('Failed to load real reviews:', err);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--light-gray); font-style: italic;">No reviews yet</td></tr>';
            if (totalEl) totalEl.innerText = '0';
            if (avgEl) avgEl.innerText = 'N/A';
            if (highEl) highEl.innerText = 'None';
            if (lowEl) lowEl.innerText = 'None';
        }
    }

    async function loadAdminManagement() {
        const tbody = document.getElementById('admin-mgmt-tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--light-gray);">Loading administrators...</td></tr>';

        try {
            const resp = await api.getAdmins();
            const admins = (resp && resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

            if (!admins.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--light-gray);">No administrator accounts found.</td></tr>';
                return;
            }

            tbody.innerHTML = admins.map(admin => {
                const date = admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                }) : 'N/A';

                return `
                    <tr>
                        <td><strong>#ADM-${admin.adminId || admin.userId || admin.id}</strong></td>
                        <td><strong style="color: #1F3A5F;">${admin.fullName || admin.username}</strong></td>
                        <td>${admin.email}</td>
                        <td><span class="badge" style="background: #1F3A5F; color: #FFFFFF; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">ADMIN</span></td>
                        <td>${date}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error('Error loading admins:', err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: #ef4444;">Failed to load administrators: ${err.message || 'Unauthorized.'}</td></tr>`;
        }
    }

    async function loadTodayEarnings() {
        const earningsEl = document.getElementById('admin-today-earnings');
        const ordersCountEl = document.getElementById('admin-today-orders-count');
        const tbody = document.getElementById('today-orders-tbody');
        const badgeEl = document.getElementById('today-date-badge');

        const now = new Date();
        const dateString = now.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        }).toUpperCase();
        if (badgeEl) badgeEl.textContent = `TODAY - ${dateString}`;

        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--light-gray);">Loading today\'s earnings...</td></tr>';

        try {
            const resp = await api.getTodayEarnings();
            const data = (resp && resp.data) ? resp.data : resp;

            const earnings = Number(data.todayEarnings || 0);
            const count = data.paidOrdersCount || (data.paidOrders ? data.paidOrders.length : 0);
            const orders = data.paidOrders || [];

            if (earningsEl) earningsEl.textContent = formatCurrency(earnings);
            if (ordersCountEl) ordersCountEl.textContent = count;

            if (tbody) {
                if (!orders.length) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--light-gray);">No paid orders recorded today yet.</td></tr>';
                } else {
                    tbody.innerHTML = orders.map(order => {
                        const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                        }) : 'Today';
                        const statusClass = getStatusBadgeClass(order.status);
                        return `
                            <tr>
                                <td><strong>#TV-ORD-${order.orderId}</strong></td>
                                <td>${order.customerName || ('Customer #' + order.userId)}</td>
                                <td><strong style="color: #1F3A5F;">${formatCurrency(order.totalAmount)}</strong></td>
                                <td><span class="badge ${statusClass}">${order.status || 'CONFIRMED'}</span></td>
                                <td>${timeStr}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            console.error('Error loading today earnings:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: #ef4444;">Failed to calculate today's earnings: ${err.message || 'Unauthorized.'}</td></tr>`;
        }
    }

    let isInitialized = false;
    function initAdminDashboard() {
        if (isInitialized) return;
        isInitialized = true;

        setupRoleBasedSidebar();
        setAdminWelcomeName();

        const pages = [
            "dashboard",
            "categories",
            "products",
            "orders",
            "customers",
            "inventory",
            "reviews",
            "settings",
            "admin-mgmt",
            "today-earnings"
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
                if (page === "reviews") loadAdminReviews();
                if (page === "settings") loadStoreSettingsForm();
                if (page === "admin-mgmt") loadAdminManagement();
                if (page === "today-earnings") loadTodayEarnings();
            });
        });

        // Add Product Modal Bindings
        const openAddProductBtn = document.getElementById('open-add-product-modal-btn');
        const addProductModal = document.getElementById('add-product-modal');
        const closeAddProductBtn = document.getElementById('close-add-product-modal-btn');
        const cancelAddProductBtn = document.getElementById('cancel-add-product-btn');
        const addProductForm = document.getElementById('add-product-form');

        if (openAddProductBtn && addProductModal) {
            openAddProductBtn.addEventListener('click', () => {
                if (addProductForm) addProductForm.reset();
                addProductModal.style.display = 'flex';
            });
        }
        if (closeAddProductBtn && addProductModal) {
            closeAddProductBtn.addEventListener('click', () => {
                addProductModal.style.display = 'none';
            });
        }
        if (cancelAddProductBtn && addProductModal) {
            cancelAddProductBtn.addEventListener('click', () => {
                addProductModal.style.display = 'none';
            });
        }
        if (addProductModal) {
            addProductModal.addEventListener('click', (e) => {
                if (e.target === addProductModal) addProductModal.style.display = 'none';
            });
        }

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
                    if (addProductModal) addProductModal.style.display = 'none';
                    loadAdminProducts();
                    loadDashboard();
                } catch (err) {
                    showAlert(`Failed to create product. Warning: ${err.message}`, 'error');
                }
            });
        }

        // Add Category Modal Bindings
        const openAddCategoryBtn = document.getElementById('open-add-category-modal-btn');
        const addCategoryModal = document.getElementById('add-category-modal');
        const closeAddCategoryBtn = document.getElementById('close-add-category-modal-btn');
        const cancelAddCategoryBtn = document.getElementById('cancel-add-category-btn');
        const addCategoryForm = document.getElementById('add-category-form');

        if (openAddCategoryBtn && addCategoryModal) {
            openAddCategoryBtn.addEventListener('click', () => {
                if (addCategoryForm) addCategoryForm.reset();
                addCategoryModal.style.display = 'flex';
            });
        }
        if (closeAddCategoryBtn && addCategoryModal) {
            closeAddCategoryBtn.addEventListener('click', () => {
                addCategoryModal.style.display = 'none';
            });
        }
        if (cancelAddCategoryBtn && addCategoryModal) {
            cancelAddCategoryBtn.addEventListener('click', () => {
                addCategoryModal.style.display = 'none';
            });
        }
        if (addCategoryModal) {
            addCategoryModal.addEventListener('click', (e) => {
                if (e.target === addCategoryModal) addCategoryModal.style.display = 'none';
            });
        }

        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const name = document.getElementById('add-category-name').value.trim();
                if (!name) return;
                try {
                    await api.createCategory({ categoryName: name });
                    showAlert('Category created successfully.', 'success');
                    addCategoryForm.reset();
                    if (addCategoryModal) addCategoryModal.style.display = 'none';
                    loadAdminCategories();
                    loadDashboard();
                } catch (err) {
                    showAlert(`Failed to create category: ${err.message}`, 'error');
                }
            });
        }

        // Edit Category Modal Bindings
        const closeCatBtn = document.getElementById('close-category-modal-btn');
        const cancelCatBtn = document.getElementById('cancel-category-edit-btn');
        const catModal = document.getElementById('edit-category-modal');
        const editCategoryForm = document.getElementById('edit-category-form');

        if (closeCatBtn && catModal) {
            closeCatBtn.addEventListener('click', () => { catModal.style.display = 'none'; });
        }
        if (cancelCatBtn && catModal) {
            cancelCatBtn.addEventListener('click', () => { catModal.style.display = 'none'; });
        }
        if (catModal) {
            catModal.addEventListener('click', function (e) {
                if (e.target === catModal) catModal.style.display = 'none';
            });
        }

        if (editCategoryForm) {
            editCategoryForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const id = document.getElementById('edit-category-id').value;
                const name = document.getElementById('edit-category-name').value.trim();
                try {
                    await api.updateCategory(id, { categoryName: name });
                    showAlert('Category updated successfully.', 'success');
                    if (catModal) catModal.style.display = 'none';
                    loadAdminCategories();
                    loadDashboard();
                } catch (err) {
                    showAlert(`Failed to update category: ${err.message}`, 'error');
                }
            });
        }

        // Edit Product Modal Bindings
        const closeModalBtn = document.getElementById('close-modal-btn');
        const editProductModal = document.getElementById('edit-product-modal');
        const editProductForm = document.getElementById('edit-product-form');

        if (closeModalBtn && editProductModal) {
            closeModalBtn.addEventListener('click', () => {
                editProductModal.style.display = "none";
            });
        }
        if (editProductModal) {
            editProductModal.addEventListener('click', function (e) {
                if (e.target === editProductModal) {
                    editProductModal.style.display = "none";
                }
            });
        }

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
                    if (editProductModal) editProductModal.style.display = "none";
                    loadAdminProducts();
                    loadDashboard();
                } catch (err) {
                    showAlert(`Failed to update product. Warning: ${err.message}`, 'error');
                }
            });
        }

        // Order Details Modal Bindings
        const closeOrderBtn = document.getElementById('close-order-modal-btn');
        const orderModal = document.getElementById('order-details-modal');
        if (closeOrderBtn && orderModal) {
            closeOrderBtn.addEventListener('click', () => {
                orderModal.style.display = 'none';
            });
        }
        if (orderModal) {
            orderModal.addEventListener('click', function (e) {
                if (e.target === orderModal) {
                    orderModal.style.display = 'none';
                }
            });
        }

        // Customer Profile Modal Bindings
        const closeCustomerBtn = document.getElementById('close-customer-modal-btn');
        const customerModal = document.getElementById('customer-profile-modal');
        if (closeCustomerBtn && customerModal) {
            closeCustomerBtn.addEventListener('click', () => {
                customerModal.style.display = 'none';
            });
        }
        if (customerModal) {
            customerModal.addEventListener('click', function (e) {
                if (e.target === customerModal) {
                    customerModal.style.display = 'none';
                }
            });
        }

        // Edit User Modal Backdrop Click Binding
        const editUserModal = document.getElementById('edit-user-modal');
        if (editUserModal) {
            editUserModal.addEventListener('click', function (e) {
                if (e.target === editUserModal) {
                    editUserModal.style.display = 'none';
                }
            });
        }

        // Admin Management Create Admin Modal Bindings
        const openCreateAdminBtn = document.getElementById('open-create-admin-modal-btn');
        const createAdminModal = document.getElementById('create-admin-modal');
        const closeCreateAdminBtn = document.getElementById('close-create-admin-modal-btn');
        const cancelCreateAdminBtn = document.getElementById('cancel-create-admin-btn');
        const createAdminForm = document.getElementById('create-admin-form');

        const closeCreateAdminModal = () => {
            if (createAdminModal) createAdminModal.style.display = 'none';
        };

        if (openCreateAdminBtn && createAdminModal) {
            openCreateAdminBtn.addEventListener('click', () => {
                if (createAdminForm) createAdminForm.reset();
                createAdminModal.style.display = 'flex';
            });
        }

        if (closeCreateAdminBtn) closeCreateAdminBtn.addEventListener('click', closeCreateAdminModal);
        if (cancelCreateAdminBtn) cancelCreateAdminBtn.addEventListener('click', closeCreateAdminModal);
        if (createAdminModal) {
            createAdminModal.addEventListener('click', (e) => {
                if (e.target === createAdminModal) closeCreateAdminModal();
            });
        }

        if (createAdminForm) {
            createAdminForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const fullName = document.getElementById('admin-fullname-input').value.trim();
                const email = document.getElementById('admin-email-input').value.trim();
                const password = document.getElementById('admin-password-input').value;
                const confirmPassword = document.getElementById('admin-confirm-password-input').value;

                if (!fullName || !email || !password || !confirmPassword) {
                    showAlert('Please fill in all required fields.', 'error');
                    return;
                }

                if (password.length < 6) {
                    showAlert('Password must be at least 6 characters.', 'error');
                    return;
                }

                if (password !== confirmPassword) {
                    showAlert('Passwords do not match.', 'error');
                    return;
                }

                const submitBtn = document.getElementById('submit-create-admin-btn');
                const origText = submitBtn ? submitBtn.textContent : 'Create Admin';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Creating...';
                }

                try {
                    await api.createAdmin({ fullName, email, password, confirmPassword });
                    showAlert(`Admin "${fullName}" created successfully!`, 'success');
                    closeCreateAdminModal();
                    createAdminForm.reset();
                    loadAdminManagement();
                } catch (err) {
                    showAlert(`Failed to create admin: ${err.message}`, 'error');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = origText;
                    }
                }
            });
        }

        // Store Settings Form Bindings
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

        // Simple hash router for navbar navigation links
        function handleHashChange() {
            setupRoleBasedSidebar();
            const hash = window.location.hash;
            if (!hash || hash === '#' || hash === '#dashboard') {
                const btn = document.getElementById('dashboard-btn');
                if (btn && !btn.classList.contains('active')) btn.click();
                return;
            }

            let page = hash.substring(1).toLowerCase();
            if (page === 'users') {
                page = 'customers';
            }

            const btn = document.getElementById(page + "-btn");
            if (btn && btn.style.display !== 'none') {
                btn.click();
            } else {
                const dashBtn = document.getElementById('dashboard-btn');
                if (dashBtn) dashBtn.click();
            }
        }

        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('load', setupRoleBasedSidebar);
        window.addEventListener('pageshow', setupRoleBasedSidebar);
        if (window.location.hash) {
            setTimeout(handleHashChange, 100);
        }

        applyAdminBanner();

        // Default page load
        loadDashboard();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminDashboard);
    } else {
        initAdminDashboard();
    }

    // Global helper functions for inline event handlers and window scope
    window.editProduct = editProduct;
    window.editCustomer = editCustomer;
    window.editUser = editCustomer;
    window.saveUserEdit = saveUserEdit;
    window.closeEditModal = closeEditModal;
    window.deleteCustomer = deleteCustomer;
    window.deleteUser = deleteCustomer;
    window.viewCustomerProfile = async function (userId) {
        if (!userId) return;
        let customer = (allCachedUsers || []).find(u => Number(u.userId || u.id) === Number(userId));
        if (!customer) {
            try {
                const res = await api.getUserProfile(userId);
                customer = (res && res.data && typeof res.data === 'object') ? res.data : res;
            } catch (e) {
                console.warn('Could not fetch user profile by ID:', e);
            }
        }
        if (customer) {
            showCustomerProfileModal(customer);
        } else {
            showAlert(`Customer #${userId} record not found.`, 'error');
        }
    };
    window.showCustomerProfileModal = showCustomerProfileModal;
    window.loadStoreSettingsForm = loadStoreSettingsForm;
    window.applyAdminBanner = applyAdminBanner;

})();
