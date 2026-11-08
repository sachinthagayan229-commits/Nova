import fs from 'node:fs/promises';
import path from 'node:path';

const AUTH_DIR = process.env.AUTH_DIR || './session';

async function exportSession() {
  try {
    const files = await fs.readdir(AUTH_DIR);

    const session = {};

    for (const file of files) {
      const fullPath = path.join(AUTH_DIR, file);

      const stat = await fs.stat(fullPath);

      if (!stat.isFile()) continue;

      const data = await fs.readFile(fullPath);

      session[file] = data.toString('base64');
    }

    if (!Object.keys(session).length) {
      throw new Error('No session files found.');
    }

    const sessionId = Buffer.from(
      JSON.stringify(session)
    ).toString('base64');

    console.log('\nYOUR SESSION ID:\n');

    console.log(sessionId);

    console.log('\nKeep this secret!');

  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

exportSession();
