import youtubedl from 'yt-dlp-exec';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { config } from '../config.js';

const allowedHosts = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com'
];

export async function downloadMedia(url) {
  const parsed = new URL(url);

  if (
    parsed.protocol !== 'https:' ||
    !allowedHosts.some(host =>
      parsed.hostname === host ||
      parsed.hostname.endsWith('.' + host)
    )
  ) {
    throw new Error('Unsupported URL');
  }

  const id = randomUUID();

  const output = path.join(
    config.downloadDir,
    `${id}.%(ext)s`
  );

  await youtubedl(url, {
    output,
    format: 'best[ext=mp4]/best',
    noPlaylist: true,
    maxFilesize: `${config.maxDownloadMb}M`,
    socketTimeout: 30,
    noWarnings: true
  });

  const files = await fs.readdir(config.downloadDir);

  const result = files.find(file =>
    file.startsWith(id + '.')
  );

  if (!result) {
    throw new Error('Download file not found');
  }

  const filePath = path.join(config.downloadDir, result);

  const stat = await fs.stat(filePath);

  if (stat.size > config.maxDownloadMb * 1024 * 1024) {
    await fs.unlink(filePath);
    throw new Error('File exceeds download limit');
  }

  return {
    filePath,
    fileName: result,
    size: stat.size
  };
}
