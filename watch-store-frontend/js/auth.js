// Session, JWT, and Route Guards Logic for TimeVerse

(function () {
    function normalizeRole(rawRole) {
        const role = String(rawRole || '').trim();
        if (!role) return null;
        const normalized = role.toUpperCase().replace(/^ROLE_/, '');
        return normalized === 'ADMIN' || normalized === 'CUSTOMER' ? normalized : null;
    }

    function getJwtClaims() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error decoding JWT token:', e);
            return null;
        }
    }

    function restoreRoleFromToken() {
        const claims = getJwtClaims();
        const roleFromToken = claims && claims.role ? normalizeRole(claims.role) : null;
        if (roleFromToken) {
            localStorage.setItem('role', roleFromToken);
        }
        return roleFromToken;
    }

    window.auth = {
        isAuthenticated: () => {
            return !!localStorage.getItem('token');
        },

        getUserId: () => {
            const claims = getJwtClaims();
            return claims ? claims.userId : null;
        },

        getUserRole: () => {
            const storedRole = normalizeRole(localStorage.getItem('role'));
            if (storedRole) return storedRole;
            return restoreRoleFromToken();
        },

        getUsername: () => {
            return localStorage.getItem('username') || null;
        },

        getEmail: () => {
            return localStorage.getItem('email') || null;
        },

        checkRouteGuard: () => {
            const path = window.location.pathname;
            const token = localStorage.getItem('token');
            const role = window.auth.getUserRole();

            const isCart = path.includes('cart.html');
            const isCheckout = path.includes('checkout.html');
            const isOrders = path.includes('orders.html');
            const isAdmin = path.includes('admin.html');
            const isCustomerProtected = path.includes('wishlist.html') || path.includes('profile.html') || path.includes('settings.html');
            const isAuthPage = path.includes('login.html') || path.includes('register.html') || path.includes('admin-login.html');

            if (!token) {
                if (isCart || isCheckout || isOrders || isAdmin || isCustomerProtected) {
                    window.location.href = './login.html';
                    return;
                }
                return;
            }

            if (isAuthPage) {
                if (role === 'ADMIN') {
                    window.location.href = './admin.html';
                    return;
                }
                window.location.href = './index.html';
                return;
            }

            if (isAdmin && role !== 'ADMIN') {
                if (typeof window.showAlert === 'function') {
                    window.showAlert('Access Denied: Admins Only', 'error');
                }
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 800);
                return;
            }

            if ((isCart || isCheckout || isOrders || isCustomerProtected) && role === 'ADMIN') {
                if (typeof window.showAlert === 'function') {
                    window.showAlert('Admins are redirected to the dashboard.', 'error');
                }
                setTimeout(() => {
                    window.location.href = './admin.html';
                }, 800);
            }
        }
    };

    window.logout = async function () {
        try {
            if (window.api && typeof window.api.logout === 'function') {
                await window.api.logout();
            }
        } catch (err) {
            console.warn('Backend logout failed:', err);
        }

        localStorage.clear();
        sessionStorage.clear();

        if (typeof window.showAlert === 'function') {
            window.showAlert('Logged out successfully.', 'success');
        }

        setTimeout(() => {
            window.location.replace('./login.html');
        }, 500);
    };
    // Execute route guard automatically on script load
    auth.checkRouteGuard();

    // Login and register page handlers
    document.addEventListener('DOMContentLoaded', function () {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        // LOGIN FORM FLOW
        if (loginForm) {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const credentialsSection = document.getElementById('credentials-section');
            const otpSection = document.getElementById('otp-section');
            const otpInput = document.getElementById('otp');
            const otpForm = document.getElementById('otp-form');
            const devOtpIndicator = document.getElementById('dev-otp-indicator');

            let sessionEmail = '';

            // Handle credential submit
            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const email = emailInput.value.trim();
                const password = passwordInput.value;

                console.log("LOGIN SUBMIT - email:", email, "role determined by path:", window.location.pathname);

                if (!email || !password) {
                    showAlert('Please enter both email and password.', 'error');
                    return;
                }

                try {
                    const isAdminLogin = window.location.pathname.toLowerCase().includes("admin-login.html");

                    const role = isAdminLogin ? "ADMIN" : "CUSTOMER";

                    console.log("LOGIN REQUEST - sending role:", role);

                    const response = await api.login(email, password, role);
                    console.log("LOGIN RESPONSE - raw response:", response);

                    if (!response.success || !response.data) {
                        showAlert(response.message || 'Login failed.', 'error');
                        return;
                    }

                    sessionEmail = email;

                    // Customers are verified at registration, so they log in directly.
                    if (role === 'CUSTOMER') {
                        console.log("LOGIN SUCCESS - customer flow, token exists:", !!response.data.token);
                        if (response.data.role !== 'CUSTOMER' || !response.data.token) {
                            showAlert('Customer login could not be completed.', 'error');
                            return;
                        }

                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('username', response.data.username);
                        localStorage.setItem('email', response.data.email);
                        localStorage.setItem('role', response.data.role);

                        showAlert('Login successful!', 'success');
                        setTimeout(() => {
                            window.location.href = './index.html';
                        }, 700);
                        return;
                    }

                    if (role === 'ADMIN') {
                        console.log("LOGIN SUCCESS - admin flow, token exists:", !!response.data.token);

                        if (response.data.role !== 'ADMIN' || !response.data.token) {
                            showAlert('Admin login could not be completed.', 'error');
                            return;
                        }

                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('username', response.data.username);
                        localStorage.setItem('email', response.data.email);
                        localStorage.setItem('role', response.data.role);

                        showAlert('Admin login successful!', 'success');

                        setTimeout(() => {
                            window.location.href = './admin.html';
                        }, 700);

                        return;
                    }



                    console.log("LOGIN FALLBACK - showing OTP section");
                    // Fallback for other roles that might require a login OTP.
                    showAlert('Verification code sent to your email.', 'success');
                    credentialsSection.style.display = 'none';
                    otpSection.style.display = 'block';

                    if (devOtpIndicator) {
                        devOtpIndicator.style.display = 'none';
                    }
                    otpInput.value = '';
                } catch (err) {
                    console.error("LOGIN ERROR - caught error:", err);
                    showAlert(err.message || 'Invalid credentials or connection error.', 'error');
                }
            });

            // Handle OTP submit
            if (otpForm) {
                otpForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const otp = otpInput.value.trim();

                    if (!otp) {
                        showAlert('Please enter the 6-digit verification code.', 'error');
                        return;
                    }

                    try {
                        const response = await api.verifyLoginOtp(sessionEmail, otp);
                        if (response.success && response.data) {
                            showAlert('Login Successful!', 'success');

                            // Save details to localStorage
                            localStorage.setItem('token', response.data.token);
                            localStorage.setItem('username', response.data.username);
                            localStorage.setItem('email', response.data.email);
                            localStorage.setItem('role', response.data.role);

                            setTimeout(() => {
                                const isAdminLogin = window.location.pathname.includes("admin-login.html");

                                if (isAdminLogin) {

                                    // Admin login page
                                    if (response.data.role !== "ADMIN") {
                                        showAlert("Only Admin can login here.", "error");

                                        localStorage.clear();

                                        setTimeout(() => {
                                            window.location.href = "./login.html";
                                        }, 1500);

                                        return;
                                    }

                                    window.location.href = "./admin.html";

                                } else {

                                    // Customer login page
                                    if (response.data.role !== "CUSTOMER") {

                                        showAlert("Please use admin login page for admin account.", "error");

                                        localStorage.clear();

                                        setTimeout(() => {
                                            window.location.href = "./login.html";
                                        }, 1500);

                                        return;
                                    }

                                    window.location.href = "./index.html";

                                }
                            }, 1000);
                        } else {
                            showAlert(response.message || 'OTP verification failed.', 'error');
                        }
                    } catch (err) {
                        showAlert(err.message || 'Invalid OTP code.', 'error');
                    }
                });
            }
        }

        // REGISTER FORM FLOW
        if (registerForm) {
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            registerForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const username = usernameInput.value.trim();
                const email = emailInput.value.trim();
                const password = passwordInput.value;

                if (!username || !email || !password) {
                    showAlert('Please fill in all the required fields.', 'error');
                    return;
                }

                if (password.length < 6) {
                    showAlert('Password must be at least 6 characters long.', 'error');
                    return;
                }

                try {
                    const response = await api.register(username, email, password);
                    if (response.success) {
                        window.__registrationEmail = email;
                        const registerCard = registerForm.closest('.auth-card');
                        const otpSection = document.getElementById('registration-otp-section');

                        if (registerCard && otpSection) {
                            registerForm.style.display = 'none';
                            const title = registerCard.querySelector('h2');
                            if (title) title.style.display = 'none';
                            const subtitle = registerCard.querySelector('.auth-subtitle');
                            if (subtitle) subtitle.style.display = 'none';
                            const redirect = registerCard.querySelector('.auth-redirect');
                            if (redirect) redirect.style.display = 'none';
                            otpSection.style.display = 'block';
                        }

                        showAlert('Registration OTP sent. Verify your email to activate the account.', 'success');
                    } else {
                        showAlert(response.message || 'Registration failed.', 'error');
                    }
                } catch (err) {
                    showAlert(err.message || 'Email or Username already exists.', 'error');
                }
            });
        }

        // REGISTRATION OTP FLOW
        const registrationOtpForm = document.getElementById('registration-otp-form');
        if (registrationOtpForm) {
            registrationOtpForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const email = window.__registrationEmail;
                const otp = document.getElementById('registration-otp').value.trim();

                if (!email || !/^\d{6}$/.test(otp)) {
                    showAlert('Please enter the 6-digit OTP sent to your email.', 'error');
                    return;
                }

                try {
                    const response = await api.verifyRegistrationOtp(email, otp);
                    if (response.success) {
                        showAlert('Email verified. Your account is ready. Please log in.', 'success');
                        setTimeout(() => {
                            window.location.href = './login.html';
                        }, 1000);
                    } else {
                        showAlert(response.message || 'OTP verification failed.', 'error');
                    }
                } catch (err) {
                    showAlert(err.message || 'Invalid or expired registration OTP.', 'error');
                }
            });
        }
    });
})();
