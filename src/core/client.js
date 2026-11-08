
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

let isStarting = false;
let reconnectTimer = null;

export async function startBot() {
    if (isStarting) return;

    isStarting = true;

    try {
        console.log('🔌 Connecting to WhatsApp...');

        // Validate configuration
        const authDir = config.authDir;
        const downloadDir = config.downloadDir;

        if (!authDir || !downloadDir) {
            throw new Error('Authentication or Download directory is missing');
        }

        // Create folders
        fs.mkdirSync(authDir, { recursive: true });
        fs.mkdirSync(downloadDir, { recursive: true });

        // Load Baileys authentication
        const { state, saveCreds } =
            await useMultiFileAuthState(authDir);

        // Get latest compatible Baileys version
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ['NOVA MD', 'Chrome', '20.0.0'],
            markOnlineOnConnect: false,
            syncFullHistory: false
        });

        // Save authentication updates
        sock.ev.on('creds.update', saveCreds);

        // Connection handler
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'connecting') {
                console.log('⏳ Connecting...');
            }

            if (connection === 'open') {
                console.log('================================');
                console.log('✅ WhatsApp Connected!');
                console.log(`🤖 Bot: ${config.botName}`);
                console.log(`📱 Number: ${sock.user?.id?.split(':')[0]}`);
                console.log(`📝 Prefix: ${config.prefix}`);
                console.log('🎉 NOVA MD IS READY!');
                console.log('================================');
            }

            if (connection === 'close') {
                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                console.log('❌ Connection Closed:', statusCode);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('⚠️ Session logged out. New login required.');
                    return;
                }

                if (!reconnectTimer) {
                    console.log('🔄 Reconnecting in 5 seconds...');

                    reconnectTimer = setTimeout(() => {
                        reconnectTimer = null;
                        startBot().catch(console.error);
                    }, 5000);
                }
            }
        });

        // Incoming messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                try {
                    if (!msg.message) continue;

                    const sender = msg.key.remoteJid;

                    if (!sender || sender === 'status@broadcast') continue;

                    const messageText =
                        msg.message.conversation ||
                        msg.message.extendedTextMessage?.text ||
                        msg.message.imageMessage?.caption ||
                        msg.message.videoMessage?.caption ||
                        '';

                    if (!messageText.startsWith(config.prefix)) continue;

                    const parts = messageText
                        .slice(config.prefix.length)
                        .trim()
                        .split(/\s+/);

                    const command = parts.shift()?.toLowerCase();

                    if (!command) continue;

                    const args = parts;

                    const senderNumber = sender.split('@')[0];

                    console.log(`📨 Command: ${command} from ${senderNumber}`);

                    switch (command) {
                        case 'ping':
                            await sock.sendMessage(sender, {
                                text: '🏓 Pong!'
                            }, { quoted: msg });
                            break;

                        case 'test':
                            await sock.sendMessage(sender, {
                                text: '✅ NOVA MD Working!'
                            }, { quoted: msg });
                            break;

                        case 'menu':
                        case 'help':
                            await sock.sendMessage(sender, {
                                text:
`╭━━〔 🤖 ${config.botName} 〕━━╮
┃
┃ ✨ BOT COMMANDS
┃
┃ 🏓 ${config.prefix}ping
┃ 🧪 ${config.prefix}test
┃ 📋 ${config.prefix}menu
┃
┃ 👤 Owner: ${config.ownerNumber || 'Not Set'}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
                            }, { quoted: msg });
                            break;

                        default:
                            await sock.sendMessage(sender, {
                                text: `❌ Unknown command: ${command}`
                            }, { quoted: msg });
                    }

                } catch (error) {
                    console.error('❌ Message Error:', error);
                }
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Client Startup Error:', error);
        throw error;

    } finally {
        isStarting = false;
    }
}
