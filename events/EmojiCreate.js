/**
 * Guard Emoji Oluturma Korumas
 * Developed By Swertcode and Fox
 */

const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "emojiCreate",
  async execute(client, emoji) {
    if (!emoji.guild) return;

    
    const audit = await emoji.guild.fetchAuditLogs({ 
        type: AuditLogEvent.EmojiCreate, 
        limit: 1 
    }).catch(() => null);
    
    const entry = audit?.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;

    
    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: emoji.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    

    
    await emoji.delete().catch(() => {});

    
    try {
      const member = await emoji.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) {
          await member.ban({ reason: "Guard: zinsiz emoji ekleme tespiti." });
      }
    } catch (err) {}

    
    const logData = await Log.findOne({ guildID: emoji.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Emoji Ekleme Engellendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucuya zinsiz Emoji Eklendi!**

• **Emoji:** \`:${emoji.name}:\`
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **Sonuç:** Emoji silindi ve sorumlu yasakland.

*Emoji slotlar baaryla korundu.*
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developed By Swertcode and Fox ", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
