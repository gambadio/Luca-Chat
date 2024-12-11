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
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : '*',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Load system prompt
let systemPrompt;
try {
    systemPrompt = {
        role: "system",
        content: await fs.readFile(path.join(__dirname, 'data', 'system-prompt.txt'), 'utf-8')
    };
} catch (error) {
    console.error('Error: System prompt file could not be read:', error);
    process.exit(1);
}

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.ALLOWED_DOMAINS || "http://localhost:8080",
        "X-Title": "Green Hockey Assistant"
    }
});

// Routes
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
            model: 'anthropic/claude-3.5-sonnet',
            messages: formattedMessages,
            stream: true,
            max_tokens: 2000,
            temperature: 0.2
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server in development, export app for Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Global error handlers
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

export default app;
