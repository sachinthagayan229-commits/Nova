import fs from 'node:fs/promises';

import { config } from '../config.js';

export async function ensureDirs() {

  await fs.mkdir(config.authDir, {
    recursive: true
  });

  await fs.mkdir(config.downloadDir, {
    recursive: true
  });

}

export function isOwner(jid) {

  const number = jid.split('@')[0].split(':')[0];

  return number === config.ownerNumber;

}

export function extractUrls(text) {

  return text.match(
    /https?:\/\/[^\s]+/gi
  ) || [];

}

export async function getQuotedMedia(sock, message) {

  const quoted =
    message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) return null;

  const mediaMessage = {
    key: {
      remoteJid: message.key.remoteJid,
      id: message.message.extendedTextMessage.contextInfo.stanzaId,
      participant: message.message.extendedTextMessage.contextInfo.participant
    },
    message: quoted
  };

  return sock.downloadMediaMessage(mediaMessage);

}

export function formatBytes(bytes) {

  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return (
    (bytes / Math.pow(1024, index)).toFixed(2) +
    ' ' +
    units[index]
  );

}
