// Dynamic Luxury Footer Component

(function () {
    // Inject footer styling dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        footer {
            background-color: var(--dark-gray, #181818);
            border-top: var(--border, 1px solid rgba(212, 175, 55, 0.2));
            padding: 60px 0 30px 0;
            margin-top: 80px;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
            gap: 40px;
            margin-bottom: 40px;
        }

        .footer-brand h3 {
            font-family: var(--font-title, 'Cinzel', serif);
            font-size: 1.6rem;
            margin-bottom: 20px;
            letter-spacing: 2px;
            color: #FFFFFF;
        }

        .footer-brand h3 span {
            color: var(--gold, #D4AF37);
        }

        .footer-brand p {
            color: var(--light-gray, #888888);
            line-height: 1.8;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }

        .footer-heading {
            font-family: var(--font-title, 'Cinzel', serif);
            font-size: 0.95rem;
            color: var(--gold, #D4AF37);
            margin-bottom: 20px;
            letter-spacing: 0.5px;
            font-weight: 700;
        }

        .footer-links {
            list-style: none;
        }

        .footer-links li {
            margin-bottom: 12px;
        }

        .footer-links a {
            color: var(--light-gray, #888888);
            font-size: 0.9rem;
            transition: var(--transition);
        }

        .footer-links a:hover {
            color: #FFFFFF;
            padding-left: 5px;
        }

        .footer-contact p {
            color: var(--light-gray, #888888);
            font-size: 0.9rem;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .footer-bottom {
            border-top: 1px solid rgba(212, 175, 55, 0.1);
            padding-top: 30px;
            text-align: center;
            color: var(--light-gray, #888888);
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }

        @media (max-width: 992px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (max-width: 576px) {
            .footer-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);

    function renderFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        footer.id = 'footer-section';

        footer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-brand">
                        <h3 style="display: flex; align-items: center; gap: 10px;">
                            <img src="./logo.jpg" alt="TimeVerse" class="footer-logo-img" style="height: 32px; width: auto; object-fit: contain; display: inline-block; border-radius: 4px;" onerror="if(!this.dataset.retried){this.dataset.retried=true; this.src=(window.location.pathname.includes('/pages/') ? './logo.jpg' : './pages/logo.jpg');}">
                            <span>Time</span>Verse
                        </h3>
                        <p>TimeVerse is a premium luxury horology platform. We offer handpicked, authenticated watches from the world's most prestigious manufactures. Experience mechanical perfection and timeless luxury.</p>
                    </div>
                    <div>
                        <h4 class="footer-heading">Boutique</h4>
                        <ul class="footer-links">
                            <li><a href="./products.html">All Collections</a></li>
                            <li><a href="./products.html?subcategory=Luxury">Luxury Series</a></li>
                            <li><a href="./products.html?subcategory=Analog">Analog Series</a></li>
                            <li><a href="./products.html?subcategory=Sports">Sports Chronos</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="footer-heading">Services</h4>
                        <ul class="footer-links">
                            <li><a href="./cart.html">Shopping Bag</a></li>
                            <li><a href="./orders.html">Order Tracker</a></li>
                            <li><a href="#">Security Guarantee</a></li>
                            <li><a href="#">Bespoke Consulting</a></li>
                        </ul>
                    </div>
                    <div class="footer-contact">
                        <h4 class="footer-heading">TimeVerse HQ</h4>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--gold)" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            100 Elite Boulevard, Geneva, Switzerland
                        </p>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--gold)" viewBox="0 0 16 16">
                                <path d="M3.654 1.328a.678.678 0 0 0-.77-.415C2.444 1.035 1.745 1.258 1.154 1.586a.678.678 0 0 0-.401.762C1.04 4.545 2.052 8.528 5.617 12.093c3.565 3.566 7.548 4.576 10.741 4.881a.678.678 0 0 0 .762-.401c.328-.59.551-1.29.61-1.995a.678.678 0 0 0-.415-.77l-3.32-1.32a.678.678 0 0 0-.77.195l-1.205 1.451c-2.268-1.11-4.077-2.918-5.187-5.187l1.451-1.205a.678.678 0 0 0 .195-.77L3.654 1.328z"/>
                            </svg>
                            +41 22 555 0199
                        </p>
                        <p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--gold)" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
                            </svg>
                            concierge@timeverse.com
                        </p>
                    </div>
                </div>
                <div class="footer-bottom">
                    &copy; 2026 TimeVerse Boutique. All Rights Reserved. Crafted for Mechanical Perfection.
                </div>
            </div>
        `;
    }

    document.addEventListener('DOMContentLoaded', renderFooter);
})();
