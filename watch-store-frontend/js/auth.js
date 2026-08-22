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
        if (!claims) return;
        const rawRole = claims.role || claims.roles || claims.authorities;
        const extracted = Array.isArray(rawRole) ? rawRole[0] : rawRole;
        const normalized = normalizeRole(extracted);
        if (normalized) {
            localStorage.setItem('role', normalized);
        }
    }

    window.auth = {
        getToken: () => localStorage.getItem('token'),
        getUserId: () => {
            const claims = getJwtClaims();
            if (claims && (claims.userId !== undefined && claims.userId !== null)) {
                return claims.userId;
            }
            if (claims && (claims.id !== undefined && claims.id !== null)) {
                return claims.id;
            }
            const stored = localStorage.getItem('userId');
            return stored ? parseInt(stored, 10) : null;
        },
        getUserRole: () => {
            const role = normalizeRole(localStorage.getItem('role'));
            if (role) return role;
            restoreRoleFromToken();
            return normalizeRole(localStorage.getItem('role')) || 'CUSTOMER';
        },
        getUser: () => ({
            userId: window.auth.getUserId(),
            username: localStorage.getItem('username'),
            email: localStorage.getItem('email'),
            role: window.auth.getUserRole()
        }),
        isAuthenticated: () => !!localStorage.getItem('token'),
        isAdmin: () => window.auth.getUserRole() === 'ADMIN',
        logout: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('user');
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('role');
            localStorage.removeItem('userRole');
            localStorage.removeItem('user_role');
            sessionStorage.clear();
            window.location.href = './login.html';
        },
        checkRouteGuard: () => {
            const token = localStorage.getItem('token');
            const role = window.auth.getUserRole();
            const path = window.location.pathname.toLowerCase();

            const isCart = path.includes('cart.html');
            const isCheckout = path.includes('checkout.html');
            const isOrders = path.includes('orders.html') || path.includes('order-details.html');
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
            const resendOtpBtn = document.getElementById('resend-otp-btn');
            const devOtpIndicator = document.getElementById('dev-otp-indicator');

            let sessionEmail = '';

            // Handle credential submit
            loginForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const email = emailInput ? emailInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value : '';

                if (!email || !password) {
                    if (window.showToast) {
                        window.showToast.error('Login failed', 'Please enter both email and password.');
                    } else {
                        showAlert('Please enter both email and password.', 'error');
                    }
                    return;
                }

                // 1. Immediately show loading toast
                if (window.showToast) {
                    window.showToast.loading('Signing you in...');
                }

                try {
                    const isAdminLogin = window.location.pathname.toLowerCase().includes("admin-login.html");
                    const role = isAdminLogin ? "ADMIN" : "CUSTOMER";

                    const response = await api.login(email, password, role);

                    if (!response || !response.success || !response.data) {
                        // 2. Invalid Credentials
                        if (window.showToast) {
                            window.showToast.error('Login failed', 'Invalid email or password. Please try again.');
                        } else {
                            showAlert('Invalid email or password. Please try again.', 'error');
                        }
                        return;
                    }

                    sessionEmail = email;

                    // Customers direct login flow
                    if (role === 'CUSTOMER') {
                        if (response.data.role !== 'CUSTOMER' || !response.data.token) {
                            if (window.showToast) {
                                window.showToast.error('Login failed', 'Invalid email or password. Please try again.');
                            } else {
                                showAlert('Customer login could not be completed.', 'error');
                            }
                            return;
                        }

                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('username', response.data.username || '');
                        localStorage.setItem('email', response.data.email || '');
                        localStorage.setItem('role', response.data.role);

                        const claims = getJwtClaims();
                        if (claims && (claims.userId !== undefined && claims.userId !== null)) {
                            localStorage.setItem('userId', String(claims.userId));
                        } else if (claims && (claims.id !== undefined && claims.id !== null)) {
                            localStorage.setItem('userId', String(claims.id));
                        } else if (response.data.userId || response.data.id) {
                            localStorage.setItem('userId', String(response.data.userId || response.data.id));
                        }

                        // 3 & 9. Final Welcome Back Toast (No customer name)
                        if (window.showToast) {
                            window.showToast.success('Welcome back!', 'Login successful. Redirecting you to TimeVerse...');
                        } else {
                            showAlert('Login successful!', 'success');
                        }

                        setTimeout(() => {
                            window.location.href = './index.html';
                        }, 1000);
                        return;
                    }

                    if (role === 'ADMIN') {
                        if (response.data.role !== 'ADMIN' || !response.data.token) {
                            if (window.showToast) {
                                window.showToast.error('Login failed', 'Invalid email or password. Please try again.');
                            } else {
                                showAlert('Admin login could not be completed.', 'error');
                            }
                            return;
                        }

                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('username', response.data.username || '');
                        localStorage.setItem('email', response.data.email || '');
                        localStorage.setItem('role', response.data.role);

                        const claims = getJwtClaims();
                        if (claims && (claims.userId !== undefined && claims.userId !== null)) {
                            localStorage.setItem('userId', String(claims.userId));
                        } else if (claims && (claims.id !== undefined && claims.id !== null)) {
                            localStorage.setItem('userId', String(claims.id));
                        } else if (response.data.userId || response.data.id) {
                            localStorage.setItem('userId', String(response.data.userId || response.data.id));
                        }

                        if (window.showToast) {
                            window.showToast.success('Welcome back!', 'Login successful. Redirecting to Admin Dashboard...');
                        } else {
                            showAlert('Admin login successful!', 'success');
                        }

                        setTimeout(() => {
                            window.location.href = './admin.html';
                        }, 1000);
                        return;
                    }

                    // 4. Fallback OTP Screen if required by backend
                    if (window.showToast) {
                        window.showToast.info('OTP sent successfully!', 'Please check your email and enter the OTP.');
                    } else {
                        showAlert('OTP sent successfully! Please check your email.', 'success');
                    }
                    if (credentialsSection) credentialsSection.style.display = 'none';
                    if (otpSection) otpSection.style.display = 'block';

                    if (devOtpIndicator) {
                        devOtpIndicator.style.display = 'none';
                    }
                    if (otpInput) otpInput.value = '';
                } catch (err) {
                    console.error("LOGIN ERROR - caught error:", err);
                    // 2. Clean error message without technical API jargon
                    if (window.showToast) {
                        window.showToast.error('Login failed', 'Invalid email or password. Please try again.');
                    } else {
                        showAlert('Invalid email or password. Please try again.', 'error');
                    }
                }
            });

            // Handle OTP submit
            if (otpForm) {
                otpForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const otp = otpInput ? otpInput.value.trim() : '';

                    if (!otp) {
                        if (window.showToast) {
                            window.showToast.error('Invalid OTP', 'Please enter the 6-digit verification code.');
                        } else {
                            showAlert('Please enter the 6-digit verification code.', 'error');
                        }
                        return;
                    }

                    // 4. Verifying OTP loading toast
                    if (window.showToast) {
                        window.showToast.loading('Verifying OTP...');
                    }

                    try {
                        const response = await api.verifyLoginOtp(sessionEmail, otp);
                        if (response && response.success && response.data) {
                            // 5. Correct OTP
                            if (window.showToast) {
                                window.showToast.success('OTP verified successfully!');
                            }

                            // Save details to localStorage
                            localStorage.setItem('token', response.data.token);
                            localStorage.setItem('username', response.data.username || '');
                            localStorage.setItem('email', response.data.email || '');
                            localStorage.setItem('role', response.data.role);

                            const claims = getJwtClaims();
                            if (claims && (claims.userId !== undefined && claims.userId !== null)) {
                                localStorage.setItem('userId', String(claims.userId));
                            } else if (claims && (claims.id !== undefined && claims.id !== null)) {
                                localStorage.setItem('userId', String(claims.id));
                            }

                            setTimeout(() => {
                                const isAdminLogin = window.location.pathname.includes("admin-login.html");

                                if (isAdminLogin) {
                                    if (response.data.role !== "ADMIN") {
                                        if (window.showToast) {
                                            window.showToast.error('Access denied', 'Only Admin can login here.');
                                        }
                                        localStorage.clear();
                                        setTimeout(() => {
                                            window.location.href = "./login.html";
                                        }, 1200);
                                        return;
                                    }
                                    if (window.showToast) {
                                        window.showToast.success('Welcome back!', 'Login successful. Redirecting to Admin Dashboard...');
                                    }
                                    setTimeout(() => {
                                        window.location.href = "./admin.html";
                                    }, 1000);
                                } else {
                                    if (response.data.role !== "CUSTOMER") {
                                        if (window.showToast) {
                                            window.showToast.error('Access denied', 'Please use admin login page for admin account.');
                                        }
                                        localStorage.clear();
                                        setTimeout(() => {
                                            window.location.href = "./login.html";
                                        }, 1200);
                                        return;
                                    }
                                    // 9. Final Welcome Back Toast
                                    if (window.showToast) {
                                        window.showToast.success('Welcome back!', 'Login successful. Redirecting you to TimeVerse...');
                                    }
                                    setTimeout(() => {
                                        window.location.href = "./index.html";
                                    }, 1000);
                                }
                            }, 600);
                        } else {
                            const errorMsg = (response && response.message) ? response.message.toLowerCase() : '';
                            if (errorMsg.includes('expired') || errorMsg.includes('expire')) {
                                if (window.showToast) {
                                    window.showToast.error('OTP expired', 'Please request a new OTP.');
                                }
                            } else {
                                if (window.showToast) {
                                    window.showToast.error('Invalid OTP', 'Please check the OTP and try again.');
                                }
                            }
                        }
                    } catch (err) {
                        const errMsg = (err && err.message) ? err.message.toLowerCase() : '';
                        if (errMsg.includes('expired') || errMsg.includes('expire')) {
                            if (window.showToast) {
                                window.showToast.error('OTP expired', 'Please request a new OTP.');
                            } else {
                                showAlert('OTP expired. Please request a new OTP.', 'error');
                            }
                        } else {
                            if (window.showToast) {
                                window.showToast.error('Invalid OTP', 'Please check the OTP and try again.');
                            } else {
                                showAlert('Invalid OTP. Please check the OTP and try again.', 'error');
                            }
                        }
                    }
                });
            }

            // Handle Resend OTP
            if (resendOtpBtn) {
                resendOtpBtn.addEventListener('click', async function (e) {
                    e.preventDefault();
                    if (!sessionEmail) {
                        if (window.showToast) {
                            window.showToast.error('Resend failed', 'Please return to login and re-enter your credentials.');
                        }
                        return;
                    }

                    // 8. Resend OTP Loading
                    if (window.showToast) {
                        window.showToast.loading('Sending a new OTP...');
                    }

                    try {
                        if (window.api && typeof window.api.resendRegistrationOtp === 'function') {
                            await window.api.resendRegistrationOtp(sessionEmail);
                        }
                        // 8. Successful Resend
                        if (window.showToast) {
                            window.showToast.success('New OTP sent successfully!', 'Please check your email for the new code.');
                        }
                    } catch (err) {
                        const errMsg = (err && err.message) ? err.message.toLowerCase() : '';
                        if (errMsg.includes('expired')) {
                            if (window.showToast) {
                                window.showToast.error('OTP expired', 'Please request a new OTP.');
                            }
                        } else {
                            if (window.showToast) {
                                window.showToast.error('Resend failed', 'Unable to send a new OTP. Please try again.');
                            }
                        }
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
