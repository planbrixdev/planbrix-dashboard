const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Client State
let clientInfo = {
    connected: false,
    phone: null,
    name: null,
    platform: null
};
let currentQR = null;
let isInitializing = false;

// Create WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Event Handlers
client.on('loading_screen', (percent, message) => {
    console.log('Loading:', percent, '%', message);
});

client.on('qr', async (qr) => {
    console.log('QR Code received');
    try {
        // Generate QR code as base64 data URL
        currentQR = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        console.log('QR Code generated successfully');
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
});

client.on('authenticated', () => {
    console.log('WhatsApp authenticated');
    currentQR = null;
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
    clientInfo = {
        connected: false,
        phone: null,
        name: null,
        platform: null
    };
});

client.on('ready', async () => {
    console.log('WhatsApp client is ready!');

    try {
        const info = client.info;
        clientInfo = {
            connected: true,
            phone: info.wid.user,
            name: info.pushname,
            platform: info.platform
        };
        currentQR = null;
        console.log('Connected as:', clientInfo.name, '(', clientInfo.phone, ')');
    } catch (err) {
        console.error('Error getting client info:', err);
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
    clientInfo = {
        connected: false,
        phone: null,
        name: null,
        platform: null
    };
    currentQR = null;

    // Reinitialize client after disconnect
    setTimeout(() => {
        console.log('Reinitializing client...');
        initializeClient();
    }, 5000);
});

client.on('message', async (msg) => {
    console.log('Message received:', msg.body);

    // Simple auto-reply for testing
    if (msg.body === '!ping') {
        await msg.reply('pong 🏓');
    }

    if (msg.body === '!info') {
        await msg.reply(`*Planbrix Bot*\nConnected: ✅\nServer: Running`);
    }
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json(clientInfo);
});

app.get('/api/qr', (req, res) => {
    if (clientInfo.connected) {
        res.json({ qr: null, message: 'Already connected' });
    } else if (currentQR) {
        res.json({ qr: currentQR });
    } else {
        res.json({ qr: null, message: 'QR code not available yet' });
    }
});

app.post('/api/disconnect', async (req, res) => {
    try {
        await client.logout();
        clientInfo = {
            connected: false,
            phone: null,
            name: null,
            platform: null
        };
        currentQR = null;
        res.json({ success: true, message: 'Disconnected successfully' });
    } catch (err) {
        console.error('Error disconnecting:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/info', (req, res) => {
    if (clientInfo.connected && client.info) {
        res.json({
            ...clientInfo,
            wwebVersion: client.info.wwebVersion || 'Unknown'
        });
    } else {
        res.json({ connected: false });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize client
async function initializeClient() {
    if (isInitializing) {
        console.log('Client is already initializing...');
        return;
    }

    isInitializing = true;
    try {
        console.log('Initializing WhatsApp client...');
        await client.initialize();
    } catch (err) {
        console.error('Error initializing client:', err);
    } finally {
        isInitializing = false;
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 WhatsApp Server running on http://localhost:${PORT}`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET  /api/status     - Get connection status`);
    console.log(`  GET  /api/qr         - Get QR code for pairing`);
    console.log(`  POST /api/disconnect - Disconnect session`);
    console.log(`  GET  /api/info       - Get WhatsApp account info`);
    console.log(`  GET  /health         - Health check\n`);

    // Initialize WhatsApp client
    initializeClient();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    try {
        await client.destroy();
    } catch (err) {
        console.error('Error destroying client:', err);
    }
    process.exit(0);
});
