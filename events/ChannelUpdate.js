/**
 * Guard Kanal Güncelleme Korumas
 * Developed By Swertcode and Fox
 */

const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "channelUpdate",
  async execute(client, oldChannel, newChannel) {
    if (!newChannel.guild) return;

   
    const audit = await newChannel.guild.fetchAuditLogs({ 
        type: AuditLogEvent.ChannelUpdate, 
        limit: 1 
    }).catch(() => null);
    
    const entry = audit?.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;

    
    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: newChannel.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    

    
    try {
        await newChannel.edit({
            name: oldChannel.name,
            topic: oldChannel.topic,
            nsfw: oldChannel.nsfw,
            parent: oldChannel.parent,
            permissionOverwrites: oldChannel.permissionOverwrites.cache,
            rateLimitPerUser: oldChannel.rateLimitPerUser,
            reason: "Guard: zinsiz kanal güncellemesi geri alnd."
        });
    } catch (err) {
        console.error("Kanal eski haline döndürülemedi:", err);
    }

    
    try {
      const member = await newChannel.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) {
          await member.ban({ reason: "Guard: zinsiz kanal ayarlaryla oynama." });
      }
    } catch (err) {}

    
    const logData = await Log.findOne({ guildID: newChannel.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Kanal Ayarlar Deitirildi!", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Kanal Ayarlarna zinsiz Müdahale!**

• **Kanal:** \`${oldChannel.name}\` (\`${oldChannel.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Ayarlar deitirilmeye çalld, kanal eski haline getirildi ve sorumlu yasakland.

*Kanal ismi ve izinleri baaryla korundu.*
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developed By Swertcode and Fox ", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
