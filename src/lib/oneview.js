const config = require("../src/config");

async function handleOneView(sock, msg) {
  try {
    const viewOnceMsg = msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2;
    
    if (!viewOnceMsg) return;

    const innerMsg = viewOnceMsg.message;
    const imageMsg = innerMsg.imageMessage;
    const videoMsg = innerMsg.videoMessage;
    const audioMsg = innerMsg.audioMessage;

    const sender = msg.key.remoteJid;
    const senderName = msg.pushName || "Unknown";

    if (imageMsg) {
      // Photo එක Download කරන්න
      const stream = await sock.downloadContentStream(viewOnceMsg, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Owner ට යවන්න
      await sock.sendMessage(config.OWNER_NUMBER + "@s.whatsapp.net", {
        image: buffer,
        caption: `📸 OneView Photo Auto Saved!\n👤 From: ${senderName}\n📱 Chat: ${sender}`
      });

    } else if (videoMsg) {
      // Video එක Download කරන්න
      const stream = await sock.downloadContentStream(viewOnceMsg, 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      await sock.sendMessage(config.OWNER_NUMBER + "@s.whatsapp.net", {
        video: buffer,
        caption: `🎥 OneView Video Auto Saved!\n👤 From: ${senderName}\n📱 Chat: ${sender}`
      });

    } else if (audioMsg) {
      // Audio එක Download කරන්න
      const stream = await sock.downloadContentStream(viewOnceMsg, 'audio');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      await sock.sendMessage(config.OWNER_NUMBER + "@s.whatsapp.net", {
        audio: buffer,
        mimetype: 'audio/mp4',
        caption: `🎵 OneView Audio Auto Saved!\n👤 From: ${senderName}`
      });
    }

  } catch (error) {
    console.error("OneView Auto Save Error:", error);
  }
}

module.exports = { handleOneView };
