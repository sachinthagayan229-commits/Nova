import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Browsers,
  downloadContentStream
} from '@whiskeysockets/baileys';

import pino from 'pino';
import qrcode from 'qrcode-terminal';
import http from 'node:http';

import { config } from './config.js';
import { ensureDirs } from './lib/helpers.js';
import { restoreSessionArchive } from './lib/session.js';

import {
  handleMessages,
  handleGroupEvents
} from './handler.js';

// ✅ OneView Auto Save Function එක
async function handleOneViewAutoSave(sock, msg) {
  try {
    const viewOnceMsg = msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2;
    if (!viewOnceMsg) return;

    const innerMsg = viewOnceMsg.message;
    const imageMsg = innerMsg.imageMessage;
    const videoMsg = innerMsg.videoMessage;
    const audioMsg = innerMsg.audioMessage;

    const sender = msg.key.remoteJid;
    const senderName = msg.pushName || "Unknown";
    const ownerJid = config.ownerNumber + "@s.whatsapp.net";

    if (imageMsg) {
      const stream = await downloadContentStream(viewOnceMsg, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      await sock.sendMessage(ownerJid, {
        image: buffer,
        caption: `📸 OneView Photo Auto Saved!\n👤 From: ${senderName}\n📱 Chat: ${sender}`
      });
    } else if (videoMsg) {
      const stream = await downloadContentStream(viewOnceMsg, 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      await sock.sendMessage(ownerJid, {
        video: buffer,
        caption: `🎥 OneView Video Auto Saved!\n👤 From: ${senderName}\n📱 Chat: ${sender}`
      });
    } else if (audioMsg) {
      const stream = await downloadContentStream(viewOnceMsg, 'audio');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      await sock.sendMessage(ownerJid, {
        audio: buffer,
        mimetype: 'audio/mp4',
        caption: `🎵 OneView Audio Auto Saved!\n👤 From: ${senderName}`
      });
    }
  } catch (error) {
    console.error("OneView Auto Save Error:", error);
  }
}

// ✅ VV Command Function එක
async function handleVVCommand(sock, msg, text) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      await sock.sendMessage(msg.key.remoteJid, 
        { text: "❌ කරුණාකර OneView Photo එකකට Reply කරලා .vv දාන්න!" }, 
        { quoted: msg }
      );
      return true;
    }

    const viewOnceMsg = quoted.viewOnceMessage || quoted.viewOnceMessageV2;
    if (!viewOnceMsg) {
      await sock.sendMessage(msg.key.remoteJid, 
        { text: "❌ මේක OneView Message එකක් නෙවෙයි!" }, 
        { quoted: msg }
      );
      return true;
    }

    const innerMsg = viewOnceMsg.message;
    const imageMsg = innerMsg.imageMessage;
    const videoMsg = innerMsg.videoMessage;

    if (imageMsg) {
      const stream = await downloadContentStream(viewOnceMsg, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      await sock.sendMessage(msg.key.remoteJid, {
        image: buffer,
        caption: "✅ OneView Photo එක"
      }, { quoted: msg });
    } else if (videoMsg) {
      const stream = await downloadContentStream(viewOnceMsg, 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      await sock.sendMessage(msg.key.remoteJid, {
        video: buffer,
        caption: "✅ OneView Video එක"
      }, { quoted: msg });
    } else {
      await sock.sendMessage(msg.key.remoteJid, 
        { text: "❌ මේක Photo/Video එකක් නෙවෙයි!" }, 
        { quoted: msg }
      );
    }
    return true;
  } catch (error) {
    console.error("VV Error:", error);
    await sock.sendMessage(msg.key.remoteJid, 
      { text: "❌ Error එකක් ආවා! " + error.message }, 
      { quoted: msg }
    );
    return true;
  }
}

let currentSocket;
let reconnecting = false;

async function startBot() {

  await ensureDirs();

  await restoreSessionArchive();

  const { state, saveCreds } =
    await useMultiFileAuthState(config.authDir);

  const { version } =
    await fetchLatestBaileysVersion();

  const sock = makeWASocket({

    version,

    auth: state,

    logger: pino({ level: 'silent' }),

    browser: Browsers.ubuntu(config.botName),

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: true

  });

  currentSocket = sock;

  sock.ev.on('creds.update', saveCreds);

  // ✅ Messages Upsert එකට OneView Auto Save + VV Command එක Add කරලා
  sock.ev.on('messages.upsert', async data => {
    try {
      for (const msg of data.messages) {
        if (!msg.message) continue;

        // OneView Auto Save
        await handleOneViewAutoSave(sock, msg);

        // VV Command
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (text.toLowerCase() === ".vv" || text.toLowerCase() === ".viewonce") {
          const handled = await handleVVCommand(sock, msg, text);
          if (handled) continue;
        }
      }
      // Original handler එක Call කරන්න
      await handleMessages(sock, data);
    } catch (error) {
      console.error(error);
    }
  });

  sock.ev.on('group-participants.update', data =>
    handleGroupEvents(sock, data).catch(console.error)
  );

  sock.ev.on('connection.update', async ({
    connection,
    lastDisconnect,
    qr
  }) => {

    if (qr && !config.pairingNumber) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'connecting') {
      console.log('Connecting to WhatsApp...');
    }

    if (connection === 'open') {
      reconnecting = false;

      console.log(`Connected as ${sock.user?.id}`);
    }

    if (connection === 'close') {

      const code =
        lastDisconnect?.error?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {

        console.error(
          'Logged out. Remove session and pair again.'
        );

        process.exit(1);
      }

      if (!reconnecting) {

        reconnecting = true;

        console.log('Reconnecting...');

        setTimeout(() => {
          startBot().catch(console.error);
        }, 3000);
      }
    }

  });

  if (config.pairingNumber && !state.creds.registered) {

    const code =
      await sock.requestPairingCode(config.pairingNumber);

    console.log('\nWhatsApp Pairing Code: ' + code);

    console.log(
      'Enter this code in WhatsApp > Linked Devices > Link with phone number.'
    );
  }

  return sock;
}

// Health check server

const server = http.createServer((req, res) => {

  if (req.url === '/health') {

    res.writeHead(
      currentSocket?.user ? 200 : 503,
      { 'content-type': 'application/json' }
    );

    res.end(JSON.stringify({
      ok: Boolean(currentSocket?.user),
      service: config.botName
    }));

  } else {

    res.writeHead(200);

    res.end(`${config.botName} is running`);

  }

});

server.listen(config.port, '0.0.0.0', () => {

  console.log(
    `Health server listening on ${config.port}`
  );

});

startBot().catch(error => {

  console.error('Startup failed:', error);

  process.exit(1);

});

// Shutdown handling

for (const signal of ['SIGINT', 'SIGTERM']) {

  process.on(signal, async () => {

    console.log(`Received ${signal}`);

    try {
      currentSocket?.end(undefined);
    } catch {}

    server.close(() => process.exit(0));

  });

}
