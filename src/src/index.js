import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Browsers
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

  sock.ev.on('messages.upsert', data =>
    handleMessages(sock, data).catch(console.error)
  );

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
