// Chatbot Logic for TimeVerse Boutique
(function () {
    const chatWidget = document.getElementById('timeverse-chat-widget');
    if (!chatWidget) return;

    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    // Toggle Chat Window
    toggleBtn.addEventListener('click', () => {
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Clear Input
        chatInput.value = '';

        // Append User Message
        appendMessage(text, 'user');

        // Append Typing Indicator
        const typingDiv = appendTypingIndicator();

        try {
            // Retrieve token if user is logged in (to track session)
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const baseUrl = (window.api && window.api.BASE_URL) ? window.api.BASE_URL : 'https://timeverse-backend.onrender.com';
            const response = await fetch(`${baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: text })
            });

            // Remove Typing Indicator
            typingDiv.remove();

            if (!response.ok) {
                throw new Error('API server returned error status.');
            }

            const resData = await response.json();
            if (resData.success && resData.data && resData.data.response) {
                appendMessage(resData.data.response, 'bot');
            } else {
                appendMessage("I'm sorry, I encountered an issue processing your request. Please try again later.", 'bot');
            }
        } catch (error) {
            console.error("Chatbot request failed:", error);
            typingDiv.remove();
            appendMessage("Unable to connect to TimeVerse Assistant. Please make sure the backend server is running.", 'bot');
        }
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot';
        typingDiv.style.fontStyle = 'italic';
        typingDiv.textContent = 'Thinking...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    // Bind Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
})();
