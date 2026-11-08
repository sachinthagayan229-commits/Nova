export default {
  name: 'group',
  description: 'Group management',

  execute: async ({
    sock,
    message,
    sender,
    command,
    args,
    reply,
    config
  }) => {

    const jid = message.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return reply('❌ Group only command.');
    }

    const metadata = await sock.groupMetadata(jid);

    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    const bot = metadata.participants.find(
      p => p.id === botJid
    );

    const user = metadata.participants.find(
      p => p.id === sender
    );

    if (!bot?.admin) {
      return reply('❌ Bot must be an admin.');
    }

    if (!user?.admin &&
        sender.split('@')[0].split(':')[0] !== config.ownerNumber) {
      return reply('❌ Only admins can use this command.');
    }

    const context =
      message.message?.extendedTextMessage?.contextInfo;

    const target =
      context?.mentionedJid?.[0] ||
      context?.participant ||
      (args[0]?.replace(/\D/g, '')
        ? args[0].replace(/\D/g, '') + '@s.whatsapp.net'
        : null);

    if (!target && command !== 'group') {
      return reply('❌ Mention a member or provide a number.');
    }

    try {

      switch (command) {

        case 'kick':
          await sock.groupParticipantsUpdate(
            jid, [target], 'remove'
          );
          return reply('✅ Member removed.');

        case 'add':
          await sock.groupParticipantsUpdate(
            jid, [target], 'add'
          );
          return reply('✅ Add request sent.');

        case 'promote':
          await sock.groupParticipantsUpdate(
            jid, [target], 'promote'
          );
          return reply('✅ Member promoted.');

        case 'demote':
          await sock.groupParticipantsUpdate(
            jid, [target], 'demote'
          );
          return reply('✅ Member demoted.');

        case 'group':
          return reply(
            `👥 *${metadata.subject}*\n` +
            `Members: ${metadata.participants.length}\n` +
            `Admins: ${metadata.participants.filter(p => p.admin).length}`
          );

        default:
          return reply('Unknown group command.');

      }

    } catch (error) {

      console.error(error);

      return reply('❌ Group action failed: ' + error.message);

    }
  }
};
