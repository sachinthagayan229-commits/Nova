import { askAI } from '../lib/ai.js';

export default {

  name: 'ai',

  description: 'Ask AI anything',

  execute: async ({ args, reply }) => {

    const question = args.join(' ');

    if (!question) {

      return reply(
        '❌ Usage: .ai What is JavaScript?'
      );

    }

    await reply('🤖 AI is thinking...');

    const answer = await askAI(question);

    await reply(
      `🤖 *NOVA AI*\n\n${answer}`
    );

  }

};
