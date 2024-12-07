class ChatBot {
    constructor() {
        this.history = [];
        this.init();
    }

    init() {
        this.orb = document.getElementById('chat-orb');
        this.container = document.getElementById('chat-container');
        this.messagesDiv = document.getElementById('chat-messages');
        this.input = document.getElementById('user-input');
        this.setupEventListeners();
        this.sendWelcomeMessage();
        this.setupOrbAnimation();
    }

    setupOrbAnimation() {
        const orb = document.querySelector('.orb');
        let glowIntensity = 0;
        let increasing = true;
    
        setInterval(() => {
            if (increasing) {
                glowIntensity += 0.05;
                if (glowIntensity >= 1) {
                    increasing = false;
                }
            } else {
                glowIntensity -= 0.05;
                if (glowIntensity <= 0) {
                    increasing = true;
                }
            }
    
            // Apply box-shadow directly around the resized orb
            orb.style.boxShadow = `0 0 ${10 * glowIntensity}px rgba(108, 92, 231, ${0.3 + (glowIntensity * 0.4)})`;
            
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

        // Add input focus animation
        this.input.addEventListener('focus', () => {
            this.input.style.boxShadow = '0 0 10px rgba(108, 92, 231, 0.3)';
        });

        this.input.addEventListener('blur', () => {
            this.input.style.boxShadow = 'none';
        });
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.input.value = '';
        this.input.style.height = '40px'; // Reset height after sending

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        this.messagesDiv.appendChild(messageDiv);

        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.textContent = '...';
        messageDiv.appendChild(typingIndicator);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: this.history.slice(-10)
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            let botResponse = '';
            let isDone = false;

            // Remove typing indicator
            messageDiv.removeChild(typingIndicator);

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
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.style.color = '#ff6b6b';
        }

        // Ensure scroll to bottom after complete response
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    addMessage(role, content) {
        this.history.push({ role, content });
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        
        // Add animation class
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        this.messagesDiv.appendChild(messageDiv);
        
        // Trigger animation
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
        
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    toggleChat(show) {
        this.orb.classList.toggle('hidden', show);
        this.container.classList.toggle('hidden', !show);
        
        if (show) {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(20px)';
            setTimeout(() => {
                this.container.style.transition = 'all 0.3s ease';
                this.container.style.opacity = '1';
                this.container.style.transform = 'translateY(0)';
            }, 50);
        }
    }

    restartChat() {
        // Add fade-out animation
        this.messagesDiv.style.opacity = '0';
        setTimeout(() => {
            this.history = [];
            this.messagesDiv.innerHTML = '';
            // Add fade-in animation
            this.messagesDiv.style.transition = 'opacity 0.3s ease';
            this.messagesDiv.style.opacity = '1';
            this.sendWelcomeMessage();
        }, 300);
    }

    sendWelcomeMessage() {
        this.addMessage('assistant', 'Hello! How can I help you with our product today?');
    }
}

// Initialize chatbot
new ChatBot();

// Add some global error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', {msg, url, lineNo, columnNo, error});
    return false;
};

// Handle promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
