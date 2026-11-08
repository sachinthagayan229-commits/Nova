import googleTTS from 'google-tts-api';

export default {
  name: 'tts',
  description: 'Convert text to speech',

  execute: async ({ args, sock, message, reply }) => {
    const text = args.join(' ');

    if (!text) {
      return reply('Usage: .tts Hello world');
    }

    try {
      if (text.length > 500) {
        return reply('❌ Maximum 500 characters allowed.');
      }

      const urls = googleTTS.getAllAudioUrls(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com'
      });

      const buffers = await Promise.all(
        urls.map(async item => {
          const response = await fetch(item.url);

          if (!response.ok) {
            throw new Error('TTS request failed');
          }

          return Buffer.from(await response.arrayBuffer());
        })
      );

      const audio = Buffer.concat(buffers);

      await sock.sendMessage(
        message.key.remoteJid,
        {
          audio,
          mimetype: 'audio/mpeg',
          ptt: true
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(error);
      await reply('❌ Text to speech failed.');
    }
  }
};
