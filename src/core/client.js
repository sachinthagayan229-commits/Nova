
// ==========================================
// NOVA MD - WhatsApp Core Client
// QR Code Login + Auto Reconnect
// ==========================================

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

import { config } from '../config.js';

import fs from 'fs';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

// ==========================================
// START BOT
// ==========================================

let reconnectTimer = null;
let isStarting = false;

export async function startBot() {

    if (isStarting) return;
    isStarting = true;

    try {

        console.log('\n================================');
        console.log('🤖 NOVA MD STARTING');
        console.log('================================');

        // Create folders
        const authDir = config.authDir || './session';
        const downloadDir = config.downloadDir || './downloads';

        fs.mkdirSync(authDir, { recursive: true });
        fs.mkdirSync(downloadDir, { recursive: true });

        // Load WhatsApp authentication
        const { state, saveCreds } =
            await useMultiFileAuthState(authDir);

        // Get latest Baileys version
        const { version } =
            await fetchLatestBaileysVersion();

        console.log('📦 Baileys Version:', version.join('.'));
        console.log('🔌 Connecting to WhatsApp...');

        // Create socket
        const sock = makeWASocket({

            version,

            auth: state,

            logger: pino({
                level: 'silent'
            }),

            printQRInTerminal: false,

            browser: [
                'NOVA MD',
                'Chrome',
                '20.0.0'
            ],

            connectTimeoutMs: 60000,

            defaultQueryTimeoutMs: 60000,

            keepAliveIntervalMs: 25000,

            retryRequestDelayMs: 250

        });

        // Save authentication credentials
        sock.ev.on('creds.update', saveCreds);

        // ==========================================
        // CONNECTION EVENTS
        // ==========================================

        sock.ev.on('connection.update', async (update) => {

            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            // QR CODE
            if (qr) {

                console.log('\n================================');
                console.log('📱 NOVA MD QR CODE');
                console.log('================================\n');

                qrcode.generate(qr, {
                    small: true
                });

                console.log('\n================================');
                console.log('📲 OPEN WHATSAPP');
                console.log('Linked Devices > Link a Device');
                console.log('Scan the QR Code above');
                console.log('================================\n');

            }

            // CONNECTED
            if (connection === 'open') {

                isStarting = false;

                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }

                console.log('\n================================');
                console.log('✅ NOVA MD CONNECTED!');
                console.log('🤖 Bot Name: NOVA MD');
                console.log('📱 Number:', sock.user?.id?.split(':')[0]);
                console.log('📝 Prefix:', config.prefix);
                console.log('================================\n');

            }

            // DISCONNECTED
            if (connection === 'close') {

                isStarting = false;

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                console.log('\n❌ WhatsApp Connection Closed');
                console.log('Status:', statusCode || 'Unknown');

                if (statusCode === DisconnectReason.loggedOut) {

                    console.log(
                        '⚠️ Session logged out. Please create a new login.'
                    );

                    return;
                }

                console.log('🔄 Reconnecting in 5 seconds...');

                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                }

                reconnectTimer = setTimeout(() => {
                    startBot();
                }, 5000);

            }

        });

        // ==========================================
        // MESSAGE HANDLER
        // ==========================================

        sock.ev.on('messages.upsert', async ({ messages, type }) => {

            if (type !== 'notify') return;

            for (const msg of messages) {

                try {

                    if (!msg.message) continue;

                    const sender = msg.key.remoteJid;

                    if (!sender) continue;

                    if (sender === 'status@broadcast') continue;

                    // Get message text
                    const messageText =
                        msg.message.conversation ||
                        msg.message.extendedTextMessage?.text ||
                        msg.message.imageMessage?.caption ||
                        msg.message.videoMessage?.caption ||
                        msg.message.documentMessage?.caption ||
                        '';

                    if (!messageText) continue;

                    const prefix = config.prefix || '.';

                    // Check command prefix
                    if (!messageText.startsWith(prefix)) continue;

                    // Parse command
                    const commandText =
                        messageText.slice(prefix.length).trim();

                    if (!commandText) continue;

                    const args = commandText.split(/\s+/);

                    const command = args.shift().toLowerCase();

                    const senderNumber = sender.split('@')[0];

                    const isGroup = sender.endsWith('@g.us');

                    console.log(
                        `📨 Command: ${command} | From: ${senderNumber}`
                    );

                    // ==================================
                    // COMMANDS
                    // ==================================

                    switch (command) {

                        // PING
                        case 'ping': {

                            const timestamp =
                                Number(msg.messageTimestamp || 0) * 1000;

                            const latency = timestamp
                                ? Math.max(0, Date.now() - timestamp)
                                : 0;

                            await sock.sendMessage(sender, {
                                text: `🏓 *NOVA MD PONG!*\n\n⚡ Bot is online\n⏱️ Message age: ${latency} ms`
                            }, {
                                quoted: msg
                            });

                            break;
                        }

                        // TEST
                        case 'test': {

                            await sock.sendMessage(sender, {
                                text: '✅ NOVA MD is working successfully!'
                            }, {
                                quoted: msg
                            });

                            break;
                        }

                        // ALIVE
                        case 'alive': {

                            await sock.sendMessage(sender, {
                                text: '🤖 *NOVA MD is alive now!*\n\n✅ WhatsApp Connected\n⚡ Bot is Running'
                            }, {
                                quoted: msg
                            });

                            break;
                        }

                        // MENU
                        case 'menu':
                        case 'help': {

                            const menu = `
╭━━━━━━━━━━━━━━━━━━╮
       🤖 *NOVA MD*
╰━━━━━━━━━━━━━━━━━━╯

👋 Hello! Welcome to NOVA MD

┏━━━〔 GENERAL 〕━━━
┃
┃ 01. .ping
┃ 02. .test
┃ 03. .alive
┃ 04. .menu
┃
┗━━━━━━━━━━━━━━━━━━

⚡ *Status:* Online
📝 *Prefix:* ${prefix}
📱 *Platform:* WhatsApp

╭━━━━━━━━━━━━━━━━━━╮
       NOVA MD BOT
╰━━━━━━━━━━━━━━━━━━╯
`;

                            await sock.sendMessage(sender, {
                                text: menu
                            }, {
                                quoted: msg
                            });

                            break;
                        }

                        // UNKNOWN COMMAND
                        default: {

                            await sock.sendMessage(sender, {
                                text: `❌ Unknown command: ${command}\n\nType ${prefix}menu to see commands.`
                            }, {
                                quoted: msg
                            });

                            break;
                        }

                    }

                } catch (error) {

                    console.error(
                        '❌ Message Handler Error:',
                        error.message
                    );

                }

            }

        });

        return sock;

    } catch (error) {

        isStarting = false;

        console.error(
            '❌ BOT START ERROR:',
            error.message
        );

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }

        reconnectTimer = setTimeout(() => {
            startBot();
        }, 10000);

    }

}
