/**
 * Puter AI Chat Integration for ExamGuide
 * Uses Puter's native AI chat API with simplified syntax
 */

// Configuration
const PUTER_CONFIG = {
    WHATSAPP_NUMBER: '2349155127634',
    AI_MODEL: 'gpt-5.4'
};

// Initialize chat widget
document.addEventListener('DOMContentLoaded', function() {
    initPuterAIChat();
});

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

    // Send message handlers
    sendBtn.addEventListener('click', sendPuterAIMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            sendPuterAIMessage();
        }
    });

    // Main message sending function
    async function sendPuterAIMessage() {
        const messageText = chatInput.value.trim();
        
        if (!messageText) return;

        // Add user message to chat
        addMessageToChat(messageText, 'user-message');
        chatInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            // Get AI response using Puter's API
            const aiResponse = await getPuterAIResponse(messageText);
            removeTypingIndicator();
            addMessageToChat(aiResponse, 'bot-message');

            // Add WhatsApp escalation option
            setTimeout(() => {
                addEscalationOption();
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            
            // Fallback if Puter AI fails
            const fallbackResponse = getFallbackAIResponse(messageText);
            addMessageToChat(fallbackResponse, 'bot-message');
            
            setTimeout(() => {
                addEscalationOption();
            }, 500);
        }
    }

    function addEscalationOption() {
        const escalateDiv = document.createElement('div');
        escalateDiv.style.cssText = 'text-align: center; margin-top: 8px; padding: 0 8px;';
        escalateDiv.innerHTML = `
            <small style="color: #888; font-size: 12px;">
                Need more help?
                <a href="javascript:void(0)" onclick="escalateToWhatsApp('${PUTER_CONFIG.WHATSAPP_NUMBER}')" 
                   style="color: #25D366; text-decoration: none; font-weight: 600; cursor: pointer;">
                    Chat on WhatsApp
                </a>
            </small>
        `;
        chatMessages.appendChild(escalateDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Get AI response using Puter's native API
 */
async function getPuterAIResponse(userMessage) {
    try {
        // Check if Puter is available
        if (typeof puter === 'undefined' || !puter.ai || !puter.ai.chat) {
            console.warn('Puter AI not available, using fallback');
            return getFallbackAIResponse(userMessage);
        }

        // Simple prompt without system context (to avoid map() error)
        const prompt = `You are ExamGuard support. Help with exams, accounts, payments, features. Be brief. ${userMessage}`;

        // Call Puter AI with simple string prompt
        let response = await puter.ai.chat(prompt, {
            model: PUTER_CONFIG.AI_MODEL
        });

        // Parse response
        if (typeof response === 'string') {
            return response.trim();
        } else if (response && response.message) {
            return response.message.trim();
        } else if (response && response.text) {
            return response.text.trim();
        } else if (response && response.content) {
            return response.content.trim();
        } else if (response && response.choices && response.choices[0]) {
            const choice = response.choices[0];
            if (typeof choice === 'string') return choice.trim();
            if (choice.message) return choice.message.trim();
            if (choice.text) return choice.text.trim();
        }

        // Fallback if response format unknown
        console.warn('Unknown response format:', response);
        return getFallbackAIResponse(userMessage);

    } catch (error) {
        console.error('Puter AI error:', error);
        return getFallbackAIResponse(userMessage);
    }
}

/**
 * Fallback AI responses (rule-based)
 */
function getFallbackAIResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Exam-related queries
    if (message.match(/mock|exam|test|quiz|practice/)) {
        return '📝 Our mock exams help you practice! Access them from your dashboard. Each mock covers the full syllabus with timed questions and detailed feedback. Need help accessing a specific exam?';
    }

    // Login/Account issues
    if (message.match(/login|password|account|sign in|access|forgot/)) {
        return '🔐 Help with login issues: 1) Clear browser cache, 2) Reset password, 3) Use different browser. If issues persist, chat with our team on WhatsApp!';
    }

    // Payment/Subscription
    if (message.match(/pay|fee|subscription|cost|price|refund|receipt/)) {
        return '💰 Many features are free! Premium features require subscription. For payment help, contact our support team. How can I assist?';
    }

    // Features/Navigation
    if (message.match(/feature|how to|help|guide|tutorial|use|access/)) {
        return '🎯 I can help! ExamGuard offers mock exams, study materials, performance tracking, and more. What specific feature would you like to know about?';
    }

    // Results/Performance
    if (message.match(/result|score|grade|performance|mark|feedback/)) {
        return '📊 Results display immediately after submission! Check your dashboard for scores, analytics, and detailed feedback. Need help interpreting your results?';
    }

    // Support/Help general
    if (message.match(/support|help|assist|contact|issue|problem/)) {
        return '💬 I\'m here to help! I can assist with exams, accounts, payments, and features. For complex issues, reach out on WhatsApp. What\'s your question?';
    }

    // Thank you
    if (message.match(/thank|thanks|appreciate|awesome|great/)) {
        return 'You\'re welcome! 😊 Always happy to help. Ask me anything about ExamGuard!';
    }

    // Default response
    return 'Thanks for reaching out! 👋 I\'m ExamGuard AI assistant. I help with exams, accounts, payments, and features. What can I help with?';
}

/**
 * Add message to chat display
 */
function addMessageToChat(text, messageClass) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageClass}`;
    
    messageDiv.style.cssText = `
        margin-bottom: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
        animation: fadeInUp 0.3s ease;
    `;

    if (messageClass === 'user-message') {
        messageDiv.style.cssText += `
            background: #3a86ff;
            color: white;
            margin-left: auto;
            text-align: right;
        `;
    } else {
        messageDiv.style.cssText += `
            background: #f0f0f0;
            color: #333;
            margin-right: auto;
        `;
    }

    const pTag = document.createElement('p');
    pTag.textContent = text;
    pTag.style.margin = '0';
    messageDiv.appendChild(pTag);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <p style="padding: 12px 16px; margin: 0;">
            <span></span><span></span><span></span>
        </p>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add typing animation if not already present
    if (!document.getElementById('typing-animation-style')) {
        const style = document.createElement('style');
        style.id = 'typing-animation-style';
        style.textContent = `
            .typing-indicator p span {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #999;
                margin: 0 2px;
                animation: typing 1.4s infinite;
            }
            .typing-indicator p span:nth-child(2) {
                animation-delay: 0.2s;
            }
            .typing-indicator p span:nth-child(3) {
                animation-delay: 0.4s;
            }
            @keyframes typing {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Escalate to WhatsApp
 */
function escalateToWhatsApp(whatsappNumber) {
    const whatsappMessage = encodeURIComponent(
        `Hi ExamGuard Support! 👋\n\nI was chatting with your AI assistant and need human support.\n\nPlease help me!`
    );
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappURL, '_blank');
}

// Export for external use
window.escalateToWhatsApp = escalateToWhatsApp;
