const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "roleCreate",
  async execute(client, role) {
    if (!role.guild) return;

    const audit = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: role.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      await role.delete().catch(() => {});
      const executorMember = await role.guild.members.fetch(entry.executor.id).catch(() => null);
      if (executorMember && executorMember.bannable) {
        await executorMember.ban({ reason: "Guard: zinsiz rol oluturma ilemi." });
      }
    } catch (err) {}

    const logData = await Log.findOne({ guildID: role.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Rol Oluturma Engellendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucuya zinsiz Rol Eklendi!**

• **Rol Ad:** \`${role.name}\` (\`${role.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Rol silindi ve sorumlu kii yasakland.
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
