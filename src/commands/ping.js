export default {

  name: 'ping',

  description: 'Check bot status',

  execute: async ({ sock, reply }) => {

    const start = Date.now();

    await sock.sendMessage(
      (await sock.user.id) ? 'status@broadcast' : 'status@broadcast',
      { text: '' }
    ).catch(() => {});

    const speed = Date.now() - start;

    await reply(
      `🏓 *NOVA MD PONG!*\n\n` +
      `⚡ Response: ${speed} ms\n` +
      `🤖 Bot: Online\n` +
      `📡 WhatsApp: Connected`
    );

  }

};
