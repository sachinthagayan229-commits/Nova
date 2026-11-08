import axios from 'axios';

import { config } from '../config.js';

export async function askAI(prompt) {

  if (!config.groqApiKey) {
    return 'AI API key is not configured.';
  }

  const response = await axios.post(

    'https://api.groq.com/openai/v1/chat/completions',

    {
      model: config.groqModel,

      messages: [
        {
          role: 'system',
          content:
            'You are NOVA MD AI assistant. Be helpful and concise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],

      temperature: 0.7,

      max_tokens: 1000

    },

    {
      headers: {
        Authorization: `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json'
      },

      timeout: 30000

    }

  );

  return (
    response.data.choices?.[0]?.message?.content ||
    'No response from AI.'
  );

}
