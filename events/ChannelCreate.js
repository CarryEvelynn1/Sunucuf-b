/**
 * Guard Kanal Oluturma Korumas
 * Developed By Swertcode and Fox
 */

const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "channelCreate",
  async execute(client, channel) {
    if (!channel.guild) return;

    
    const audit = await channel.guild.fetchAuditLogs({ 
        type: AuditLogEvent.ChannelCreate,
        limit: 1 
    }).catch(() => null);
    
    const entry = audit?.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;

    
    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: channel.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    
    await channel.delete().catch(() => {});

    
    try {
      const member = await channel.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) {
          await member.ban({ reason: "Guard: zinsiz kanal oluturma tespiti." });
      }
    } catch (err) {
      console.error("Ban atlamad:", err);
    }

    //Log data buras mert
    const logData = await Log.findOne({ guildID: channel.guild.id });
    if (!logData) return;
    const logChannel = client.channels.cache.get(logData.channelID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Kanal Oluturma Engellendi", iconURL: entry.executor.displayAvatarURL() })
      .setDescription(`
 **Sunucuya zinsiz Müdahale Edildi!**

• **Eylem:** Kanal Oluturma
• **Kanal smi:** \`${channel.name}\`
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **Sonuç:** Kanal silindi ve sorumlu yasakland.


      `)
      .setColor("#ff0000")
      .setThumbnail(channel.guild.iconURL())
      .setFooter({ text: "Developed By Swertcode and Fox ", iconURL: client.user.avatarURL() })
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  }
};
