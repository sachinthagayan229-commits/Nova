import 'dotenv/config';
import { config } from '../config.js';
import handler from '../handler.js';
import { commands } from '../commands/index.js';
import { createClient } from '../lib/client.js';
import { saveSession, loadSession, clearSession } from '../lib/session.js';
import fs from 'fs';
import path from 'path';

// Bot Start කරනවා
async function startBot() {
  console.log(`🤖 ${config.botName} starting...`);
  console.log(`👤 Owner: ${config.ownerNumber}`);
  console.log(`📁 Auth Dir: ${config.authDir}`);
  
  // Session Load කරනවා
  const session = await loadSession();
  console.log(`✅ Session loaded: ${session ? 'Yes' : 'No'}`);

  // Baileys Client Create කරනවා
  const client = await createClient({
    authDir: config.authDir,
    onMessage: async (msg) => {
      await handler(client, msg, config, commands);
    },
    onConnect: async () => {
      console.log(`✅ ${config.botName} Connected!`);
    },
    onDisconnect: async (reason) => {
      console.log(`❌ Disconnected: ${reason}`);
      // Session Clear කරන්න එපා, Auto Reconnect වෙන්න ඕනේ
    }
  });

  // Pairing Code ගන්නවා
  if (!session && config.pairingNumber) {
    console.log(`📱 Pairing Number: ${config.pairingNumber}`);
    // Pairing Code එක Client එකෙන් ගන්නවා
    // Baileys වලින් Auto වෙන්න ඕනේ
  }

  console.log(`🚀 ${config.botName} is ready!`);
  console.log(`📝 Prefix: ${config.prefix}`);
  console.log(`💬 Type ${config.prefix}menu to see commands`);
}

// Error Handle කරනවා
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Bot Start කරනවා
startBot().catch(err => {
  console.error('❌ Failed to start bot:', err);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});
