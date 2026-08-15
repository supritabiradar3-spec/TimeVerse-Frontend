// Luxury Loader Component (Self-Contained Styling and Logic)

(function () {
    // Inject loader styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .luxury-loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background-color: rgba(17, 17, 17, 0.9);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.4s ease, visibility 0.4s ease;
        }
        
        .luxury-loader-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .luxury-spinner {
            width: 60px;
            height: 60px;
            border: 2px solid rgba(212, 175, 55, 0.1);
            border-radius: 50%;
            border-top-color: var(--gold, #D4AF37);
            animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            position: relative;
        }
        
        .luxury-spinner::after {
            content: '';
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            border: 2px solid rgba(212, 175, 55, 0.05);
            border-radius: 50%;
            border-top-color: var(--gold-light, #F3E5AB);
            animation: spin 2s linear infinite reverse;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Create and append the loader HTML structure
    const loaderContainer = document.createElement('div');
    loaderContainer.id = 'luxury-loader';
    loaderContainer.className = 'luxury-loader-overlay';
    loaderContainer.innerHTML = `<div class="luxury-spinner"></div>`;
    document.body.appendChild(loaderContainer);

    let activeRequestsCount = 0;
    let loaderTimeout = null;

    // Expose global methods
    window.showLoader = function () {
        activeRequestsCount++;
        loaderContainer.classList.add('active');

        // Auto-hide after 5 seconds as a safety fallback
        clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(function () {
            window.hideLoader();
        }, 5000);
    };

    window.hideLoader = function () {
        activeRequestsCount = 0;
        clearTimeout(loaderTimeout);
        loaderContainer.classList.remove('active');
    };

    // Auto-hide when page resource loading is complete
    window.addEventListener('load', function () {
        window.hideLoader();
    });
})();
