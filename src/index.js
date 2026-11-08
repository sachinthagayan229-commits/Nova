
import { startBot } from './core/client.js';
import { config } from './config.js';

console.log('==========================================');
console.log(`🤖 ${config.botName} - WhatsApp Bot`);
console.log('==========================================');

console.log(`📝 Prefix: ${config.prefix}`);
console.log(`👤 Owner: ${config.ownerNumber || 'Not Set'}`);
console.log(`📱 Pairing: ${config.pairingNumber ? 'Set' : 'Not Set'}`);
console.log(`🔑 Session: ${config.sessionId ? 'Set ✅' : 'Not Set ❌'}`);
console.log(`🤖 Groq API: ${config.groqApiKey ? 'Set ✅' : 'Not Set ❌'}`);
console.log(`🤖 Model: ${config.groqModel}`);

console.log('==========================================');
console.log('🚀 Starting Bot...');

startBot().catch(error => {
    console.error('❌ Bot Startup Failed:', error);
    process.exit(1);
});
