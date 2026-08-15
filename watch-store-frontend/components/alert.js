// Luxury Toast Alert Component (Self-Contained Styling and Logic)

(function () {
    // Inject alert styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .luxury-toast-container {
            position: fixed;
            top: 100px;
            right: 30px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 15px;
            pointer-events: none;
            max-width: 380px;
            width: 100%;
        }

        .luxury-toast {
            background-color: #181818;
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #FFFFFF;
            padding: 16px 24px;
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            pointer-events: auto;
            position: relative;
        }
        
        .luxury-toast.show {
            transform: translateX(0);
        }

        .luxury-toast::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 4px;
        }

        .luxury-toast-success {
            border-color: rgba(75, 181, 67, 0.4);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(75, 181, 67, 0.1);
        }
        
        .luxury-toast-success::before {
            background-color: #4BB543;
        }

        .luxury-toast-error {
            border-color: rgba(207, 102, 121, 0.4);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(207, 102, 121, 0.1);
        }
        
        .luxury-toast-error::before {
            background-color: #CF6679;
        }

        .luxury-toast-info {
            border-color: rgba(212, 175, 55, 0.4);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(212, 175, 55, 0.1);
        }
        
        .luxury-toast-info::before {
            background-color: #D4AF37;
        }

        .luxury-toast-close {
            background: transparent;
            border: none;
            color: #888888;
            font-size: 1.1rem;
            cursor: pointer;
            padding-left: 15px;
            transition: color 0.2s ease;
            line-height: 1;
        }

        .luxury-toast-close:hover {
            color: var(--gold, #D4AF37);
        }
    `;
    document.head.appendChild(style);

    // Create and append the toast container
    const container = document.createElement('div');
    container.className = 'luxury-toast-container';
    document.body.appendChild(container);

    // Expose global showAlert method
    window.showAlert = function (message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `luxury-toast luxury-toast-${type}`;

        const textNode = document.createElement('span');
        textNode.textContent = message;
        toast.appendChild(textNode);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'luxury-toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function () {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        };
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // Force reflow and show
        setTimeout(() => toast.classList.add('show'), 50);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }
        }, 4000);
    };
})();
