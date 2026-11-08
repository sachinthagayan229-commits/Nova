export default {
  name: 'ping',
  description: 'Check bot status',

  execute: async ({ reply }) => {
    const start = Date.now();

    await reply(
      `🏓 *NOVA MD PONG!*\n\n` +
      `⚡ Response: ${Date.now() - start} ms\n` +
      `🤖 Bot: Online\n` +
      `📡 WhatsApp: Connected`
    );
  }
};
