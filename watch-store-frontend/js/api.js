// Centralized API Client for TimeVerse Backend

(function () {
    const BASE_URL = "https://timeverse-backend.onrender.com";


    function clearStoredSession() {
        ['token', 'username', 'email', 'role', 'userId', 'fullName'].forEach(key => localStorage.removeItem(key));
    }

    function isJwtExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !payload.exp || (payload.exp * 1000) <= Date.now();
        } catch (e) {
            return true;
        }
    }

    // Helper: Build query parameters string
    function buildQueryString(params) {
        if (!params) return '';
        const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '');
        if (keys.length === 0) return '';
        return '?' + keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    }

    // Central request handler
    async function request(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;

        // Setup headers
        options.headers = options.headers || {};
        if (!(options.body instanceof FormData)) {
            options.headers['Content-Type'] = 'application/json';
        }

        // Set Auth header only when the stored JWT is still usable.
        // This prevents an old token from turning normal customer requests into 403s.
        let token = localStorage.getItem('token');
        if (token && isJwtExpired(token)) {
            clearStoredSession();
            token = null;
        }
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        // Show loader only for important actions, not background loading
        if (
            typeof window.showLoader === 'function' &&
            !endpoint.includes('/products') &&
            !endpoint.includes('/categories')
        ) {
            window.showLoader();
        }
        try {
            const response = await fetch(url, options);

            // Handle expired/invalid sessions. Spring Security can return 401 or 403
            // after the JWT filter rejects an expired token, so handle both safely.
            if (response.status === 401 || response.status === 403) {
                const isAuthEndpoint = endpoint.startsWith('/api/auth/login') ||
                    endpoint.startsWith('/api/auth/register') ||
                    endpoint.startsWith('/api/auth/forgot-password') ||
                    endpoint.startsWith('/api/auth/verify-otp') ||
                    endpoint.startsWith('/api/auth/verify-login-otp') ||
                    endpoint.startsWith('/api/auth/verify-registration-otp') ||
                    endpoint.startsWith('/api/auth/resend-registration-otp') ||
                    endpoint.startsWith('/api/auth/reset-password');

                // Only clear the session for 403 when the token itself is expired.
                const expiredToken = token && isJwtExpired(token);
                if (response.status === 401 || expiredToken) {
                    clearStoredSession();
                    const isLoginPage = window.location.pathname.includes('login.html');
                    if (!isAuthEndpoint && !isLoginPage) {
                        if (typeof window.showAlert === 'function') {
                            window.showAlert('Your session expired. Please log in again.', 'error');
                        }
                        setTimeout(() => {
                            window.location.href = './login.html';
                        }, 900);
                    }
                }
                throw new Error(response.status === 403 ? 'Access denied. Please log in again.' : 'Unauthorized');
            }

            // If DELETE or empty response, check status
            if (response.status === 204) {
                return null;
            }

            const text = await response.text();
            let data = null;
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = text; // Return plain text if not JSON
                }
            }

            if (!response.ok) {
                // If backend returns a structured error wrapped in ApiResponse
                if (data && typeof data === 'object' && data.message) {
                    throw new Error(data.message);
                }
                throw new Error(data || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request error on ${endpoint}:`, error);
            throw error;
        } finally {

            if (
                typeof window.hideLoader === 'function' &&
                !endpoint.includes('/products') &&
                !endpoint.includes('/categories')
            ) {
                window.hideLoader();
            }

        }
    }

    // Expose API namespace
    window.api = {
        BASE_URL,
        // --- Authentication ---
        register: (username, email, password) => {
            return request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
        },

        login: (email, password, role) => {
            // A previous expired session must never interfere with a fresh login.
            clearStoredSession();
            return request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    role
                })
            });
        },
        verifyLoginOtp: (email, otp) => {
            return request('/api/auth/verify-login-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            });
        },
        verifyRegistrationOtp: (email, otp) => {
            return request('/api/auth/verify-registration-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            });
        },
        resendRegistrationOtp: (email) => {
            return request('/api/auth/resend-registration-otp', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        },

        logout: () => {
            const authHeader = `Bearer ${localStorage.getItem('token')}`;
            return request('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': authHeader }
            });
        },

        forgotPassword: (email) => {
            return request('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        },

        verifyPasswordOtp: (email, otp) => {
            return request('/api/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            });
        },

        resetPassword: (email, newPassword) => {
            return request('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email, newPassword })
            });
        },

        changePassword: (oldPassword, newPassword) => {
            return request('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword, newPassword })
            });
        },

        getUserProfile: (userId) => {
            return request(`/api/auth/profile/${userId}`);
        },
        getAllUsers: () => request('/api/auth/users', { cache: 'no-store' }),

        updateUserProfile: (userId, profileData) => {
            return request(`/api/auth/profile/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        },

        getWishlist: () => {
            return request('/api/wishlist');
        },

        addToWishlist: (productId) => {
            return request(`/api/wishlist/${productId}`, {
                method: 'POST'
            });
        },

        removeFromWishlist: (productId) => {
            return request(`/api/wishlist/${productId}`, {
                method: 'DELETE'
            });
        },

        getWishlistCount: () => {
            return request('/api/wishlist/count');
        },

        deleteAccount: (userId) => {
            return request(`/api/auth/delete/${userId}`, {
                method: 'DELETE'
            });
        },

        // --- Categories ---
        getCategories: () => {
            return request('/api/categories');
        },
        createCategory: (categoryData) => {
            return request('/api/categories', {
                method: 'POST',
                body: JSON.stringify(categoryData)
            });
        },
        updateCategory: (id, categoryData) => {
            return request(`/api/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(categoryData)
            });
        },
        deleteCategory: (id) => {
            return request(`/api/categories/${id}`, {
                method: 'DELETE'
            });
        },

        // --- Products ---
        getAllProducts: () => {
            return request('/api/products');
        },

        getProductById: (id) => {
            return request(`/api/products/${id}`);
        },

        filterProducts: (filters) => {
            const query = buildQueryString(filters);
            return request(`/api/products/filter${query}`);
        },

        // Admin Product CRUD (Expected to be implemented on backend)
        createProduct: (productDto) => {
            return request('/api/products', {
                method: 'POST',
                body: JSON.stringify(productDto)
            });
        },

        updateProduct: (id, productDto) => {
            return request(`/api/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productDto)
            });
        },

        deleteProduct: (id) => {
            return request(`/api/products/${id}`, {
                method: 'DELETE'
            });
        },

        // --- Cart ---
        getCart: () => {
            return request('/api/cart');
        },

        getCartCount: () => {
            return request('/api/cart/count');
        },

        addToCart: (productId, quantity) => {
            return request('/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: parseInt(productId), quantity: parseInt(quantity) })
            });
        },

        updateCart: (productId, quantity) => {
            return request(`/api/cart/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: parseInt(quantity) })
            });
        },

        removeFromCart: (productId) => {
            return request(`/api/cart/${productId}`, {
                method: 'DELETE'
            });
        },

        // --- Addresses ---
        getAddresses: () => request('/api/addresses'),
        addAddress: (address) => request('/api/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        }),
        updateAddress: (addressId, address) => request(`/api/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(address)
        }),
        deleteAddress: (addressId) => request(`/api/addresses/${addressId}`, {
            method: 'DELETE'
        }),
        setDefaultAddress: (addressId) => request(`/api/addresses/${addressId}/default`, {
            method: 'PUT'
        }),

        // --- Reviews ---
        getUserReviews: () => request('/api/reviews/user'),
        getProductReviews: (productId) => request(`/api/reviews/product/${productId}`),
        checkReviewEligibility: (productId) => request(`/api/reviews/user/eligible/${productId}`),
        addReview: (productId, rating, comment) => request(`/api/reviews/product/${productId}`, {
            method: 'POST',
            body: JSON.stringify({ rating: Number(rating), comment })
        }),

        // --- Orders ---
        placeOrder: (userId, addressId, couponCode) => {
            const params = new URLSearchParams({ addressId: String(addressId) });
            if (couponCode) params.set('couponCode', couponCode);
            return request(`/api/orders/place/${userId}?${params.toString()}`, {
                method: 'POST'
            });
        },

        getUserOrders: (userId) => {
            return request(`/api/orders/user/${userId}`);
        },

        getAllOrders: () => request('/api/orders/all', { cache: 'no-store' }),

        updateOrderStatus: (orderId, status) => {
            return request(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        },

        // --- Payments ---
        createRazorpayOrder: (userId, orderId, amount) => {
            return request('/api/payments/create-order', {
                method: 'POST',
                body: JSON.stringify({ userId: parseInt(userId), orderId: parseInt(orderId), amount: parseFloat(amount) })
            });
        },

        verifyRazorpayPayment: (paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
            return request('/api/payments/verify', {
                method: 'POST',
                body: JSON.stringify({
                    paymentId: parseInt(paymentId),
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature
                })
            });
        },

        updatePaymentStatus: (paymentId, status) => {
            return request(`/api/payments/${paymentId}/status?status=${encodeURIComponent(status)}`, {
                method: 'PUT'
            });
        }
    };
})();
