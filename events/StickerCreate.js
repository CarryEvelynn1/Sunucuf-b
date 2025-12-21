const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "stickerCreate",
  async execute(client, sticker) {
    if (!sticker.guild) return;

    const audit = await sticker.guild.fetchAuditLogs({ type: AuditLogEvent.StickerCreate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: sticker.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      await sticker.delete().catch(() => {});
      const executorMember = await sticker.guild.members.fetch(entry.executor.id).catch(() => null);
      if (executorMember && executorMember.bannable) {
        await executorMember.ban({ reason: "Guard: zinsiz çkartma (sticker) ekleme ilemi." });
      }
    } catch (err) {}

    const logData = await Log.findOne({ guildID: sticker.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "zinsiz Çkartma Engellendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucuya zinsiz Çkartma Eklendi!**

• **Çkartma Ad:** \`${sticker.name}\` (\`${sticker.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Çkartma silindi ve sorumlu kii yasakland.
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
