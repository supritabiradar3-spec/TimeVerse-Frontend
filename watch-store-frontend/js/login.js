// Login Controller Module for TimeVerse
// Integrates with window.auth and window.api to handle login form lifecycle,
// credential submission, role-based redirects, and OTP verification fallback.

(function () {
    /**
     * Initializes the login form and OTP verification handlers.
     * Prevents duplicate listener registration if auth.js or another initializer is active.
     */
    function initLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        // Guard against duplicate binding
        if (loginForm.dataset.loginBound === 'true') {
            return;
        }
        loginForm.dataset.loginBound = 'true';

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const credentialsSection = document.getElementById('credentials-section');
        const otpSection = document.getElementById('otp-section');
        const otpInput = document.getElementById('otp');
        const otpForm = document.getElementById('otp-form');
        const devOtpIndicator = document.getElementById('dev-otp-indicator');

        const resendOtpBtn = document.getElementById('resend-otp-btn');
        let sessionEmail = '';

        // Handle credentials submission
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
                const isAdminLogin = window.location.pathname.toLowerCase().includes('admin-login.html');
                const role = isAdminLogin ? 'ADMIN' : 'CUSTOMER';

                if (!window.api || typeof window.api.login !== 'function') {
                    throw new Error('Authentication service unavailable.');
                }

                const response = await window.api.login(email, password, role);

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

                // Customer direct login flow
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

                    const userId = (window.auth && typeof window.auth.getUserId === 'function')
                        ? window.auth.getUserId()
                        : (response.data.userId || response.data.id);
                    if (userId !== undefined && userId !== null) {
                        localStorage.setItem('userId', String(userId));
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

                // Admin direct login flow
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

                    const userId = (window.auth && typeof window.auth.getUserId === 'function')
                        ? window.auth.getUserId()
                        : (response.data.userId || response.data.id);
                    if (userId !== undefined && userId !== null) {
                        localStorage.setItem('userId', String(userId));
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

                // 4. Fallback OTP flow if required by role/backend
                if (window.showToast) {
                    window.showToast.info('OTP sent successfully!', 'Please check your email and enter the OTP.');
                } else {
                    showAlert('OTP sent successfully! Please check your email.', 'success');
                }
                if (credentialsSection) credentialsSection.style.display = 'none';
                if (otpSection) otpSection.style.display = 'block';
                if (devOtpIndicator) devOtpIndicator.style.display = 'none';
                if (otpInput) otpInput.value = '';

            } catch (err) {
                console.error('Login submission error:', err);
                // 2. Clean error message without technical API jargon
                if (window.showToast) {
                    window.showToast.error('Login failed', 'Invalid email or password. Please try again.');
                } else {
                    showAlert('Invalid email or password. Please try again.', 'error');
                }
            }
        });

        // Handle OTP submission
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
                    if (!window.api || typeof window.api.verifyLoginOtp !== 'function') {
                        throw new Error('OTP verification service unavailable.');
                    }

                    const response = await window.api.verifyLoginOtp(sessionEmail, otp);

                    if (response && response.success && response.data) {
                        // 5. Correct OTP
                        if (window.showToast) {
                            window.showToast.success('OTP verified successfully!');
                        }

                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('username', response.data.username || '');
                        localStorage.setItem('email', response.data.email || '');
                        localStorage.setItem('role', response.data.role);

                        const userId = (window.auth && typeof window.auth.getUserId === 'function')
                            ? window.auth.getUserId()
                            : (response.data.userId || response.data.id);
                        if (userId !== undefined && userId !== null) {
                            localStorage.setItem('userId', String(userId));
                        }

                        setTimeout(() => {
                            const isAdminLogin = window.location.pathname.includes('admin-login.html');
                            if (isAdminLogin) {
                                if (response.data.role !== 'ADMIN') {
                                    if (window.showToast) {
                                        window.showToast.error('Access denied', 'Only Admin can login here.');
                                    }
                                    localStorage.clear();
                                    setTimeout(() => {
                                        window.location.href = './login.html';
                                    }, 1200);
                                    return;
                                }
                                if (window.showToast) {
                                    window.showToast.success('Welcome back!', 'Login successful. Redirecting to Admin Dashboard...');
                                }
                                setTimeout(() => {
                                    window.location.href = './admin.html';
                                }, 1000);
                            } else {
                                if (response.data.role !== 'CUSTOMER') {
                                    if (window.showToast) {
                                        window.showToast.error('Access denied', 'Please use admin login page for admin account.');
                                    }
                                    localStorage.clear();
                                    setTimeout(() => {
                                        window.location.href = './login.html';
                                    }, 1200);
                                    return;
                                }
                                // 9. Final Welcome Back Toast
                                if (window.showToast) {
                                    window.showToast.success('Welcome back!', 'Login successful. Redirecting you to TimeVerse...');
                                }
                                setTimeout(() => {
                                    window.location.href = './index.html';
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

    // Expose login namespace
    window.login = {
        init: initLoginForm
    };

    // Auto-initialize when loaded and DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginForm);
    } else {
        initLoginForm();
    }
})();
