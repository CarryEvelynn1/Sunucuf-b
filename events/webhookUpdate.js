const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "webhookUpdate",
  async execute(client, channel) {
    if (!channel.guild) return;

    
    const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;

    
    if (config.owners.includes(entry.executor.id)) return;
    const safe = await Safe.findOne({ guildID: channel.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    
    try {
      
      const webhooks = await channel.fetchWebhooks();
      webhooks.forEach(async (wh) => {
        await wh.delete("Guard: İzinsiz webhook oluşturma tespiti.").catch(() => {});
      });

     
      const member = await channel.guild.members.fetch(entry.executor.id).catch(() => null);
      if (member && member.bannable) {
        await member.ban({ reason: "Guard: İzinsiz webhook yönetimi." });
      }
    } catch (err) {}

    
    const logData = await Log.findOne({ guildID: channel.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Webhook Koruması Tetiklendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
🚨 **Sunucuda İzinsiz Webhook İşlemi!**

• **Kanal:** <#${channel.id}> (\`${channel.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **İşlem:** Oluşturulan/güncellenen webhooklar silindi ve sorumlu kişi yasaklandı.

*Sunucu güvenliği için tüm webhooklar temizlendi.*
        `)
        .setColor("#800080")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
