
import { startBot } from './core/client.js';
import { config } from './config.js';

console.log('==========================================');
console.log(`🤖 ${config.botName} - WhatsApp Bot`);
console.log('==========================================');

console.log(`📝 Prefix: ${config.prefix}`);
console.log(`👤 Owner: ${config.ownerNumber || 'Not Set'}`);
console.log('📱 Login: QR Code');
console.log('🔐 Authentication: Local Session');
console.log('==========================================');
console.log('🚀 Starting NOVA MD...');

try {
    await startBot();
} catch (error) {
    console.error('❌ Bot Startup Failed:', error);
    process.exitCode = 1;
}
