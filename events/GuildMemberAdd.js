const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "guildMemberAdd",
  async execute(client, member) {
    if (!member.guild) return;

    if (member.user.bot) {
      const audit = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 }).catch(() => null);
      const entry = audit?.entries.first();

      if (!entry || !entry.executor || entry.executor.bot) return;
      if (config.owners.includes(entry.executor.id)) return;

      const safe = await Safe.findOne({ guildID: member.guild.id });
      if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

      try {
        await member.kick("Guard: zinsiz bot ekleme tespiti.");
        const executorMember = await member.guild.members.fetch(entry.executor.id).catch(() => null);
        if (executorMember && executorMember.bannable) {
          await executorMember.ban({ reason: "Guard: Sunucuya izinsiz bot ekleme ilemi." });
        }
      } catch (err) {}

      const logData = await Log.findOne({ guildID: member.guild.id });
      const logChannel = client.channels.cache.get(logData?.channelID);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: "zinsiz Bot Girii Engellendi", iconURL: entry.executor.displayAvatarURL() })
          .setDescription(`
 **Sunucuya zinsiz Bot Sokuldu!**

• **Eklenen Bot:** <@${member.id}> (\`${member.user.tag}\`)
• **Sorumlu Kii:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **Uygulanan:** Bot sunucudan atld ve ekleyen kii yasakland.
          `)
          .setColor("#ff0000")
          .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    }
  }
};
