import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { getQuotedMedia } from '../lib/helpers.js';
import { config } from '../config.js';

export default {
  name: 'sticker',
  description: 'Convert image or video to sticker',

  execute: async ({ sock, message, reply }) => {
    const quoted = message.message?.extendedTextMessage
      ?.contextInfo?.quotedMessage;

    const media = quoted
      ? await getQuotedMedia(sock, message)
      : await sock.downloadMediaMessage(message);

    if (!media) {
      return reply('❌ Reply to an image or video with .sticker');
    }

    const id = randomUUID();
    const input = path.join(config.downloadDir, `${id}.input`);
    const output = path.join(config.downloadDir, `${id}.webp`);

    try {
      await fs.writeFile(input, media);

      const image = quoted?.imageMessage ||
        message.message?.imageMessage;

      const video = quoted?.videoMessage ||
        message.message?.videoMessage;

      if (image) {
        await sharp(media)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .webp({ quality: 80 })
          .toFile(output);

      } else if (video) {
        const duration = Number(video.seconds || 0);

        if (duration > 8) {
          return reply('❌ Video must be 8 seconds or shorter.');
        }

        await new Promise((resolve, reject) => {
          const process = spawn(ffmpeg, [
            '-y',
            '-i', input,
            '-t', '8',
            '-vf',
            'fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p',
            '-loop', '0',
            '-an',
            '-c:v', 'libwebp',
            '-quality', '70',
            '-preset', 'default',
            output
          ]);

          process.on('error', reject);

          process.on('close', code => {
            code === 0
              ? resolve()
              : reject(new Error('FFmpeg failed'));
          });
        });

      } else {
        return reply('❌ Please send an image or video.');
      }

      const sticker = await fs.readFile(output);

      if (sticker.length > 1024 * 1024) {
        return reply('❌ Sticker exceeds 1 MB.');
      }

      await sock.sendMessage(
        message.key.remoteJid,
        { sticker },
        { quoted: message }
      );

    } catch (error) {
      console.error(error);
      await reply('❌ Sticker conversion failed.');
    } finally {
      await Promise.all([
        fs.unlink(input).catch(() => {}),
        fs.unlink(output).catch(() => {})
      ]);
    }
  }
};
