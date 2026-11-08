// Nova Bot - Core Client
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

export async function startBot() {
    console.log('🔌 Connecting to WhatsApp...');

    // Create session folder
    if (!fs.existsSync(config.AUTH_DIR)) {
        fs.mkdirSync(config.AUTH_DIR, { recursive: true });
    }

    // Create download folder
    if (!fs.existsSync(config.DOWNLOAD_DIR)) {
        fs.mkdirSync(config.DOWNLOAD_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(config.AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Nova MD', 'Chrome', '20.0.0']
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 QR Code received! Scan with WhatsApp');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ Connection closed: ${lastDisconnect?.error?.message}`);
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5 seconds...');
                setTimeout(startBot, 5000);
            }
        }

        if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
            console.log(`🤖 Bot Number: ${sock.user.id.split(':')[0]}`);
            console.log(`📝 Prefix: ${config.PREFIX}`);
            console.log('==========================================');
            console.log('🎉 Bot is Ready! Send commands to test');
            console.log('==========================================');
        }
    });

    // Messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.fromMe && !config.OWNER_NUMBER) continue;

            const sender = msg.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');
            const senderNumber = sender.split('@')[0];

            // Get message text
            const messageText = msg.message?.conversation || 
                               msg.message?.extendedTextMessage?.text || 
                               msg.message?.imageMessage?.caption || 
                               '';

            if (!messageText.startsWith(config.PREFIX)) continue;

            const command = messageText.slice(config.PREFIX.length).trim().split(' ')[0].toLowerCase();
            const args = messageText.slice(config.PREFIX.length + command.length).trim().split(' ');

            console.log(`📨 Command: ${command} from ${senderNumber}`);

            // Basic commands
            switch (command) {
                case 'ping':
                    await sock.sendMessage(sender, { text: `🏓 Pong! ${Date.now() - msg.messageTimestamp * 1000}ms` }, { quoted: msg });
                    break;

                case 'test':
                    await sock.sendMessage(sender, { text: '✅ Bot Working!' }, { quoted: msg });
                    break;

                case 'help':
                case 'menu':
                    await sock.sendMessage(sender, { 
                        text: `🤖 *NOVA MD*\n\n📝 Prefix: ${config.PREFIX}\n\n*Commands:*\n• .ping - Test bot\n• .test - Test bot\n• .help - This menu` 
                    }, { quoted: msg });
                    break;

                default:
                    await sock.sendMessage(sender, { text: `❌ Unknown command: ${command}\nType ${config.PREFIX}help for commands` }, { quoted: msg });
                    break;
            }
        }
    });

    return sock;
}
