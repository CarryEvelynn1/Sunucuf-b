const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "guildUpdate",
  async execute(client, oldGuild, newGuild) {
    if (!newGuild) return;

    const audit = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    if (!entry || !entry.executor || entry.executor.bot) return;
    if (config.owners.includes(entry.executor.id)) return;

    const safe = await Safe.findOne({ guildID: newGuild.id });
    if (safe?.safeUsers.some(u => u.id === entry.executor.id)) return;

    try {
      if (newGuild.name !== oldGuild.name) await newGuild.setName(oldGuild.name);
      if (newGuild.iconURL() !== oldGuild.iconURL()) await newGuild.setIcon(oldGuild.iconURL());
      
      if (oldGuild.vanityURLCode && (newGuild.vanityURLCode !== oldGuild.vanityURLCode)) {
        try { await newGuild.setVanityCode(oldGuild.vanityURLCode); } catch (e) {}
      }
      
      const executorMember = await newGuild.members.fetch(entry.executor.id).catch(() => null);
      if (executorMember && executorMember.bannable) {
        await executorMember.ban({ reason: "Guard: zinsiz sunucu ayarlarn deitirme." });
      }
    } catch (err) {}

    const logData = await Log.findOne({ guildID: newGuild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Sunucu Ayarlar Korundu", iconURL: entry.executor.displayAvatarURL() })
        .setDescription(`
 **Sunucu Ayarlarna zinsiz Müdahale!**

• **Sorumlu Kii:** <@${entry.executor.id}> (\`${entry.executor.id}\`)
• **Yaplan lem:** Sunucu ayarlar (sim, kon veya URL) deitirilmeye çalld.
• **Uygulanan:** Ayarlar eski haline getirildi ve sorumlu kii yasakland.
        `)
        .setColor("#e67e22")
        .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
