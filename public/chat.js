class ChatBot {
    constructor() {
        // Verify domain on initialization
        if (!this.verifyDomain()) {
            console.error('Unauthorized domain');
            return;
        }
        
        this.history = [];
        this.token = window.chatToken; // Get token from window object
        this.init();
        this.setupOrbAnimation();
    }

    verifyDomain() {
        const allowedDomains = [
            'https://luca-chat.vercel.app',
            'http://localhost:8080',
            'http://127.0.0.1:8080'
        ];
        
        const currentDomain = window.location.origin;
        
        // Allow localhost in development
        if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
            return true;
        }
        
        return allowedDomains.includes(currentDomain);
    }

    init() {
        if (!this.verifyDomain()) return;

        this.orb = document.getElementById('chat-orb');
        this.container = document.getElementById('chat-container');
        this.messagesDiv = document.getElementById('chat-messages');
        this.input = document.getElementById('user-input');
        this.setupEventListeners();
        this.sendWelcomeMessage();
    }

    setupOrbAnimation() {
        let glowIntensity = 0;
        let increasing = true;
        
        setInterval(() => {
            if (increasing) {
                glowIntensity += 2;
                if (glowIntensity >= 30) increasing = false;
            } else {
                glowIntensity -= 2;
                if (glowIntensity <= 20) increasing = true;
            }
            
            this.orb.querySelector('.orb').style.boxShadow = 
                `0 0 ${glowIntensity}px rgba(110, 59, 255, 0.${Math.floor(glowIntensity/10)})`;
        }, 50);
    }

    setupEventListeners() {
        this.orb.addEventListener('click', () => this.toggleChat(true));
        document.getElementById('minimize-chat').addEventListener('click', () => this.toggleChat(false));
        document.getElementById('restart-chat').addEventListener('click', () => this.restartChat());
        
        document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.input.addEventListener('focus', () => {
            this.input.style.borderColor = 'rgba(110, 59, 255, 0.5)';
            this.input.style.boxShadow = '0 0 10px rgba(110, 59, 255, 0.2)';
        });

        this.input.addEventListener('blur', () => {
            this.input.style.borderColor = 'rgba(110, 59, 255, 0.3)';
            this.input.style.boxShadow = 'none';
        });
    }

    async sendMessage() {
        if (!this.verifyDomain()) return;

        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.input.value = '';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        
        const typingDots = document.createElement('div');
        typingDots.className = 'typing-animation';
        typingDots.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        messageDiv.appendChild(typingDots);
        
        this.messagesDiv.appendChild(messageDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;

        try {
            // Get the base URL
            const baseUrl = window.location.origin;
            
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Access-Token': this.token || 'dev-token' // Use dev-token in development
                },
                body: JSON.stringify({
                    message,
                    history: this.history.slice(-10)
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            let botResponse = '';
            let isDone = false;

            messageDiv.removeChild(typingDots);

            while (!isDone) {
                const { done, value } = await reader.read();
                
                if (done) {
                    isDone = true;
                    break;
                }

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(5).trim();
                        
                        if (data === '[DONE]') {
                            isDone = true;
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) throw new Error(parsed.error);
                            if (parsed.content) {
                                botResponse += parsed.content;
                                messageDiv.textContent = botResponse;
                                this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                            continue;
                        }
                    }
                }
            }

            if (botResponse) {
                this.history.push({ role: 'assistant', content: botResponse });
                if (this.history.length > 10) this.history.shift();
            }

        } catch (error) {
            console.error('Error:', error);
            messageDiv.innerHTML = `
                <div class="error-message">
                    An error occurred. Please try again.
                    <button onclick="this.parentElement.parentElement.remove()">✕</button>
                </div>
            `;
        }

        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    addMessage(role, content) {
        this.history.push({ role, content });
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        this.messagesDiv.appendChild(messageDiv);
        
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    toggleChat(show) {
        this.container.style.transition = 'all 0.3s ease';
        this.orb.style.transition = 'all 0.3s ease';

        if (show) {
            this.orb.style.opacity = '0';
            this.orb.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.orb.classList.add('hidden');
                this.container.classList.remove('hidden');
                requestAnimationFrame(() => {
                    this.container.style.opacity = '1';
                    this.container.style.transform = 'translateY(0) scale(1)';
                });
            }, 300);
        } else {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(20px) scale(0.9)';
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.orb.classList.remove('hidden');
                requestAnimationFrame(() => {
                    this.orb.style.opacity = '1';
                    this.orb.style.transform = 'scale(1)';
                });
            }, 300);
        }
    }

    restartChat() {
        this.messagesDiv.style.opacity = '0';
        this.messagesDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.history = [];
            this.messagesDiv.innerHTML = '';
            
            this.messagesDiv.style.transition = 'all 0.3s ease';
            this.messagesDiv.style.opacity = '1';
            this.messagesDiv.style.transform = 'translateY(0)';
            
            this.sendWelcomeMessage();
        }, 300);
    }

    sendWelcomeMessage() {
        this.addMessage('assistant', 'Hello! How can I help you with our product today?');
    }
}

// Initialize chatbot
const chatbot = new ChatBot();

// Global error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', {msg, url, lineNo, columnNo, error});
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});