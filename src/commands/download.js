import fs from 'node:fs/promises';

import { downloadMedia } from '../lib/download.js';

export default {
  name: 'download',
  description: 'Download YouTube, Instagram and TikTok videos',

  execute: async ({ args, sock, message, reply }) => {
    const url = args[0];

    if (!url) {
      return reply(
        '📥 *NOVA DOWNLOADER*\n\n' +
        'Usage:\n' +
        '.download <video URL>'
      );
    }

    let result;

    try {
      await reply('⏳ Downloading your video...');

      result = await downloadMedia(url);

      const buffer = await fs.readFile(result.filePath);

      await sock.sendMessage(
        message.key.remoteJid,
        {
          video: buffer,
          mimetype: 'video/mp4',
          caption: '✅ Downloaded by NOVA MD'
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(error);

      await reply(
        '❌ Download failed.\n' +
        'Check the URL or try another video.'
      );

    } finally {
      if (result?.filePath) {
        await fs.unlink(result.filePath).catch(() => {});
      }
    }
  }
};
