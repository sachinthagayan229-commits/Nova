import fs from 'node:fs/promises';
import path from 'node:path';

import { config } from '../config.js';

export async function restoreSessionArchive() {

  if (!config.sessionId) {
    console.log('No SESSION_ID found. Using local session.');
    return;
  }

  try {

    const decoded = Buffer.from(
      config.sessionId,
      'base64'
    ).toString('utf8');

    const files = JSON.parse(decoded);

    await fs.mkdir(config.authDir, {
      recursive: true
    });

    for (const [name, content] of Object.entries(files)) {

      if (
        name.includes('/') ||
        name.includes('\\') ||
        name === '.' ||
        name === '..'
      ) {
        throw new Error('Invalid session filename');
      }

      await fs.writeFile(
        path.join(config.authDir, name),
        Buffer.from(content, 'base64')
      );

    }

    console.log('SESSION_ID restored successfully.');

  } catch (error) {

    console.error('Session restore failed:', error.message);

    throw error;

  }

}
