// server.js
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

let productInfo;
try {
    productInfo = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'product-info.json'), 'utf-8'));
} catch (error) {
    console.error('Error reading product info:', error);
    productInfo = {};
}

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

app.use(express.json());
app.use(express.static('public'));
app.use(cors({
    origin: process.env.ALLOWED_DOMAIN || 'http://localhost:8080'
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const formattedMessages = [
            systemPrompt,
            ...history || [],
            { role: 'user', content: message }
        ];

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: formattedMessages,
            stream: true,
            max_tokens: 2000,
            temperature: 0.7
        });

        for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
                res.write(`data: ${JSON.stringify({ content: chunk.choices[0].delta.content })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`);
        res.end();
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
