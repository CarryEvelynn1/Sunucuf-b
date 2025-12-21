/**
 * Guard Emoji Silme Korumas & Geri Oluturma
 * Developed By Swertcode and Fox
 */

const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "emojiDelete",
  async execute(client, emoji) {
    if (!emoji.guild) return;

    
    const audit = await emoji.guild.fetchAuditLogs({ 
        type: AuditLogEvent.EmojiDelete, 
        limit: 1 
    }).catch(() => null);
    
    const entry = audit?.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;

    
    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: emoji.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    
    try {
      const member = await emoji.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) {
          await member.ban({ reason: "Guard: zinsiz emoji silme ilemi." });
      }
    } catch (err) {
      console.error("Yasaklama baarsz:", err);
    }

    
    try {
        await emoji.guild.emojis.create({
            attachment: emoji.url,
            name: emoji.name,
            reason: "Guard: Silinen emoji otomatik olarak geri yüklendi."
        });
    } catch (err) {
        console.error("Emoji geri oluturulamad:", err);
    }

    
    const logData = await Log.findOne({ guildID: emoji.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Bir Emoji Silindi!", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Emoji Korumas Tetiklendi!**

• **Emoji:** \`:${emoji.name}:\`
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Emoji silindi, sorumlu banland ve emoji geri yüklendi.

*Güvenlik protokolü baaryla uyguland.*
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developed By Swertcode and Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
