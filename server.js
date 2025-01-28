// server.js
import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import url from 'url';
import crypto from 'crypto';
import { getSecureAsset, generateSecureUrls } from './secure-assets.js';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 8080;

// Parse allowed domains from env
const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];

// Generate unique tokens for allowed domains
const domainTokens = new Map();
allowedDomains.forEach(domain => {
    domainTokens.set(domain, crypto.randomBytes(32).toString('hex'));
});

// Rate limiters
const assetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20
});

// Generate secure URLs for assets
const secureUrls = generateSecureUrls();

// Load product info
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
        "HTTP-Referer": process.env.ALLOWED_DOMAINS,
        "X-Title": "RoboMaid Assistant"
    }
});

// Near the top after dotenv.config()
const isDevelopment = process.env.NODE_ENV === 'development';

// Middleware for domain verification
const verifyDomain = (req, res, next) => {
    if (isDevelopment) {
        next();
        return;
    }

    const token = req.headers['x-access-token'];
    const referer = req.headers.referer || req.headers.origin;
    
    if (!referer || !token) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const domain = new URL(referer).origin;
    
    if (!allowedDomains.includes(domain) || domainTokens.get(domain) !== token) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    next();
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

app.use(cors({
    origin: function(origin, callback) {
        if (isDevelopment) {
            // Allow all origins in development
            callback(null, true);
        } else if (!origin || allowedDomains.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Access-Token']
}));


// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/verify-domain', (req, res) => {
    if (isDevelopment) {
        // Return a dummy token in development
        return res.json({ token: 'dev-token' });
    }

    const referer = req.headers.referer || req.headers.origin;
    
    if (!referer) {
        return res.status(403).json({ error: 'Missing origin' });
    }

    const domain = new URL(referer).origin;
    
    if (!allowedDomains.includes(domain)) {
        return res.status(403).json({ error: 'Unauthorized domain' });
    }

    const token = domainTokens.get(domain);
    res.json({ token });
});

app.get('/chat-assets', (req, res) => {
    res.json(secureUrls);
});

app.get(secureUrls.jsUrl, verifyDomain, assetLimiter, async (req, res) => {
    try {
        const secureJS = await getSecureAsset('js');
        
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        res.send(secureJS);
    } catch (error) {
        console.error('Error serving JS:', error);
        res.status(500).send('Error loading script');
    }
});

app.get(secureUrls.cssUrl, verifyDomain, assetLimiter, async (req, res) => {
    try {
        const secureCSS = await getSecureAsset('css');
        
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        res.send(secureCSS);
    } catch (error) {
        console.error('Error serving CSS:', error);
        res.status(500).send('Error loading styles');
    }
});

app.post('/api/chat', verifyDomain, chatLimiter, async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Log the request in development
        if (isDevelopment) {
            console.log('Chat request:', { message, history });
        }

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

// Error handling
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_REACHED') {
        return res.status(429).json({
            error: 'Rate limit exceeded'
        });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Global error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});