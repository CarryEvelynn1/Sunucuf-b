const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "roleUpdate",
  async execute(client, oldRole, newRole) {
    if (!newRole.guild) return;

    const audit = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: newRole.guild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    // --- ESK HALNE GETRME ---
    try {
      await newRole.edit({
        name: oldRole.name,
        color: oldRole.color,
        hoist: oldRole.hoist,
        permissions: oldRole.permissions,
        mentionable: oldRole.mentionable,
        reason: "Guard: zinsiz rol güncellemesi geri alnd."
      });
    } catch (err) {}

    // --- CEZALANDIRMA ---
    try {
      const member = await newRole.guild.members.fetch(entry.executor.id).catch(() => null);
      if (member && member.bannable) {
        await member.ban({ reason: "Guard: zinsiz rol ayarlarn deitirme." });
      }
    } catch (err) {}

    // --- LOGLAMA ---
    const logData = await Log.findOne({ guildID: newRole.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Rol Güncellendi!", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Rol Ayarlarna zinsiz Müdahale!**

• **Rol:** \`${oldRole.name}\` (\`${oldRole.id}\`)
• **Sorumlu:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **lem:** Rol ayarlar deitirilmeye çalld.
• **Sonuç:** Rol eski ayarlarna döndürüldü ve sorumlu yasakland.
        `)
        .setColor("#ff0000")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
