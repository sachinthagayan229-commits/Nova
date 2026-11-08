import 'dotenv/config';

const bool = (value, fallback = false) =>
  value == null ? fallback : value.toLowerCase() === 'true';

export const config = {
  prefix: process.env.PREFIX || '.',

  ownerNumber: (process.env.OWNER_NUMBER || '').replace(/\D/g, ''),

  pairingNumber: (process.env.PAIRING_NUMBER || '').replace(/\D/g, ''),

  sessionId: process.env.SESSION_ID || '',

  authDir: process.env.AUTH_DIR || './session',

  downloadDir: process.env.DOWNLOAD_DIR || './downloads',

  botName: process.env.BOT_NAME || 'NOVA MD',

  groqApiKey: process.env.GROQ_API_KEY || '',

  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  aiAutoReply: bool(process.env.AI_AUTO_REPLY),

  autoStatusView: bool(process.env.AUTO_STATUS_VIEW, true),

  antiLink: bool(process.env.ANTI_LINK, true),

  welcome: bool(process.env.WELCOME, true),

  goodbye: bool(process.env.GOODBYE, true),

  allowedLinkDomains: (
    process.env.ALLOWED_LINK_DOMAINS || 'chat.whatsapp.com'
  )
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean),

  maxDownloadMb: Number(process.env.MAX_DOWNLOAD_MB || 50),

  port: Number(process.env.PORT || 3000)
};
