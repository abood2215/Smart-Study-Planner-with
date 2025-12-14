/**
 * Chat Widget JavaScript
 * Smart Study Planner AI Assistant
 */

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
        this.loadChatHistory();
        console.log('✅ ChatBot Widget initialized successfully');
    }

    createWidget() {
        const widgetHTML = `
            <div class="chat-widget">
                <button class="chat-button" title="Chat with AI Assistant">
                    <span>💬</span>
                </button>
                
                <div class="chat-window">
                    <div class="chat-header">
                        <h3>Study Assistant</h3>
                        <button class="chat-header-close" title="Close">✕</button>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                        <div class="message bot">
                            <div class="message-content">
                                👋 <strong>Welcome!</strong><br>I'm your AI Study Assistant. Ask me about:
                                <br>• Study tips & strategies
                                <br>• Course explanations
                                <br>• Time management
                                <br>• Motivation & encouragement
                                <br><br>How can I help you today?
                            </div>
                        </div>
                    </div>
                    
                    <div class="chat-input-area">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Ask me anything..."
                            autocomplete="off"
                        >
                        <button class="chat-send-btn" id="chatSendBtn" title="Send">➤</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    attachEventListeners() {
        const chatButton = document.querySelector('.chat-button');
        const closeButton = document.querySelector('.chat-header-close');
        const sendButton = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeButton.addEventListener('click', () => this.closeChat());
        sendButton.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        chatInput.addEventListener('focus', () => {
            document.querySelector('.chat-window').style.boxShadow = 
                '0 5px 40px rgba(102, 126, 234, 0.3)';
        });

        chatInput.addEventListener('blur', () => {
            document.querySelector('.chat-window').style.boxShadow = 
                '0 5px 40px rgba(0, 0, 0, 0.16)';
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        const chatWindow = document.querySelector('.chat-window');
        const chatButton = document.querySelector('.chat-button');
        
        chatWindow.classList.add('active');
        chatButton.classList.add('active');
        
        document.getElementById('chatInput').focus();
    }

    closeChat() {
        this.isOpen = false;
        const chatWindow = document.querySelector('.chat-window');
        const chatButton = document.querySelector('.chat-button');
        
        chatWindow.classList.remove('active');
        chatButton.classList.remove('active');
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Check authentication
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.addMessage('Please log in first to use the AI assistant!', 'bot');
            return;
        }

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        input.focus();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            console.error('Chat error:', error);
            this.addMessage(
                '😊 I encountered a small error. Here are some study tips: Break your tasks into smaller chunks, use the Pomodoro technique (25 min focus + 5 min break), and take regular breaks!',
                'bot'
            );
        }

        // Save to history
        this.saveChatHistory();
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(text)}
                <span class="message-time">${time}</span>
            </div>
        `;

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        this.messages.push({
            text: text,
            sender: sender,
            time: time
        });
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;

        messagesDiv.appendChild(typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(message) {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            return "Please log in to use the AI assistant!";
        }

        try {
            // Get the correct API path based on current location
            const currentPath = window.location.pathname;
            let apiPath = 'api/chatbot.php';
            
            // If we're in the root or need absolute path
            if (!currentPath.includes('/frontend/')) {
                apiPath = '/Smart-Study-Planner-with/api/chatbot.php';
            }
            
            console.log('📡 Calling API:', apiPath);
            console.log('🔐 Token:', token.substring(0, 20) + '...');

            const response = await fetch(apiPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: message
                })
            });

            console.log('📊 API Response Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                
                if (response.status === 401) {
                    return "Authentication failed. Please log in again!";
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ API Response Data:', data);

            if (data.success) {
                return data.data.response;
            } else {
                return data.message || "Unable to get response. Please try again.";
            }
        } catch (error) {
            console.error('❌ Chat API Error:', error);
            // Return fallback response
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const msg = message.toLowerCase();

        // Arabic keywords
        if (msg.includes('مرحبا') || msg.includes('هلا') || msg.includes('السلام')) {
            return "مرحباً! أنا مساعدك الدراسي. كيف يمكنني مساعدتك اليوم؟ 📚";
        }

        if (msg.includes('كيف') || msg.includes('كيفية')) {
            return "يمكنني مساعدتك في تقنيات الدراسة! ما الموضوع المحدد؟ 📖";
        }

        if (msg.includes('تحفيز') || msg.includes('متعب') || msg.includes('إرهاق')) {
            return "تذكر: كل خطوة مهمة! قسّم مهامك وخذ فترات راحة. أنت تستطيع! 💪";
        }

        if (msg.includes('مهمة') || msg.includes('واجب')) {
            return "أخبرني أكثر عن مهمتك - المادة، الموعد، والتقدم الحالي؟ ✅";
        }

        if (msg.includes('جدول') || msg.includes('وقت') || msg.includes('إدارة')) {
            return "تقنية بومودورو مفيدة جداً! (25 دقيقة دراسة + 5 دقائق راحة) ⏰";
        }

        // English keywords
        if (msg.includes('hello') || msg.includes('hi')) {
            return "Hello! I'm your Study Assistant. How can I help you with your studies today? You can ask me about courses, tasks, scheduling, or study tips.";
        }

        if (msg.includes('how to') || msg.includes('how do i')) {
            return "I can help you with study techniques and strategies! What specific topic would you like help with? Please describe what you're trying to learn, and I'll provide guidance.";
        }

        if (msg.includes('motivation') || msg.includes('tired')) {
            return "Remember, every small step counts! Break your tasks into smaller chunks, take breaks, and celebrate your progress. You've got this! 💪";
        }

        if (msg.includes('task') || msg.includes('assignment')) {
            return "Tell me more about your task - what's the subject, deadline, and current progress? This will help me give you better suggestions.";
        }

        if (msg.includes('schedule') || msg.includes('time')) {
            return "Time management is key! Try the Pomodoro technique (25 min study + 5 min break). Use the Schedule feature to plan your study sessions.";
        }

        if (msg.includes('python')) {
            return "Python is great! Start with basics: variables, data types, control flow. Then practice writing small programs.";
        }

        if (msg.includes('javascript')) {
            return "JavaScript powers web interactivity! Master DOM manipulation and functions. Would you like specific tips?";
        }

        if (msg.includes('database') || msg.includes('sql')) {
            return "Databases are crucial! Learn SQL basics: SELECT, INSERT, UPDATE, DELETE. Practice with real data!";
        }

        return "هذا سؤال مثير! أخبرني أكثر عن موضوع الدراسة وسأساعدك بشكل أفضل. / That's interesting! Tell me more about your studies and I'll help better.";
    }

    saveChatHistory() {
        localStorage.setItem(
            'chatHistory',
            JSON.stringify(this.messages)
        );
    }

    loadChatHistory() {
        const history = localStorage.getItem('chatHistory');
        // Optionally load previous messages
        // For now, we start fresh each session
    }

    clearChatHistory() {
        localStorage.removeItem('chatHistory');
        this.messages = [];
        document.getElementById('chatMessages').innerHTML = `
            <div class="message bot">
                <div class="message-content">
                    Chat history cleared. How can I help you?
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new ChatWidget();
    window.chatWidget = chatWidget;
});
