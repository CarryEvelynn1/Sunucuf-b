const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const Safe = require("../schemas/safe");
const Log = require("../schemas/logchannel");
const config = require("../config");

module.exports = {
    name: "guildMemberUpdate",
    async execute(client, oldMember, newMember) {
        const guild = newMember.guild;
        
        // Rol değişikliği var mı kontrol et
        if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

        // Denetim kayıtlarını (Audit Logs) çek
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberRoleUpdate,
        });
        const roleLog = fetchedLogs.entries.first();

        if (!roleLog) return;

        const { executor, target } = roleLog;

        // İşlemi yapan kişi botun kendisiyse veya Sahibi ise işlem yapma
        if (executor.id === client.user.id || config.owners.includes(executor.id)) return;

        // Güvenli liste kontrolü
        const safeData = await Safe.findOne({ guildID: guild.id });
        const isSafe = safeData?.safeUsers.some(u => u.id === executor.id);
        if (isSafe) return;

        // Verilen rolleri kontrol et (Tehlikeli yetki var mı?)
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        
        const dangerousPermissions = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageGuild,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers
        ];

        const hasDangerousRole = addedRoles.some(role => 
            dangerousPermissions.some(perm => role.permissions.has(perm))
        );

        if (hasDangerousRole) {
            try {
                // 1. İşlemi geri al (Eski rolleri geri yükle)
                await newMember.roles.set(oldMember.roles.cache);

                // 2. İşlemi yapanı cezalandır (Rollerini al veya banla)
                const executorMember = await guild.members.fetch(executor.id);
                if (executorMember.manageable) {
                    await executorMember.roles.set([]).catch(() => {}); // Tüm rollerini al
                }

                // 3. Log kanalına bildir
                const logData = await Log.findOne({ guildID: guild.id });
                if (logData && logData.channelID) {
                    const logChannel = guild.channels.cache.get(logData.channelID);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle("🛡️ Sağ Tık Yetki Koruması")
                            .setDescription(`${executor} adlı kullanıcı, ${target} kullanıcısına yetki vermeye çalıştı ve engellendi.`)
                            .addFields(
                                { name: "İşlemi Yapan", value: `${executor.tag} (${executor.id})`, inline: true },
                                { name: "Hedef", value: `${target.tag} (${target.id})`, inline: true }
                            )
                            .setColor("Red")
                            .setTimestamp()
                            .setFooter({ text: "Swertcode Qnd Fox" });

                        logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                console.error("Koruma işlemi sırasında hata:", err);
            }
        }
    }
};
