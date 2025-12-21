const { AuditLogEvent, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");
const config = require("../config");

module.exports = {
  name: "roleDelete",
  async execute(client, role) {
    if (!role.guild) return;

    const audit = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: role.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      const member = await role.guild.members.fetch(entry.executor.id).catch(() => null);
      if (member && member.bannable) {
        await member.ban({ reason: "Guard: zinsiz rol silme ilemi." });
      }
    } catch (err) {}

    try {
      await role.guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
        position: role.rawPosition,
        reason: "Guard: Silinen rol otomatik olarak geri yüklendi."
      });
    } catch (err) {}

    const logData = await Log.findOne({ guildID: role.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Rol Silme Engellendi", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucuda Kritik Rol Silindi!**

• **Silinen Rol:** \`${role.name}\` (\`${role.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Rol yeniden oluturuldu ve sorumlu yasakland.

*Not: Rolün eski üyeleri ve izinleri manuel kontrol edilmelidir.*
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }
  }
};
