// Nova Bot - Main Entry Point
import { startBot } from './core/client.js';
import { config } from './config.js';

console.log('==========================================');
console.log('🤖 NOVA MD - WhatsApp Bot');
console.log('==========================================');
console.log(`📝 Prefix: ${config.PREFIX}`);
console.log(`👤 Owner: ${config.OWNER_NUMBER}`);
console.log(`📱 Pairing: ${config.PAIRING_NUMBER}`);
console.log(`🔑 Session: ${config.SESSION_ID ? 'Set ✅' : 'Not Set ❌'}`);
console.log(`🤖 Groq API: ${config.GROQ_API_KEY ? 'Set ✅' : 'Not Set ❌'}`);
console.log(`🤖 Model: ${config.GROQ_MODEL}`);
console.log('==========================================');
console.log('🚀 Starting Bot...');

// Start Bot
startBot();
