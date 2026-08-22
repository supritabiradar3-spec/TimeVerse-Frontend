// TimeVerse Cancel Order Reusable Modal Component
(function () {
    window.isOrderCancellable = function (order) {
        if (!order || !order.status) return false;
        const status = order.status.toUpperCase().replace(/\s+/g, '_');
        const nonCancellable = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
        return !nonCancellable.includes(status);
    };

    window.openCancelOrderModal = function (order, onSuccess) {
        if (!order) return;
        const orderId = order.orderId || order.id;

        // Check if modal container already exists, otherwise create
        let modalEl = document.getElementById('cancel-order-modal-overlay');
        if (modalEl) modalEl.remove();

        const isLightTheme = document.body.classList.contains('light-theme');

        modalEl = document.createElement('div');
        modalEl.id = 'cancel-order-modal-overlay';
        modalEl.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        modalEl.innerHTML = `
            <div class="cancel-order-modal-card" style="
                background: ${isLightTheme ? '#FFFFFF' : '#141416'};
                color: ${isLightTheme ? '#111827' : '#FFFFFF'};
                border: 1px solid ${isLightTheme ? '#E5E7EB' : 'rgba(197,160,89,0.25)'};
                border-radius: 10px;
                max-width: 440px;
                width: 100%;
                padding: 24px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                box-sizing: border-box;
                position: relative;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
                    <div>
                        <h3 style="font-family: var(--font-title); font-size: 1.2rem; font-weight: 700; color: ${isLightTheme ? '#1F3A5F' : '#E8D7B3'}; margin: 0 0 2px 0;">Cancel Order</h3>
                        <span style="font-size: 0.78rem; color: #C5A059; font-weight: 600;">Order #TV-ORD-${orderId}</span>
                    </div>
                    <button type="button" id="cancel-modal-close-x" style="background: none; border: none; font-size: 1.4rem; color: #6B7280; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
                </div>

                <p style="font-size: 0.85rem; font-weight: 600; color: ${isLightTheme ? '#374151' : '#E5E7EB'}; margin: 0 0 12px 0;">
                    Why do you want to cancel this order?
                </p>

                <form id="cancel-order-form">
                    <div style="display: flex; flex-direction: column; gap: 9px; margin-bottom: 14px;">
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Changed my mind" required style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Changed my mind</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Ordered by mistake" style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Ordered by mistake</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Found a better price" style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Found a better price</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Delivery is taking too long" style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Delivery is taking too long</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Product no longer required" style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Product no longer required</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: ${isLightTheme ? '#4B5563' : '#D1D5DB'}; cursor: pointer;">
                            <input type="radio" name="cancelReason" value="Other" id="radio-reason-other" style="accent-color: #1F3A5F; width: 16px; height: 16px;">
                            <span>Other</span>
                        </label>
                    </div>

                    <!-- Custom other input box (hidden by default) -->
                    <div id="other-reason-container" style="display: none; margin-bottom: 12px;">
                        <input type="text" id="other-reason-input" class="form-control" placeholder="Please specify your reason..." style="
                            width: 100%;
                            padding: 8px 12px;
                            font-size: 0.84rem;
                            border: 1px solid ${isLightTheme ? '#D1D5DB' : 'rgba(255,255,255,0.2)'};
                            background: ${isLightTheme ? '#FFFFFF' : '#1E1E22'};
                            color: ${isLightTheme ? '#111827' : '#FFFFFF'};
                            border-radius: 6px;
                            box-sizing: border-box;
                        ">
                    </div>

                    <!-- Additional feedback textarea -->
                    <div style="margin-bottom: 18px;">
                        <label for="cancel-feedback-input" style="display: block; font-size: 0.78rem; font-weight: 600; color: ${isLightTheme ? '#6B7280' : '#9CA3AF'}; margin-bottom: 4px;">
                            Additional feedback (optional)
                        </label>
                        <textarea id="cancel-feedback-input" rows="2" placeholder="Tell us more about why you are cancelling..." style="
                            width: 100%;
                            padding: 8px 12px;
                            font-size: 0.82rem;
                            border: 1px solid ${isLightTheme ? '#D1D5DB' : 'rgba(255,255,255,0.2)'};
                            background: ${isLightTheme ? '#FFFFFF' : '#1E1E22'};
                            color: ${isLightTheme ? '#111827' : '#FFFFFF'};
                            border-radius: 6px;
                            box-sizing: border-box;
                            resize: vertical;
                            font-family: inherit;
                        "></textarea>
                    </div>

                    <!-- Action buttons -->
                    <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
                        <button type="button" id="btn-keep-order" class="btn-luxury" style="padding: 8px 18px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                            Keep Order
                        </button>
                        <button type="submit" id="btn-confirm-cancel" class="btn-luxury btn-luxury-solid" style="padding: 8px 18px; font-size: 0.8rem; font-weight: 600; cursor: pointer; background-color: #DC2626; border-color: #DC2626;">
                            Confirm Cancellation
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modalEl);

        // Fade in
        requestAnimationFrame(() => {
            modalEl.style.opacity = '1';
        });

        // Toggle custom reason input on 'Other' selection
        const radioButtons = modalEl.querySelectorAll('input[name="cancelReason"]');
        const otherContainer = modalEl.querySelector('#other-reason-container');
        const otherInput = modalEl.querySelector('#other-reason-input');

        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'Other' && radio.checked) {
                    otherContainer.style.display = 'block';
                    otherInput.focus();
                } else {
                    otherContainer.style.display = 'none';
                }
            });
        });

        // Close modal helper
        const closeModal = () => {
            modalEl.style.opacity = '0';
            setTimeout(() => {
                modalEl.remove();
            }, 200);
        };

        modalEl.querySelector('#cancel-modal-close-x').addEventListener('click', closeModal);
        modalEl.querySelector('#btn-keep-order').addEventListener('click', closeModal);
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) closeModal();
        });

        // Handle form submission
        const form = modalEl.querySelector('#cancel-order-form');
        const confirmBtn = modalEl.querySelector('#btn-confirm-cancel');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectedRadio = modalEl.querySelector('input[name="cancelReason"]:checked');
            if (!selectedRadio) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert('Please select a cancellation reason.', 'error');
                } else {
                    alert('Please select a cancellation reason.');
                }
                return;
            }

            let reason = selectedRadio.value;
            if (reason === 'Other') {
                const customVal = otherInput.value.trim();
                if (!customVal) {
                    if (typeof window.showAlert === 'function') {
                        window.showAlert('Please specify your cancellation reason.', 'error');
                    } else {
                        alert('Please specify your cancellation reason.');
                    }
                    otherInput.focus();
                    return;
                }
                reason = customVal;
            }

            const feedback = modalEl.querySelector('#cancel-feedback-input').value.trim();
            const finalReason = feedback ? `${reason} (Note: ${feedback})` : reason;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 5px;">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#FFFFFF"></path>
                </svg>
                <span>Cancelling...</span>
            `;

            try {
                let response = null;
                if (window.api && typeof window.api.cancelOrder === 'function') {
                    response = await window.api.cancelOrder(orderId, finalReason);
                } else {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`https://timeverse-backend.onrender.com/api/orders/${orderId}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ reason: finalReason, cancellationReason: finalReason })
                    });
                    response = await res.json();
                }

                closeModal();

                if (typeof window.showAlert === 'function') {
                    window.showAlert(`Order #TV-ORD-${orderId} has been cancelled successfully.`, 'success');
                }

                if (typeof onSuccess === 'function') {
                    onSuccess(response && response.data ? response.data : response);
                }
            } catch (err) {
                console.error('Cancellation error:', err);
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm Cancellation';
                if (typeof window.showAlert === 'function') {
                    window.showAlert(err.message || 'Failed to cancel order. Please try again.', 'error');
                } else {
                    alert(err.message || 'Failed to cancel order. Please try again.');
                }
            }
        });
    };
})();
