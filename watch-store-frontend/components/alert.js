// TimeVerse Luxury Toast & Notification System
// Provides high-end feedback modals/toasts for customer authentication, OTP lifecycle, and actions.

(function () {
    let currentToast = null;
    let toastTimeout = null;

    // Inject Toast Styles dynamically
    function injectToastStyles() {
        if (document.getElementById('timeverse-toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'timeverse-toast-styles';
        style.textContent = `
            #timeverse-toast-container {
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
                max-width: 90vw;
                width: auto;
            }

            .timeverse-toast {
                pointer-events: auto;
                background: rgba(22, 21, 19, 0.96);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(168, 133, 72, 0.45);
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(168, 133, 72, 0.2);
                border-radius: 12px;
                padding: 14px 20px;
                min-width: 300px;
                max-width: 440px;
                display: flex;
                align-items: center;
                gap: 14px;
                color: #FFFFFF;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: tvToastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transition: opacity 0.25s ease, transform 0.25s ease;
            }

            .timeverse-toast.toast-hiding {
                animation: tvToastSlideOut 0.25s cubic-bezier(0.7, 0, 0.84, 0) forwards;
            }

            @keyframes tvToastSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.96);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes tvToastSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-16px) scale(0.96);
                }
            }

            .toast-icon-wrap {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
                font-weight: 700;
            }

            .toast-icon-success {
                background: rgba(46, 125, 50, 0.25);
                border: 1px solid rgba(76, 175, 80, 0.5);
                color: #81C784;
            }

            .toast-icon-error {
                background: rgba(198, 40, 40, 0.25);
                border: 1px solid rgba(229, 57, 53, 0.5);
                color: #E57373;
            }

            .toast-icon-info {
                background: rgba(168, 133, 72, 0.25);
                border: 1px solid rgba(197, 160, 89, 0.5);
                color: var(--gold-light, #E8D7B3);
            }

            .toast-icon-loading {
                background: rgba(168, 133, 72, 0.15);
                border: 1px solid rgba(168, 133, 72, 0.35);
            }

            .toast-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(168, 133, 72, 0.3);
                border-top-color: var(--gold-light, #E8D7B3);
                border-radius: 50%;
                animation: tvToastSpin 0.75s linear infinite;
            }

            @keyframes tvToastSpin {
                to { transform: rotate(360deg); }
            }

            .toast-content {
                flex: 1;
                text-align: left;
                min-width: 0;
            }

            .toast-title {
                font-family: 'Cinzel', 'Outfit', Georgia, serif;
                font-size: 0.95rem;
                font-weight: 700;
                color: #FAF9F6;
                letter-spacing: 0.3px;
                margin-bottom: 2px;
            }

            .toast-message {
                font-size: 0.85rem;
                color: #D1D5DB;
                line-height: 1.35;
                word-wrap: break-word;
            }

            .toast-title:empty, .toast-message:empty {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Ensure container exists
    function getContainer() {
        injectToastStyles();
        let container = document.getElementById('timeverse-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'timeverse-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Core Toast Renderer
    function renderToast(options) {
        const { type = 'info', title = '', message = '', duration = 3000 } = options;
        const container = getContainer();

        // Clear existing timer and remove previous toast immediately to prevent duplicates
        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toastTimeout = null;
        }

        if (currentToast && currentToast.parentElement) {
            currentToast.remove();
            currentToast = null;
        }

        const toastEl = document.createElement('div');
        toastEl.className = `timeverse-toast toast-${type}`;

        // Build Icon
        let iconHTML = '';
        if (type === 'loading') {
            iconHTML = `<div class="toast-icon-wrap toast-icon-loading"><div class="toast-spinner"></div></div>`;
        } else if (type === 'success') {
            iconHTML = `<div class="toast-icon-wrap toast-icon-success">✓</div>`;
        } else if (type === 'error') {
            iconHTML = `<div class="toast-icon-wrap toast-icon-error">✕</div>`;
        } else {
            iconHTML = `<div class="toast-icon-wrap toast-icon-info">ℹ</div>`;
        }

        // Build Text
        const titleHTML = title ? `<div class="toast-title">${escapeHTML(title)}</div>` : '';
        const msgHTML = message ? `<div class="toast-message">${escapeHTML(message)}</div>` : '';

        toastEl.innerHTML = `
            ${iconHTML}
            <div class="toast-content">
                ${titleHTML}
                ${msgHTML}
            </div>
        `;

        container.appendChild(toastEl);
        currentToast = toastEl;

        // Auto-dismiss if duration > 0 and not loading
        if (duration > 0 && type !== 'loading') {
            toastTimeout = setTimeout(() => {
                dismissToast(toastEl);
            }, duration);
        }

        return toastEl;
    }

    function dismissToast(toastEl) {
        if (!toastEl) toastEl = currentToast;
        if (!toastEl) return;

        toastEl.classList.add('toast-hiding');
        setTimeout(() => {
            if (toastEl.parentElement) {
                toastEl.remove();
            }
            if (currentToast === toastEl) {
                currentToast = null;
            }
        }, 250);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Public Toast API
    window.showToast = {
        success: function (title, message, duration = 2800) {
            if (!message && title) {
                return renderToast({ type: 'success', title: title, message: '', duration });
            }
            return renderToast({ type: 'success', title, message, duration });
        },
        error: function (title, message, duration = 4200) {
            if (!message && title) {
                return renderToast({ type: 'error', title: title, message: '', duration });
            }
            return renderToast({ type: 'error', title, message, duration });
        },
        loading: function (title, message = '') {
            return renderToast({ type: 'loading', title, message, duration: 0 });
        },
        info: function (title, message, duration = 3200) {
            if (!message && title) {
                return renderToast({ type: 'info', title: title, message: '', duration });
            }
            return renderToast({ type: 'info', title, message, duration });
        },
        dismiss: function () {
            dismissToast();
        }
    };

    // Universal helper function for backward compatibility
    window.showAlert = function (arg1, arg2 = 'info', arg3 = null, arg4 = null) {
        let title = '';
        let message = '';
        let type = 'info';
        let duration = 3000;

        if (typeof arg1 === 'string' && (arg2 === 'success' || arg2 === 'error' || arg2 === 'loading' || arg2 === 'info')) {
            // Signature: showAlert(message, type, [title], [duration])
            type = arg2;
            if (arg3 && typeof arg3 === 'string') {
                title = arg3;
                message = arg1;
            } else {
                title = arg1;
                message = '';
            }
            duration = (typeof arg4 === 'number') ? arg4 : (type === 'error' ? 4200 : 2800);
        } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
            // Signature: showAlert(title, message, [type], [duration])
            title = arg1;
            message = arg2;
            type = (arg3 === 'success' || arg3 === 'error' || arg3 === 'loading' || arg3 === 'info') ? arg3 : 'info';
            duration = (typeof arg4 === 'number') ? arg4 : (type === 'error' ? 4200 : 2800);
        } else {
            title = String(arg1 || '');
            message = '';
            type = 'info';
        }

        return renderToast({ type, title, message, duration });
    };

})();
