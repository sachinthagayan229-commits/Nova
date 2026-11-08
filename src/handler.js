import { commands } from './commands/index.js';

import { config } from './config.js';

import { askAI } from './lib/ai.js';

import {
  extractUrls,
  isOwner
} from './lib/helpers.js';

const getText = m =>
  m.conversation ||
  m.extendedTextMessage?.text ||
  m.imageMessage?.caption ||
  m.videoMessage?.caption ||
  '';

export async function handleMessages(sock, upsert) {

  for (const message of upsert.messages || []) {

    if (!message.message || message.key.fromMe) continue;

    const jid = message.key.remoteJid;

    // Auto status viewer

    if (jid === 'status@broadcast') {

      if (config.autoStatusView) {
        await sock.readMessages([message.key]).catch(() => {});
      }

      continue;
    }

    const sender = message.key.participant || jid;

    const text = getText(message.message).trim();

    const isGroup = jid.endsWith('@g.us');

    const reply = body =>
      sock.sendMessage(
        jid,
        { text: body },
        { quoted: message }
      );

    // Anti-link protection

    if (isGroup && config.antiLink && extractUrls(text).length) {

      const metadata =
        await sock.groupMetadata(jid).catch(() => null);

      const actor =
        metadata?.participants.find(p => p.id === sender);

      const allowed = extractUrls(text).every(url => {

        const host = new URL(url).hostname.toLowerCase();

        return config.allowedLinkDomains.some(domain =>
          host === domain || host.endsWith(`.${domain}`)
        );

      });

      if (!allowed && !actor?.admin && !isOwner(sender)) {

        await sock.sendMessage(jid, {
          delete: message.key
        }).catch(() => {});

        await reply(
          `⚠️ @${sender.split('@')[0]}, links are not allowed here.`
        );

        continue;
      }
    }

    // Command handler

    if (text.startsWith(config.prefix)) {

      const [raw, ...args] =
        text.slice(config.prefix.length).trim().split(/\s+/);

      const command = (raw || '').toLowerCase();

      const ctx = {
        sock,
        message,
        sender,
        args,
        command,
        reply,
        commands,
        prefix: config.prefix,
        config
      };

      if (['kick', 'add', 'promote', 'demote'].includes(command)) {

        await commands.get('group').execute(ctx);

        continue;
      }

      const handler = commands.get(command);

      if (handler) {

        try {

          await handler.execute(ctx);

        } catch (error) {

          console.error(`Command ${command}:`, error);

          await reply(`Command error: ${error.message}`);

        }

      }

      continue;
    }

    // Private chat AI auto reply

    if (
      !isGroup &&
      config.aiAutoReply &&
      config.groqApiKey &&
      text &&
      !text.startsWith(config.prefix)
    ) {

      try {

        await reply(await askAI(text));

      } catch (e) {

        console.error('Auto-reply AI:', e.message);

      }

    }

  }

}

// Welcome and Goodbye messages

export async function handleGroupEvents(sock, event) {

  if (!event.id.endsWith('@g.us')) return;

  const metadata =
    await sock.groupMetadata(event.id).catch(() => null);

  const subject = metadata?.subject || 'the group';

  for (const participant of event.participants) {

    if (event.action === 'add' && config.welcome) {

      await sock.sendMessage(event.id, {
        text: `👋 Welcome @${participant.split('@')[0]} to *${subject}*!`,
        mentions: [participant]
      });

    }

    if (event.action === 'remove' && config.goodbye) {

      await sock.sendMessage(event.id, {
        text: `👋 Goodbye @${participant.split('@')[0]}.`,
        mentions: [participant]
      });

    }

  }

}
