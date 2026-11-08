export default {

  name: 'menu',

  description: 'Show all commands',

  execute: async ({ reply, prefix, config }) => {

    const menu = `

╭━━━〔 🤖 ${config.botName} 〕━━━╮

┃
┃ 👑 OWNER
┃
┃ ${prefix}ping
┃ ${prefix}menu
┃
┃ 🤖 AI COMMANDS
┃
┃ ${prefix}ai <question>
┃ ${prefix}tts <text>
┃
┃ 🎨 STICKER
┃
┃ ${prefix}sticker
┃ ${prefix}s
┃
┃ 📥 DOWNLOADER
┃
┃ ${prefix}download <url>
┃
┃ 👥 GROUP
┃
┃ ${prefix}kick @user
┃ ${prefix}add <number>
┃ ${prefix}promote @user
┃ ${prefix}demote @user
┃
┃ 🛡️ FEATURES
┃
┃ Anti-link
┃ Welcome message
┃ Goodbye message
┃ Auto status viewer
┃ Auto AI reply
┃
╰━━━━━━━━━━━━━━━━━━╯

⚡ Powered by ${config.botName}

`;

    await reply(menu);

  }

};
