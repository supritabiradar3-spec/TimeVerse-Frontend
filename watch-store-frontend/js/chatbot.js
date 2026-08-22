// TimeVerse Boutique AI Customer Chatbot with Real Product Catalog Integration
(function () {
    let cachedProducts = [];
    let cachedCategories = [];
    let isCatalogLoading = false;

    const DEFAULT_CATEGORY_MAP = {
        1: 'Analog Watches',
        2: 'Digital Watches',
        3: 'Luxury Watches',
        4: 'Sports Watches'
    };

    // Ensure the chat widget exists or inject it dynamically
    function ensureChatWidget() {
        let chatWidget = document.getElementById('timeverse-chat-widget');
        if (!chatWidget) {
            chatWidget = document.createElement('div');
            chatWidget.id = 'timeverse-chat-widget';
            chatWidget.className = 'chat-widget';
            chatWidget.innerHTML = `
                <button id="chat-toggle-btn" class="chat-toggle-btn" title="Chat with TimeVerse AI" aria-label="Open Chat">
                    <span class="chat-icon">💬</span>
                </button>
                <div id="chat-window" class="chat-window">
                    <div class="chat-header">
                        <div class="chat-header-title">
                            <span class="chat-status-dot"></span>
                            TimeVerse Assistant
                        </div>
                        <button id="chat-close-btn" class="chat-close-btn" aria-label="Close Chat">&times;</button>
                    </div>
                    <div id="chat-messages" class="chat-messages">
                        <div class="chat-message bot">
                            Hello! I am your TimeVerse Assistant. How can I help you discover our premium watches today?
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Ask about watches, prices, categories..." autocomplete="off">
                        <button id="chat-send-btn">Send</button>
                    </div>
                </div>
            `;
            document.body.appendChild(chatWidget);
        }
        return chatWidget;
    }

    // Fetch the authentic product data from the existing backend API
    async function loadCatalog() {
        if (cachedProducts.length > 0) return cachedProducts;
        if (isCatalogLoading) {
            while (isCatalogLoading) {
                await new Promise(r => setTimeout(r, 80));
            }
            return cachedProducts;
        }

        isCatalogLoading = true;
        try {
            // Fetch Products
            if (window.api && typeof window.api.getAllProducts === 'function') {
                const res = await window.api.getAllProducts();
                if (Array.isArray(res)) {
                    cachedProducts = res;
                } else if (res && Array.isArray(res.data)) {
                    cachedProducts = res.data;
                }
            }

            // Fetch Categories
            if (window.api && typeof window.api.getCategories === 'function') {
                const catRes = await window.api.getCategories();
                if (Array.isArray(catRes)) {
                    cachedCategories = catRes;
                } else if (catRes && Array.isArray(catRes.data)) {
                    cachedCategories = catRes.data;
                }
            }

            // Fallback direct fetch if empty
            if (cachedProducts.length === 0) {
                const baseUrl = (window.api && window.api.BASE_URL) ? window.api.BASE_URL : 'https://timeverse-backend.onrender.com';
                const response = await fetch(`${baseUrl}/api/products`);
                if (response.ok) {
                    const json = await response.json();
                    cachedProducts = Array.isArray(json) ? json : (json.data || []);
                }
            }
        } catch (err) {
            console.warn('Chatbot product catalog retrieval notice:', err);
        } finally {
            isCatalogLoading = false;
        }
        return cachedProducts;
    }

    // Helper: format currency
    function formatPrice(val) {
        const num = Number(val || 0);
        return `₹${num.toLocaleString('en-IN')}`;
    }

    // Helper: resolve product image
    function resolveProductImage(product) {
        const raw = product.imageUrl || product.image || '';
        if (typeof window.resolveImageUrl === 'function') {
            return window.resolveImageUrl(raw);
        }
        if (!raw) return 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
            return raw;
        }
        const baseUrl = (window.api && window.api.BASE_URL) ? window.api.BASE_URL : 'https://timeverse-backend.onrender.com';
        return `${baseUrl}${raw.startsWith('/') ? '' : '/'}${raw}`;
    }

    // Helper: resolve product name
    function resolveDisplayName(product) {
        const rawName = product.name || product.productName || 'Timepiece';
        if (typeof window.resolveProductName === 'function') {
            return window.resolveProductName(rawName, product.productId || product.id);
        }
        if (rawName.toLowerCase() === 'titan neo updated' || Number(product.productId || product.id) === 1) {
            return 'Titan Neo';
        }
        return rawName;
    }

    // Helper: resolve rating
    function resolveProductRating(product) {
        if (typeof window.getProductDisplayRating === 'function') {
            return window.getProductDisplayRating(product);
        }
        if (product.rating && Number(product.rating) > 0) {
            return Number(product.rating).toFixed(1);
        }
        return '4.5';
    }

    // Helper: resolve category name
    function getCategoryName(categoryId) {
        if (cachedCategories && cachedCategories.length > 0) {
            const found = cachedCategories.find(c => Number(c.categoryId || c.id) === Number(categoryId));
            if (found && (found.categoryName || found.name)) {
                return found.categoryName || found.name;
            }
        }
        return DEFAULT_CATEGORY_MAP[Number(categoryId)] || 'Luxury Watches';
    }

    // Helper: build HTML product card (When customer asks to see/show product or image)
    function buildProductCardHTML(product) {
        const id = product.productId || product.id;
        const name = resolveDisplayName(product);
        const imgUrl = resolveProductImage(product);
        const priceText = formatPrice(product.price);
        const ratingVal = resolveProductRating(product);
        const categoryName = getCategoryName(product.categoryId);
        const description = product.description ? product.description.trim() : 'Authentic luxury timepiece with international warranty and certified craftsmanship.';
        const isPagesDir = window.location.pathname.includes('/pages/');
        const detailsUrl = `${isPagesDir ? '.' : './pages'}/product-details.html?id=${encodeURIComponent(id)}`;

        return `
            <div class="chat-product-card" data-product-id="${id}">
                <div class="chat-product-img-wrap">
                    <img src="${imgUrl}" alt="${name}" class="chat-product-img" onerror="this.src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';">
                </div>
                <div class="chat-product-meta">
                    <div class="chat-product-category">${categoryName}</div>
                    <h4 class="chat-product-name">${name}</h4>
                    <div class="chat-product-row">
                        <span class="chat-product-price">${priceText}</span>
                        <span class="chat-product-rating">★ ${ratingVal}</span>
                    </div>
                    <p class="chat-product-desc">${description}</p>
                    <a href="${detailsUrl}" class="chat-product-btn">View Product</a>
                </div>
            </div>
        `;
    }

    // Helper: build Text-Only Details (When customer asks for details/price/info without asking to see/show image)
    function buildTextDetailsHTML(product) {
        const name = resolveDisplayName(product);
        const priceText = formatPrice(product.price);
        const ratingVal = resolveProductRating(product);
        const categoryName = getCategoryName(product.categoryId);
        const description = product.description ? product.description.trim() : 'Authentic luxury timepiece from TimeVerse collection.';

        return `
            <div class="chat-text-details">
                <div class="chat-text-details-title">${name}</div>
                <div style="margin-top: 4px;"><strong>Price:</strong> ${priceText}</div>
                <div style="margin-top: 2px;"><strong>Rating:</strong> ★ ${ratingVal}</div>
                <div style="margin-top: 2px;"><strong>Category:</strong> ${categoryName}</div>
                <div style="margin-top: 6px; line-height: 1.45;"><strong>Description:</strong> ${description}</div>
            </div>
        `;
    }

    // Helper: Detect if user explicitly asks to SEE, SHOW, or view the IMAGE
    function wantsProductImage(userQuery) {
        const q = (userQuery || '').toLowerCase();
        return /\b(show me|show|see|look at|view|with image|visual|display)\b/i.test(q) && !isImageOnlyIntent(q) && !isProductLinkIntent(q);
    }

    // Helper: Parse raw price tokens (e.g. 10000, 10,000, 10k, 15k, 1lakh, ₹5,000)
    function parsePriceValue(str) {
        if (!str) return null;
        let s = str.toLowerCase().replace(/,/g, '').replace(/[₹rsinr]/g, '').trim();
        if (s.endsWith('k')) {
            const num = parseFloat(s.slice(0, -1));
            return isNaN(num) ? null : num * 1000;
        }
        if (s.endsWith('l') || s.endsWith('lakh') || s.endsWith('lac')) {
            const num = parseFloat(s.replace(/lakh|lac|l/, ''));
            return isNaN(num) ? null : num * 100000;
        }
        const num = parseFloat(s);
        return isNaN(num) ? null : num;
    }

    // Helper: Extract price filter intent (under, below, above, between, around, etc.)
    function extractPriceFilter(query) {
        const raw = (query || '').toLowerCase().replace(/,/g, '');

        // 1. Between X and Y (e.g. between 5000 and 10000, 5000 to 10000, 5k to 10k)
        const betweenMatch = raw.match(/(?:between|from)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i);
        if (betweenMatch && (raw.includes('between') || raw.includes('from') || raw.includes('to') || raw.includes('-') || raw.includes('range'))) {
            const val1 = parsePriceValue(betweenMatch[1]);
            const val2 = parsePriceValue(betweenMatch[2]);
            if (val1 !== null && val2 !== null) {
                const min = Math.min(val1, val2);
                const max = Math.max(val1, val2);
                return { min, max, type: 'between', label: `between ₹${min.toLocaleString('en-IN')} and ₹${max.toLocaleString('en-IN')}` };
            }
        }

        // 2. Around / Approx X
        const aroundMatch = raw.match(/(?:around|approx|approximately|about|nearby)\s*(?:price|budget|rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i);
        if (aroundMatch) {
            const target = parsePriceValue(aroundMatch[1]);
            if (target !== null) {
                const min = target * 0.8;
                const max = target * 1.2;
                return { min, max, target, type: 'around', label: `around ₹${target.toLocaleString('en-IN')}` };
            }
        }

        // 3. Above / Over / More than / Min X
        const aboveMatch = raw.match(/(?:above|over|more than|greater than|exceeding|min|minimum|starting from|from)\s*(?:price|budget|rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i) ||
                           raw.match(/(?:price|budget)\s*(?:above|over|more than|min)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i);
        if (aboveMatch) {
            const target = parsePriceValue(aboveMatch[1]);
            if (target !== null) {
                return { min: target, max: Infinity, type: 'above', label: `above ₹${target.toLocaleString('en-IN')}` };
            }
        }

        // 4. Under / Below / Less than / Up to / Within / Max / Budget X
        const underMatch = raw.match(/(?:under|below|less than|within|up to|max|maximum|budget|cheaper than)\s*(?:price|budget|rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i) ||
                           raw.match(/(?:price|budget)\s*(?:under|below|less than|within|up to|max)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)/i) ||
                           raw.match(/(\d+(?:\.\d+)?k?|\d+(?:\.\d+)?lakh?)\s*(?:and under|or below|or less|budget|max)/i);
        if (underMatch) {
            const target = parsePriceValue(underMatch[1]);
            if (target !== null) {
                return { min: 0, max: target, type: 'under', label: `under ₹${target.toLocaleString('en-IN')}` };
            }
        }

        // 5. Fallback under / below
        const fallbackUnder = raw.match(/under\s*(\d+(?:\.\d+)?k?)/i) || raw.match(/below\s*(\d+(?:\.\d+)?k?)/i);
        if (fallbackUnder) {
            const target = parsePriceValue(fallbackUnder[1]);
            if (target !== null) {
                return { min: 0, max: target, type: 'under', label: `under ₹${target.toLocaleString('en-IN')}` };
            }
        }

        return null;
    }

    // Helper: Extract watch category name from query
    function extractCategory(query) {
        const raw = (query || '').toLowerCase();
        if (raw.includes('luxury')) return 'Luxury Watches';
        if (raw.includes('analog')) return 'Analog Watches';
        if (raw.includes('digital')) return 'Digital Watches';
        if (raw.includes('sport')) return 'Sports Watches';
        return null;
    }

    // Helper: Check if query explicitly refers to all/general watches
    function isExplicitGenericWatchQuery(query) {
        const raw = (query || '').toLowerCase();
        return (raw.includes('all watch') || raw.includes('any watch') || raw.includes('watches') || raw.includes('collection') || raw.includes('models')) &&
               !raw.includes('digital') && !raw.includes('luxury') && !raw.includes('analog') && !raw.includes('sport');
    }

    // Helper: Check if customer asks for a recommendation/suggestion
    function isSuggestIntent(query) {
        const raw = (query || '').toLowerCase();
        return /\b(suggest|recommend|pick one|choose one|which one|best watch|one product|suggest one|recommend me)\b/i.test(raw);
    }

    // Helper: Check if customer asks explicitly for the image only
    function isImageOnlyIntent(query) {
        const raw = (query || '').toLowerCase();
        return /\b(product image|the image|want the image|direct product image|direct image|give image|show image|give me image|see image|show me product image|i want image|want image)\b/i.test(raw) ||
               (raw.includes('image') && !raw.includes('with image') && !raw.includes('details'));
    }

    // Helper: Check if customer asks for the product link
    function isProductLinkIntent(query) {
        const raw = (query || '').toLowerCase();
        return /\b(product link|view product link|link to view|link to buy|give link|product url|where to buy|how to buy|link to product|give me product link|link)\b/i.test(raw);
    }

    // Helper: Deduplicate products by actual productId
    function deduplicateProducts(prods) {
        const seen = new Set();
        return prods.filter(p => {
            const id = p.productId || p.id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    // Stop words to isolate product terms from natural language queries
    const STOP_WORDS = new Set([
        'tell', 'me', 'about', 'what', 'is', 'the', 'price', 'of', 'show', 'watch', 'watches',
        'details', 'how', 'much', 'buy', 'cost', 'info', 'information', 'give', 'please',
        'can', 'you', 'i', 'want', 'to', 'see', 'a', 'an', 'for', 'in', 'do', 'have',
        'are', 'there', 'any', 'looking', 'need', 'find', 'timepiece', 'timepieces', 'model',
        'check', 'rate', 'spec', 'specs', 'specification', 'specifications', 'know', 'describe',
        'available', 'stock', 'collection', 'catalogue', 'catalog', 'brand', 'men', 'mens', 'women', 'womens',
        'image', 'images', 'photo', 'photos', 'picture', 'pictures', 'pic', 'pics', 'look', 'view',
        'under', 'below', 'above', 'between', 'and', 'from', 'to', 'around', 'budget', 'less', 'more', 'than',
        'suggest', 'recommend', 'link', 'product', 'direct'
    ]);

    function cleanText(str) {
        return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function extractKeywords(str) {
        const words = cleanText(str).split(' ');
        return words.filter(w => w.length > 1 && !STOP_WORDS.has(w) && isNaN(parsePriceValue(w)));
    }

    // Strict Multi-Turn Conversational Memory State
    const conversationContext = {
        activeCategory: null,
        activeProducts: [],
        activeFilteredProducts: [],
        selectedProduct: null,
        selectedProductId: null
    };

    // Smart Matcher: Search specific products by name
    async function findMatchingProducts(query) {
        const catalog = await loadCatalog();
        if (!catalog || catalog.length === 0) return { type: 'none', matches: [] };

        const products = deduplicateProducts(catalog);
        const rawClean = cleanText(query);
        const keywords = extractKeywords(query);

        // 1. Category check
        const isLuxuryQuery = rawClean.includes('luxury');
        const isAnalogQuery = rawClean.includes('analog');
        const isDigitalQuery = rawClean.includes('digital');
        const isSportsQuery = rawClean.includes('sport') || rawClean.includes('sports');

        if ((isLuxuryQuery || isAnalogQuery || isDigitalQuery || isSportsQuery) && keywords.length <= 3) {
            let catTarget = '';
            if (isLuxuryQuery) catTarget = 'luxury';
            else if (isAnalogQuery) catTarget = 'analog';
            else if (isDigitalQuery) catTarget = 'digital';
            else if (isSportsQuery) catTarget = 'sport';

            const catMatches = products.filter(p => {
                const catName = getCategoryName(p.categoryId).toLowerCase();
                const pName = (p.name || '').toLowerCase();
                return catName.includes(catTarget) || pName.includes(catTarget);
            });

            if (catMatches.length > 0) {
                return {
                    type: 'category',
                    categoryName: catTarget.charAt(0).toUpperCase() + catTarget.slice(1) + ' Watches',
                    matches: deduplicateProducts(catMatches)
                };
            }
        }

        // 2. General Collection Query
        const isGeneralQuery = rawClean.includes('what watches') ||
                               rawClean.includes('all watches') ||
                               rawClean.includes('have watches') ||
                               rawClean.includes('recommend') ||
                               rawClean.includes('best watches') ||
                               rawClean.includes('popular') ||
                               (keywords.length === 0 && (rawClean.includes('watch') || rawClean.includes('watches')));

        if (isGeneralQuery) {
            return {
                type: 'general',
                matches: products.slice(0, 6)
            };
        }

        // 3. Search for specific product by Name / Keywords
        const scoredProducts = [];

        for (const p of products) {
            const pName = resolveDisplayName(p).toLowerCase();
            const pNameClean = cleanText(pName);
            const pDesc = (p.description || '').toLowerCase();
            let score = 0;

            if (pNameClean.length > 2 && rawClean.includes(pNameClean)) {
                score += 100;
            }

            if (keywords.length > 0) {
                const pNameTokens = pNameClean.split(' ');
                let matchedKeywordCount = 0;

                for (const kw of keywords) {
                    if (pNameTokens.some(tok => tok === kw || tok.includes(kw) || kw.includes(tok))) {
                        matchedKeywordCount++;
                    }
                }

                if (matchedKeywordCount === keywords.length) {
                    score += 80 + (keywords.length * 10);
                } else if (matchedKeywordCount > 0) {
                    score += (matchedKeywordCount / keywords.length) * 60;
                }

                const joinedKeywords = keywords.join(' ');
                if (pNameClean.includes(joinedKeywords)) {
                    score += 40;
                }
            }

            if (keywords.length > 0) {
                for (const kw of keywords) {
                    if (kw.length >= 4 && pDesc.includes(kw)) {
                        score += 15;
                    }
                }
            }

            if (score > 35) {
                scoredProducts.push({ product: p, score });
            }
        }

        scoredProducts.sort((a, b) => b.score - a.score);

        if (scoredProducts.length === 0) {
            const containsProductIntent = /(titan|casio|rolex|omega|jacob|fossil|tissot|seiko|eyotto|north|garmin|senbono|cartier|watch|timepiece|price|tell me|show|cost|buy|details)/i.test(query);
            if (containsProductIntent || keywords.length > 0) {
                return { type: 'not_found', matches: [] };
            }
            return { type: 'unknown', matches: [] };
        }

        const topScore = scoredProducts[0].score;
        if (topScore >= 90) {
            const highMatches = scoredProducts.filter(item => item.score >= 85).map(item => item.product);
            if (highMatches.length === 1) {
                return { type: 'single', matches: highMatches };
            }
            return { type: 'multiple', matches: highMatches.slice(0, 3) };
        }

        const matches = scoredProducts.map(item => item.product).slice(0, 3);
        return { type: matches.length === 1 ? 'single' : 'multiple', matches };
    }

    // Initialize Chatbot UI and Listeners
    function initChatbot() {
        const chatWidget = ensureChatWidget();
        const toggleBtn = document.getElementById('chat-toggle-btn');
        const closeBtn = document.getElementById('chat-close-btn');
        const chatWindow = document.getElementById('chat-window');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        // Preload product catalog in the background
        loadCatalog();

        // Toggle Chat Window
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = chatWindow.style.display === 'flex';
                chatWindow.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    chatInput.focus();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                chatWindow.style.display = 'none';
            });
        }

        // Append text message
        function appendTextMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return msgDiv;
        }

        // Append Bot response with product cards
        function appendBotProductResponse(introText, products = []) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message bot ${products.length > 0 ? 'has-product-card' : ''}`;

            let contentHTML = '';
            if (introText) {
                contentHTML += `<div style="margin-bottom: ${products.length > 0 ? '8px' : '0'}; line-height: 1.4;">${introText}</div>`;
            }

            if (products.length > 0) {
                contentHTML += `<div class="chat-product-list">`;
                products.forEach(prod => {
                    contentHTML += buildProductCardHTML(prod);
                });
                contentHTML += `</div>`;
            }

            msgDiv.innerHTML = contentHTML;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Append custom bot HTML content (e.g. Text-only details, image-only, or link buttons)
        function appendBotCustomHTML(htmlContent) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message bot';
            msgDiv.innerHTML = htmlContent;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Typing indicator
        function appendTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message bot';
            typingDiv.style.fontStyle = 'italic';
            typingDiv.textContent = 'Consulting TimeVerse catalog...';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return typingDiv;
        }

        // Main Send Message Handler
        async function handleSendMessage() {
            const rawText = chatInput.value.trim();
            if (!rawText) return;

            chatInput.value = '';
            appendTextMessage(rawText, 'user');

            const typingDiv = appendTypingIndicator();

            try {
                // Ensure authentic catalog is loaded
                const rawCatalog = await loadCatalog();
                const catalog = deduplicateProducts(rawCatalog);

                // 1. Parse Query Intents
                const priceFilter = extractPriceFilter(rawText);
                const detectedCategory = extractCategory(rawText);
                const isGenericQuery = isExplicitGenericWatchQuery(rawText);
                const isSuggest = isSuggestIntent(rawText);
                const isImageOnly = isImageOnlyIntent(rawText);
                const isLinkReq = isProductLinkIntent(rawText);
                const isExplicitCardRequested = wantsProductImage(rawText);

                // =========================================================================
                // 1. PRODUCT LINK REQUEST (e.g. "give me product link to view product")
                // =========================================================================
                if (isLinkReq) {
                    typingDiv.remove();
                    const prod = conversationContext.selectedProduct ||
                                 (conversationContext.activeFilteredProducts.length > 0 ? conversationContext.activeFilteredProducts[0] : null) ||
                                 (conversationContext.activeProducts.length > 0 ? conversationContext.activeProducts[0] : null) ||
                                 catalog[0];

                    const id = prod ? (prod.productId || prod.id) : 1;
                    const name = prod ? resolveDisplayName(prod) : 'the watch';
                    const isPagesDir = window.location.pathname.includes('/pages/');
                    const detailsUrl = `${isPagesDir ? '.' : './pages'}/product-details.html?id=${encodeURIComponent(id)}`;

                    appendBotCustomHTML(`
                        <div style="line-height: 1.5;">
                            You can view the full details and purchase <strong>${name}</strong> here:
                            <div style="margin-top: 10px;">
                                <a href="${detailsUrl}" class="chat-product-btn" style="display: inline-block; padding: 8px 18px; background: var(--gold, #A88548); color: #1C1A17; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">View Product</a>
                            </div>
                        </div>
                    `);
                    return;
                }

                // =========================================================================
                // 2. PRODUCT IMAGE ONLY REQUEST (e.g. "give me product image", "i want direct product image")
                // =========================================================================
                if (isImageOnly) {
                    typingDiv.remove();
                    const prod = conversationContext.selectedProduct ||
                                 (conversationContext.activeFilteredProducts.length > 0 ? conversationContext.activeFilteredProducts[0] : null) ||
                                 (conversationContext.activeProducts.length > 0 ? conversationContext.activeProducts[0] : null) ||
                                 catalog[0];

                    const name = resolveDisplayName(prod);
                    const imgUrl = resolveProductImage(prod);
                    const isPagesDir = window.location.pathname.includes('/pages/');
                    const detailsUrl = `${isPagesDir ? '.' : './pages'}/product-details.html?id=${encodeURIComponent(prod.productId || prod.id)}`;

                    appendBotCustomHTML(`
                        <div style="padding: 10px; background: rgba(0,0,0,0.03); border: 1px solid rgba(168,133,72,0.25); border-radius: 8px; text-align: center;">
                            <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; color: var(--gold-light, #E8D7B3);">${name}</div>
                            <img src="${imgUrl}" alt="${name}" style="max-width: 100%; max-height: 220px; border-radius: 6px; object-fit: contain;" onerror="this.src='https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=400';">
                            <div style="margin-top: 8px;">
                                <a href="${detailsUrl}" class="chat-product-btn" style="display: inline-block; padding: 6px 14px; font-size: 0.85rem;">View Product</a>
                            </div>
                        </div>
                    `);
                    return;
                }

                // =========================================================================
                // 3. SUGGEST / RECOMMEND REQUEST (e.g. "suggest me one product")
                // =========================================================================
                if (isSuggest) {
                    typingDiv.remove();
                    let pool = conversationContext.activeFilteredProducts.length > 0 ?
                               conversationContext.activeFilteredProducts :
                               (conversationContext.activeProducts.length > 0 ? conversationContext.activeProducts : catalog);

                    const chosen = pool[0];
                    conversationContext.selectedProduct = chosen;
                    conversationContext.selectedProductId = chosen.productId || chosen.id;

                    const name = resolveDisplayName(chosen);
                    const priceText = formatPrice(chosen.price);
                    const ratingVal = resolveProductRating(chosen);
                    const description = chosen.description ? chosen.description.trim() : 'Minimalist fashion digital watch with LED backlight and water resistance.';

                    appendBotCustomHTML(`
                        <div class="chat-text-details">
                            <div style="margin-bottom: 6px; font-weight: 600; color: var(--gold, #A88548);">I recommend:</div>
                            <div class="chat-text-details-title">${name}</div>
                            <div style="margin-top: 4px; font-size: 1rem; font-weight: 700; color: var(--gold, #A88548);">${priceText}</div>
                            <div style="margin-top: 2px;">★ ${ratingVal}</div>
                            <div style="margin-top: 6px; line-height: 1.45;">${description}</div>
                        </div>
                    `);
                    return;
                }

                // =========================================================================
                // 4. PRICE FILTER HANDLING (Strict Contextual Filtering)
                // =========================================================================
                if (priceFilter) {
                    typingDiv.remove();

                    let targetCategory = null;
                    let pool = [];

                    if (detectedCategory) {
                        targetCategory = detectedCategory;
                        const tLow = targetCategory.toLowerCase().replace(' watches', '').trim();
                        pool = catalog.filter(p => {
                            const cName = getCategoryName(p.categoryId).toLowerCase();
                            const pName = (p.name || '').toLowerCase();
                            return cName.includes(tLow) || pName.includes(tLow);
                        });
                    } else if (isGenericQuery) {
                        targetCategory = null;
                        conversationContext.activeCategory = null;
                        pool = catalog;
                    } else if (conversationContext.activeProducts.length > 0) {
                        // Apply filter ONLY to active category products
                        targetCategory = conversationContext.activeCategory;
                        pool = conversationContext.activeProducts;
                    } else {
                        targetCategory = conversationContext.activeCategory;
                        pool = catalog;
                    }

                    pool = deduplicateProducts(pool);

                    // Apply price bounds
                    const filtered = pool.filter(p => {
                        const price = Number(p.price || 0);
                        return price >= priceFilter.min && price <= priceFilter.max;
                    });

                    filtered.sort((a, b) => Number(a.price) - Number(b.price));

                    const titleCategory = targetCategory ? targetCategory : 'Watches';

                    if (filtered.length === 0) {
                        appendBotCustomHTML(
                            `I couldn't find any ${titleCategory} ${priceFilter.label}. Try adjusting your budget or exploring another collection.`
                        );
                        return;
                    }

                    // Update context
                    conversationContext.activeCategory = targetCategory;
                    conversationContext.activeFilteredProducts = filtered;
                    conversationContext.selectedProduct = filtered[0];
                    conversationContext.selectedProductId = filtered[0].productId || filtered[0].id;

                    if (!isExplicitCardRequested) {
                        // Text list only
                        let textListHTML = `
                            <div style="margin-bottom: 8px; font-weight: 600; font-size: 0.95rem;">${titleCategory} ${priceFilter.label}:</div>
                            <ul style="margin: 4px 0 6px 0; padding-left: 18px; line-height: 1.6;">
                        `;
                        filtered.forEach(p => {
                            textListHTML += `<li><strong>${resolveDisplayName(p)}</strong> — <span style="color: var(--gold, #A88548); font-weight: 600;">${formatPrice(p.price)}</span></li>`;
                        });
                        textListHTML += `</ul>`;
                        appendBotCustomHTML(textListHTML);
                    } else {
                        appendBotProductResponse(`${titleCategory} ${priceFilter.label}:`, filtered);
                    }
                    return;
                }

                // =========================================================================
                // 5. STANDARD PRODUCT SEARCH & CATEGORY RETRIEVAL
                // =========================================================================
                const searchResult = await findMatchingProducts(rawText);

                if (searchResult.type === 'single') {
                    typingDiv.remove();
                    const product = searchResult.matches[0];

                    conversationContext.selectedProduct = product;
                    conversationContext.selectedProductId = product.productId || product.id;
                    conversationContext.activeCategory = getCategoryName(product.categoryId);

                    if (!isExplicitCardRequested) {
                        // Details only -> Text only
                        const textHTML = buildTextDetailsHTML(product);
                        appendBotCustomHTML(textHTML);
                    } else {
                        // Explicit show request -> Card with image
                        appendBotProductResponse('', [product]);
                    }
                    return;
                }

                if (searchResult.type === 'multiple') {
                    typingDiv.remove();
                    const deduped = deduplicateProducts(searchResult.matches);
                    conversationContext.activeProducts = deduped;
                    conversationContext.activeFilteredProducts = deduped;
                    conversationContext.selectedProduct = deduped[0];
                    conversationContext.selectedProductId = deduped[0].productId || deduped[0].id;
                    conversationContext.activeCategory = getCategoryName(deduped[0].categoryId);

                    if (!isExplicitCardRequested) {
                        let textListHTML = `<div style="margin-bottom: 6px; font-weight: 600;">Here are the watches matching your inquiry:</div><ul style="margin: 4px 0 6px 0; padding-left: 18px; line-height: 1.6;">`;
                        deduped.forEach(p => {
                            textListHTML += `<li><strong>${resolveDisplayName(p)}</strong> (${getCategoryName(p.categoryId)}) — <span style="color: var(--gold, #A88548); font-weight: 600;">${formatPrice(p.price)}</span></li>`;
                        });
                        textListHTML += `</ul><div style="font-size: 0.8rem; color: #9CA3AF; margin-top: 6px;">To see photos or details, type <em>"give me ${resolveDisplayName(deduped[0])} details"</em>.</div>`;
                        appendBotCustomHTML(textListHTML);
                    } else {
                        appendBotProductResponse('Here are the watches matching your search:', deduped);
                    }
                    return;
                }

                if (searchResult.type === 'category') {
                    typingDiv.remove();
                    const deduped = deduplicateProducts(searchResult.matches);
                    conversationContext.activeCategory = searchResult.categoryName;
                    conversationContext.activeProducts = deduped;
                    conversationContext.activeFilteredProducts = deduped;
                    conversationContext.selectedProduct = deduped[0];
                    conversationContext.selectedProductId = deduped[0].productId || deduped[0].id;

                    if (!isExplicitCardRequested) {
                        let textListHTML = `<div style="margin-bottom: 6px; font-weight: 600;">Here are our available <strong>${searchResult.categoryName}</strong>:</div><ul style="margin: 4px 0 6px 0; padding-left: 18px; line-height: 1.6;">`;
                        deduped.forEach(p => {
                            textListHTML += `<li><strong>${resolveDisplayName(p)}</strong> — <span style="color: var(--gold, #A88548); font-weight: 600;">${formatPrice(p.price)}</span></li>`;
                        });
                        textListHTML += `</ul>`;
                        appendBotCustomHTML(textListHTML);
                    } else {
                        appendBotProductResponse(`Here are our exquisite **${searchResult.categoryName}**:`, deduped);
                    }
                    return;
                }

                if (searchResult.type === 'general') {
                    typingDiv.remove();
                    const deduped = deduplicateProducts(searchResult.matches);
                    conversationContext.activeCategory = null;
                    conversationContext.activeProducts = deduped;
                    conversationContext.activeFilteredProducts = deduped;
                    conversationContext.selectedProduct = deduped[0];
                    conversationContext.selectedProductId = deduped[0].productId || deduped[0].id;

                    if (!isExplicitCardRequested) {
                        let textListHTML = `<div style="margin-bottom: 6px; font-weight: 600;">Here is a selection of featured timepieces in our collection:</div><ul style="margin: 4px 0 6px 0; padding-left: 18px; line-height: 1.6;">`;
                        deduped.forEach(p => {
                            textListHTML += `<li><strong>${resolveDisplayName(p)}</strong> (${getCategoryName(p.categoryId)}) — <span style="color: var(--gold, #A88548); font-weight: 600;">${formatPrice(p.price)}</span></li>`;
                        });
                        textListHTML += `</ul><div style="font-size: 0.8rem; color: #9CA3AF; margin-top: 6px;">To view any model, type <em>"Show me [Watch Name]"</em>.</div>`;
                        appendBotCustomHTML(textListHTML);
                    } else {
                        appendBotProductResponse('Here are featured luxury timepieces from our current collection:', deduped);
                    }
                    return;
                }

                // =========================================================================
                // 6. CUSTOMER SERVICE INTENTS & NATURAL FALLBACK (No Fake URLs)
                // =========================================================================
                const lower = rawClean(rawText);
                typingDiv.remove();

                if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
                    appendBotProductResponse('Hello! I am your TimeVerse Assistant. How can I help you discover our premium watches today?');
                    return;
                }
                if (lower.includes('shipping') || lower.includes('delivery')) {
                    appendBotProductResponse('TimeVerse provides complimentary insured express courier delivery for all orders. Delivery typically arrives within 2 to 4 business days.');
                    return;
                }
                if (lower.includes('warranty') || lower.includes('guarantee')) {
                    appendBotProductResponse('Every timepiece purchased from TimeVerse comes with a 2-Year International Warranty and an Authenticity Certificate.');
                    return;
                }
                if (lower.includes('return') || lower.includes('refund')) {
                    appendBotProductResponse('We offer a secure cancellation and refund process for eligible orders directly through your My Orders dashboard.');
                    return;
                }

                // Natural fallback strictly within catalog scope
                appendBotCustomHTML("I couldn't find that watch in our current collection.<br>Try searching by the product name or category.");

            } catch (err) {
                console.error('Chatbot processing error:', err);
                typingDiv.remove();
                appendBotCustomHTML("I couldn't find that watch in our current collection.<br>Try searching by the product name or category.");
            }
        }

        function rawClean(str) {
            return (str || '').toLowerCase().trim();
        }

        // Bind Send handlers
        if (sendBtn) {
            sendBtn.addEventListener('click', handleSendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
