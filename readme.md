# Luca Chat - AI Chatbot Integration

A modern and responsive AI chatbot integration for customer support. Built with Node.js and powered by OpenRouter's AI models, this chatbot provides seamless product assistance and sustainability-focused customer service.

## 🌟 Features

- Modern and responsive chat interface with sleek animations
- Floating chat orb with pulsing animation
- Powered by Claude 3.5 Sonnet through OpenRouter
- Focus on sustainability and environmental responsibility
- Customizable styling with CSS variables
- Streaming responses for real-time interaction
- Error handling and recovery
- CORS configuration for security

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- An OpenRouter API key
- A domain for deployment (optional)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/gambadio/Luca-Chat

```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
OPENROUTER_API_KEY=your_api_key_here
PORT=8080
NODE_ENV=development
ALLOWED_DOMAINS=http://localhost:8080
```

4. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:8080`

## 🔑 Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate a new API key
5. Add the API key to your `.env` file

## 🌐 Deploying to Production

1. Set up your hosting environment (e.g., Vercel, Heroku, etc.)
2. Add the following environment variables:
   - `OPENROUTER_API_KEY`
   - `NODE_ENV=production`
   - `ALLOWED_DOMAINS` (comma-separated list of allowed domains)
3. Deploy the project

## 💻 Website Integration

Add the chatbot to your website by including the following code:

```html
<script>
(function(w,d,s,o,f,js,fjs){
    w['MyChat']=o;w[o]=w[o]||function(){
        (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id='chatbot-script';
    js.src='https://your-deployment-url/chat.js';
    js.async=1;
    fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','ChatBot'));
</script>
<link rel="stylesheet" href="https://your-deployment-url/styles.css">
```

### Customizing the Chat Style

You can customize the chat appearance by overriding the CSS variables in your website's stylesheet:

```css
:root {
    --primary-color: #00FF00;
    --secondary-color: #006600;
    --text-color: #ffffff;
    --bg-color: rgba(0, 0, 0, 0.95);
    --shadow: 0 2px 20px rgba(0, 255, 0, 0.2);
    --font-family: 'Space Grotesk', sans-serif;
}
```

## 🛡️ Security Features

- CORS configuration for domain protection
- Environment variable protection
- Error handling and recovery
- Rate limiting support (configurable)

## 📝 License

This project is available under a dual license:

### Personal Use
Free to use and modify for personal, non-commercial purposes.

### Commercial Use
For company or commercial use, please contact me.

All rights reserved. 

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Bug Reports

If you find a bug, please create an issue in the GitHub repository with:
1. A clear description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)

