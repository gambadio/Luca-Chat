# Luca Chat - AI Chatbot Integration

A powerful and customizable AI chatbot integration that can be easily embedded into any website. Built with Node.js and powered by OpenRouter's AI models, this project provides a seamless chat experience for your users.

## 🌟 Features

- Modern and responsive chat interface
- Easy website integration
- Powered by state-of-the-art AI models through OpenRouter
- Rate limiting and security features
- Customizable styling
- Asset protection and obfuscation

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- An OpenRouter API key
- A Vercel account (for deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/luca-chat.git
cd luca-chat
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 🔑 Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate a new API key
5. Add the API key to your `.env` file

## 🌐 Deploying to Vercel

1. Fork this repository to your GitHub account
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository to Vercel
4. Add the following environment variables in your Vercel project settings:
   - `OPENROUTER_API_KEY`
   - `NODE_ENV=production`
5. Deploy the project

## 💻 Website Integration

Add the chatbot to your website by including the following code:

```html
<script src="https://your-vercel-deployment-url/chat.js"></script>
<link rel="stylesheet" href="https://your-vercel-deployment-url/styles.css">

<!-- Add the chat container wherever you want the chat to appear -->
<div id="chat-container"></div>
```

### Customizing the Chat Style

You can customize the chat appearance by overriding the CSS variables in your website's stylesheet:

```css
:root {
  --chat-primary-color: #007bff;
  --chat-background: #ffffff;
  --chat-text-color: #333333;
  /* Add more custom variables as needed */
}
```

## 🛡️ Security Features

- Rate limiting to prevent abuse
- Asset protection and obfuscation
- CORS configuration
- Environment variable protection

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Bug Reports

If you find a bug, please create an issue in the GitHub repository with:
1. A clear description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)

## 📞 Support

For support or questions, please create an issue in the GitHub repository. 