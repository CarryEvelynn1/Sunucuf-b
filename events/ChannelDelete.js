/**
 * Guard Kanal Silme Korumas & Geri Oluturma
 * Developed By Swertcode and Fox
 */

const { AuditLogEvent, EmbedBuilder, ChannelType } = require("discord.js");
const panelSchema = require("../schemas/Panel");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");
const config = require("../config");

module.exports = {
  name: "channelDelete",
  async execute(client, channel) {
    if (!channel.guild) return;


    const panel = await panelSchema.findOne({ guildID: channel.guild.id });
    if (!panel?.kanalKoruma) return;

    
    const audit = await channel.guild.fetchAuditLogs({ 
        type: AuditLogEvent.ChannelDelete, 
        limit: 1 
    }).catch(() => null);
    
    const entry = audit?.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;


    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: channel.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

 
    try {
      const member = await channel.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) {
          await member.ban({ reason: "Guard: zinsiz kanal silme ilemi." });
      }
    } catch (err) {
      console.error("Yasaklama ilemi baarsz:", err);
    }

    // --- KANALI GER OLUTURMA (RECOVERY) ---
    try {
      const permissionOverwrites = channel.permissionOverwrites.cache.map(po => ({
        id: po.id,
        allow: po.allow.bitfield,
        deny: po.deny.bitfield,
        type: po.type,
      }));

      await channel.guild.channels.create({
        name: channel.name,
        type: channel.type,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        bitrate: channel.bitrate || undefined,
        userLimit: channel.userLimit || undefined,
        parent: channel.parentId || null,
        rateLimitPerUser: channel.rateLimitPerUser || 0,
        position: channel.rawPosition, 
        permissionOverwrites: permissionOverwrites,
        reason: "Guard: Silinen kanal otomatik olarak geri yüklendi."
      });
    } catch (err) {
      console.error("Kanal kurtarma hatas:", err);
    }

    // --- LOGLAMA ---
    const logData = await Log.findOne({ guildID: channel.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Bir Kanal Silindi!", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucu Kanallarna Saldr Tespiti!**

• **Kanal:** \`${channel.name}\` (\`${channel.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Kanal silindi, sorumlu banland ve kanal geri açld.

*Veri kayb önlendi ve kanal izinleri geri yüklendi.*
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developed By Swertcode and Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
