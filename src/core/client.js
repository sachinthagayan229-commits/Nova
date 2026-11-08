
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

import { config } from '../config.js';
import fs from 'fs';
import pino from 'pino';

export async function startBot() {
    console.log('🔌 Connecting to WhatsApp...');

    // Create folders
    fs.mkdirSync(config.authDir, { recursive: true });
    fs.mkdirSync(config.downloadDir, { recursive: true });

    // Load authentication
    const { state, saveCreds } =
        await useMultiFileAuthState(config.authDir);

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Nova MD', 'Chrome', '20.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;

            console.log('❌ Connection closed:', statusCode);

            if (shouldReconnect) {
                console.log('🔄 Reconnecting...');
                setTimeout(() => startBot(), 5000);
            } else {
                console.log('⚠️ Logged out. New authentication required.');
            }
        }

        if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
            console.log('🤖 Bot:', config.botName);
            console.log('📝 Prefix:', config.prefix);
            console.log('🎉 NOVA MD is Ready!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message) continue;

            const sender = msg.key.remoteJid;
            if (!sender) continue;

            const senderNumber = sender.split('@')[0];

            const messageText =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                '';

            if (!messageText.startsWith(config.prefix)) continue;

            const parts = messageText
                .slice(config.prefix.length)
                .trim()
                .split(/\s+/);

            const command = parts.shift()?.toLowerCase();

            if (!command) continue;

            const args = parts;

            console.log(`📨 Command: ${command}`);

            try {
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
`🤖 *${config.botName}*

📝 Prefix: ${config.prefix}

*COMMANDS*

• .ping
• .test
• .menu

✨ NOVA MD`
                        }, { quoted: msg });
                        break;

                    default:
                        await sock.sendMessage(sender, {
                            text: `❌ Unknown command: ${command}`
                        }, { quoted: msg });
                }
            } catch (error) {
                console.error('Command Error:', error);
            }
        }
    });

    return sock;
}
