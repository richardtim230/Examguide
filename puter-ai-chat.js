/**
 * Puter AI Chat Integration for ExamGuide
 * Replaces the basic WhatsApp chat with AI-powered responses
 */

// Initialize Puter AI when script loads
document.addEventListener('DOMContentLoaded', function() {
    initPuterAIChat();
});

// Configuration
const PUTER_CONFIG = {
    WHATSAPP_FALLBACK: '2349155127634',
    AI_CONTEXT: `You are ExamGuard support assistant. You help students with:
    - Exam preparation and study tips
    - Platform features and navigation
    - Account and login issues
    - Technical support
    - Exam scheduling and results
    - Mock test information
    - Payment and subscription questions
    
    Be friendly, professional, and concise. Keep responses under 150 words.
    If the user needs human support, offer WhatsApp escalation.`
};

function initPuterAIChat() {
    const whatsappIcon = document.getElementById('whatsapp-icon');
    const welcomePopup = document.getElementById('welcome-popup');
    const chatModal = document.getElementById('chat-modal');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const closeBtn = document.getElementById('close-chat');
    const chatMessages = document.querySelector('.chat-messages');

    if (!whatsappIcon || !chatModal) return;

    // Show welcome popup on page load (after 1 second)
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (welcomePopup) welcomePopup.classList.remove('hidden');
        }, 1000);
    });

    // Hide welcome popup after 5 seconds
    setTimeout(() => {
        if (welcomePopup) welcomePopup.classList.add('hidden');
    }, 6000);

    // Open chat modal on icon click
    whatsappIcon.addEventListener('click', () => {
        if (welcomePopup) welcomePopup.classList.add('hidden');
        chatModal.classList.remove('hidden');
        chatInput.focus();
    });

    // Open chat modal on popup click
    if (welcomePopup) {
        welcomePopup.addEventListener('click', () => {
            welcomePopup.classList.add('hidden');
            chatModal.classList.remove('hidden');
            chatInput.focus();
        });
    }

    // Close chat modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatModal.classList.add('hidden');
        });
    }

    // Send message on button click
    sendBtn.addEventListener('click', sendPuterAIMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            sendPuterAIMessage();
        }
    });

    async function sendPuterAIMessage() {
        const messageText = chatInput.value.trim();
        
        if (!messageText) return;

        // Add user message to chat
        addMessageToChat(messageText, 'user-message');
        chatInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            // Call Puter AI API
            const aiResponse = await getPuterAIResponse(messageText);
            removeTypingIndicator();
            addMessageToChat(aiResponse, 'bot-message');

            // Add escalation option after response
            addEscalationOption();

        } catch (error) {
            console.error('Puter AI Error:', error);
            removeTypingIndicator();
            addMessageToChat(
                'I encountered an error processing your request. Would you like to chat with our team on WhatsApp instead?',
                'bot-message'
            );
            addEscalationOption();
        }
    }

    function addEscalationOption() {
        const escalateContainer = document.createElement('div');
        escalateContainer.className = 'escalation-option';
        escalateContainer.innerHTML = `
            <small style="color: #888; display: block; margin-top: 12px; text-align: center;">
                Need human support?
                <a href="javascript:escalateToWhatsApp('${PUTER_CONFIG.WHATSAPP_FALLBACK}')" 
                   style="color: #25D366; text-decoration: underline; font-weight: 600;">
                    Chat on WhatsApp
                </a>
            </small>
        `;
        chatMessages.appendChild(escalateContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Get AI response from Puter
 * This uses Puter's AI capabilities
 */
async function getPuterAIResponse(userMessage) {
    try {
        // Check if Puter is available
        if (typeof puter === 'undefined') {
            return await getFallbackAIResponse(userMessage);
        }

        // Use Puter's AI API (if available in their v2 SDK)
        if (puter.ai && puter.ai.chat) {
            const response = await puter.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: PUTER_CONFIG.AI_CONTEXT
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                max_tokens: 150
            });
            
            return response.choices[0].message.content || 'Unable to process your request.';
        } else {
            // Fallback if Puter AI endpoint not available
            return await getFallbackAIResponse(userMessage);
        }
    } catch (error) {
        console.error('Error calling Puter AI:', error);
        return await getFallbackAIResponse(userMessage);
    }
}

/**
 * Fallback AI responses (rule-based)
 */
async function getFallbackAIResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Exam-related queries
    if (message.includes('mock') || message.includes('exam') || message.includes('test')) {
        return 'Our mock exams are designed to help you practice! 📝 You can access them from the dashboard. Each mock covers the full syllabus with timed questions. Would you like help accessing a specific exam?';
    }

    // Login/Account issues
    if (message.includes('login') || message.includes('password') || message.includes('account')) {
        return 'I can help with login issues! 🔐 Try: 1) Clear your browser cache, 2) Reset your password, 3) Use a different browser. If issues persist, our team is ready on WhatsApp to assist!';
    }

    // Payment/Subscription
    if (message.includes('pay') || message.includes('fee') || message.includes('subscription') || message.includes('cost')) {
        return 'Many features are free! 💰 Premium features require a small subscription. For payment help, receipt issues, or special offers, please contact our support team via WhatsApp.';
    }

    // Features/Navigation
    if (message.includes('feature') || message.includes('help') || message.includes('how')) {
        return 'I\'d be happy to help! 🎯 ExamGuide offers mock exams, study materials, performance tracking, and more. What specific feature would you like to know about?';
    }

    // Results/Performance
    if (message.includes('result') || message.includes('score') || message.includes('performance')) {
        return 'Your exam results are displayed immediately after submission! 📊 Check your dashboard to view scores, analytics, and detailed feedback. Need help interpreting your results?';
    }

    // Thank you
    if (message.includes('thank') || message.includes('thanks')) {
        return 'You\'re welcome! 😊 Happy to help. Feel free to ask anything else about ExamGuard!';
    }

    // Default response
    return 'Thanks for reaching out! 👋 I\'m here to help with any questions about ExamGuard. Feel free to ask about exams, accounts, payments, or features. For complex issues, I can connect you with our team on WhatsApp!';
}

/**
 * Add message to chat display
 */
function addMessageToChat(messageText, messageClass) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${messageClass}`;
    messageEl.textContent = messageText;
    messageEl.style.cssText = `
        margin-bottom: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
        animation: fadeInUp 0.3s ease;
    `;

    if (messageClass === 'user-message') {
        messageEl.style.cssText += `
            background: #3a86ff;
            color: white;
            align-self: flex-end;
            margin-left: auto;
        `;
    } else {
        messageEl.style.cssText += `
            background: #f0f0f0;
            color: #333;
            align-self: flex-start;
        `;
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
        <div style="display: flex; gap: 4px; align-items: center; padding: 10px 14px; background: #f0f0f0; border-radius: 8px; width: fit-content;">
            <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite;"></span>
            <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite 0.2s;"></span>
            <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite 0.4s;"></span>
        </div>
    `;
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add animation styles if not present
    if (!document.getElementById('bounce-animation')) {
        const style = document.createElement('style');
        style.id = 'bounce-animation';
        style.innerHTML = `
            @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();
}

/**
 * Escalate to WhatsApp
 */
function escalateToWhatsApp(whatsappNumber) {
    const chatInput = document.getElementById('chat-input');
    const lastUserMessage = chatInput.placeholder; // or retrieve from chat history
    
    const whatsappMessage = encodeURIComponent(
        `Hi, I need help with ExamGuard. I was chatting with your AI assistant and need human support.\n\nPlease help me!`
    );
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappURL, '_blank');
}

// Export for external use
window.PuterAIChat = {
    sendMessage: sendPuterAIMessage,
    escalateToWhatsApp: escalateToWhatsApp,
    addMessageToChat: addMessageToChat
};
