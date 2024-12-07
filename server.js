import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 8080;

// Read product info
let productInfo;
try {
    productInfo = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'product-info.json'), 'utf-8'));
} catch (error) {
    console.error('Error reading product info:', error);
    productInfo = {};
}

// System prompt with product info
const systemPrompt = {
    role: "system",
    content: `You are RoboMaid Assistant, a helpful product specialist for the RoboMaid X2000. 
    Your role is to assist customers with questions about our robotic house maid.
    
    Product Information:
    ${JSON.stringify(productInfo)}
    
    Guidelines:
    - Be friendly and professional
    - Only discuss RoboMaid X2000 related topics
    - If asked about unrelated topics, politely redirect to RoboMaid features
    - Don't make up information not in the product details
    - Keep responses concise and focused`
};

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.ALLOWED_DOMAIN || "http://localhost:8080",
        "X-Title": "RoboMaid Assistant"
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors({
    origin: process.env.ALLOWED_DOMAIN || 'http://localhost:8080'
}));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const formattedMessages = [
            {
                role: "system",
                content: [{ type: "text", text: systemPrompt.content }]
            },
            ...history.map(msg => ({
                role: msg.role,
                content: [{ type: "text", text: msg.content }]
            })),
            {
                role: 'user',
                content: [{ type: "text", text: message }]
            }
        ];

        const stream = await openai.chat.completions.create({
            model: 'anthropic/claude-3.5-sonnet',
            messages: formattedMessages,
            max_tokens: 2000,
            temperature: 0.7,
            stream: true
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Press Ctrl + C to stop the server');
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
