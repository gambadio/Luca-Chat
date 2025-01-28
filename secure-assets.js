// secure-assets.js
import JavaScriptObfuscator from 'javascript-obfuscator';
import { minify } from 'uglify-js';
import CleanCSS from 'clean-css';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for secured files
const fileCache = new Map();

// Generate secure filename
function generateSecureFilename(prefix) {
    return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

// Clean and minify CSS
async function secureCSS(source) {
    const cleanCSS = new CleanCSS({
        level: {
            1: {
                all: true,
                normalizeUrls: false
            },
            2: {
                restructureRules: true
            }
        }
    });
    
    return cleanCSS.minify(source).styles;
}

// Obfuscate and minify JS
async function secureJS(source) {
    const minified = minify(source).code;
    
    return JavaScriptObfuscator.obfuscate(minified, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.7,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        shuffleStringArray: true,
        splitStrings: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    }).getObfuscatedCode();
}

export async function getSecureAsset(type) {
    try {
        // Check cache first
        if (fileCache.has(type)) {
            return fileCache.get(type);
        }

        const filename = type === 'css' ? 'styles.css' : 'chat.js';
        const source = await fs.readFile(
            path.join(__dirname, 'public', filename), 
            'utf8'
        );

        const secured = type === 'css' 
            ? await secureCSS(source)
            : await secureJS(source);

        // Cache the result
        fileCache.set(type, secured);
        return secured;

    } catch (error) {
        console.error(`Error securing ${type}:`, error);
        throw error;
    }
}

// Generate secure URLs for assets
export function generateSecureUrls() {
    const jsUrl = `/assets/${generateSecureFilename('chat')}.js`;
    const cssUrl = `/assets/${generateSecureFilename('styles')}.css`;
    return { jsUrl, cssUrl };
}