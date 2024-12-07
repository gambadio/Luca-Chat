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
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.input.value = '';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        this.messagesDiv.appendChild(messageDiv);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: this.history.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });

            const reader = response.body.getReader();
            let botResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(5);
                        if (data === '[DONE]') continue;
                        
                        const { content } = JSON.parse(data);
                        botResponse += content;
                        messageDiv.textContent = botResponse;
                        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
                    }
                }
            }

            this.history.push({ role: 'assistant', content: botResponse });
            if (this.history.length > 10) this.history.shift();
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'An error occurred. Please try again.';
        }
    }

    addMessage(role, content) {
        this.history.push({ role, content });
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        this.messagesDiv.appendChild(messageDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    toggleChat(show) {
        this.orb.classList.toggle('hidden', show);
        this.container.classList.toggle('hidden', !show);
    }

    restartChat() {
        this.history = [];
        this.messagesDiv.innerHTML = '';
        this.sendWelcomeMessage();
    }

    sendWelcomeMessage() {
        this.addMessage('bot', 'Hello! How can I help you with our product today?');
    }
}

new ChatBot();
