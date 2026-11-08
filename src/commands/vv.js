module.exports = {
  name: "vv",
  alias: ["viewonce", "oneview"],
  category: "media",
  description: "OneView Photo එකක් බලන්න",
  async run(sock, msg, args) {
    try {
      // Reply කරපු Message එක ගන්න
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted) {
        return await sock.sendMessage(msg.key.remoteJid, 
          { text: "❌ කරුණාකර OneView Photo එකකට Reply කරලා .vv දාන්න!" }, 
          { quoted: msg }
        );
      }

      // OneView Message එකක්ද බලන්න
      const viewOnceMsg = quoted.viewOnceMessage || quoted.viewOnceMessageV2;
      if (!viewOnceMsg) {
        return await sock.sendMessage(msg.key.remoteJid, 
          { text: "❌ මේක OneView Message එකක් නෙවෙයි!" }, 
          { quoted: msg }
        );
      }

      const innerMsg = viewOnceMsg.message;
      const imageMsg = innerMsg.imageMessage;
      const videoMsg = innerMsg.videoMessage;

      if (imageMsg) {
        // Photo එක Download කරලා යවන්න
        const stream = await sock.downloadContentStream(viewOnceMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        await sock.sendMessage(msg.key.remoteJid, {
          image: buffer,
          caption: "✅ OneView Photo එක"
        }, { quoted: msg });

      } else if (videoMsg) {
        // Video එක Download කරලා යවන්න
        const stream = await sock.downloadContentStream(viewOnceMsg, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        await sock.sendMessage(msg.key.remoteJid, {
          video: buffer,
          caption: "✅ OneView Video එක"
        }, { quoted: msg });

      } else {
        return await sock.sendMessage(msg.key.remoteJid, 
          { text: "❌ මේක Photo/Video එකක් නෙවෙයි!" }, 
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error("VV Error:", error);
      await sock.sendMessage(msg.key.remoteJid, 
        { text: "❌ Error එකක් ආවා! " + error.message }, 
        { quoted: msg }
      );
    }
  }
};
