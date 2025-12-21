const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "emojiUpdate",
  async execute(client, oldEmoji, newEmoji) {
    if (!newEmoji.guild) return;

    const audit = await newEmoji.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: newEmoji.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      await newEmoji.edit({ name: oldEmoji.name, reason: "Guard: zinsiz emoji güncelleme geri alnd." });
    } catch (err) {}

    try {
      const member = await newEmoji.guild.members.fetch(entry.executor.id);
      if (member && member.bannable) await member.ban({ reason: "Guard: zinsiz emoji güncelleme." });
    } catch (err) {}

    const logData = await Log.findOne({ guildID: newEmoji.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Emoji Güncelleme Engellendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Emoji Ayarlarna zinsiz Müdahale!**

• **Eski sim:** \`${oldEmoji.name}\`
• **Yeni sim:** \`${newEmoji.name}\`
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **Sonuç:** Emoji eski ismine döndürüldü ve sorumlu yasakland.
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
