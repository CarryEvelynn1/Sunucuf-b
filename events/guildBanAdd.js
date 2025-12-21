const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "guildBanAdd",
  async execute(client, ban) {
    if (!ban.guild) return;

    const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: ban.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      await ban.guild.members.unban(ban.user.id, "Guard: zinsiz yasaklama ilemi geri alnd.").catch(() => {});
      const member = await ban.guild.members.fetch(entry.executor.id).catch(() => null);
      if (member && member.bannable) {
        await member.ban({ reason: "Guard: zinsiz ban atma ilemi." });
      }
    } catch (err) {}

    const logData = await Log.findOne({ guildID: ban.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "zinsiz Yasaklama Tespit Edildi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucuda zinsiz Ban lemi!**

• **Yasaklanan:** <@${ban.user.id}> (\`${ban.user.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Ban geri kaldrld ve ilemi yapan kii sunucudan yasakland.
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
