/**
 * Guard Koruma Paneli
 * Developed By Swertcode and Fox
 */

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const conf = require('../../config');
const Safe = require('../../schemas/safe');
const Log = require('../../schemas/logchannel');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: "guardpanel",
    description: "Sunucunun güvenlik ayarlarını bu panelden yönetebilirsin.",
    // Sadece yönetici yetkisi olanların komutu görmesini sağlar
    default_member_permissions: PermissionFlagsBits.Administrator, 

    async execute(client, interaction) {
        // config.js içindeki owners kontrolü
        if (!conf.owners.includes(interaction.user.id)) {
            return interaction.reply({ content: "Bu komutu sadece bot sahipleri kullanabilir.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle("🛡️ Guard Koruma Paneli")
            .setDescription(`Aşağıdaki butonları kullanarak sunucu güvenliğini ve yedekleme işlemlerini yönetebilirsiniz.`)
            .setColor("#0099ff")
            .setFooter({ text: `Developed By Swertcode Qnd Fox | ${interaction.guild.name}`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('guardEnable').setLabel('🟢 Aktif Et').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('guardDisable').setLabel('🔴 Pasif Et').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('showSafeUsers').setLabel('🔄 Safe Listesi').setStyle(ButtonStyle.Primary),
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('addSafeUser').setLabel('➕ Safe Ekle').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('removeSafeUser').setLabel('➖ Safe Çıkar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('setLogChannel').setLabel('📜 Log Ayarla').setStyle(ButtonStyle.Primary),
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('backupGuildStructure').setLabel('💾 Yapıyı Yedekle').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('restoreStructure').setLabel('📦 Yedekten Kur').setStyle(ButtonStyle.Danger)
        );

        const panelMessage = await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2, row3],
            fetchReply: true 
        });

        const filter = i => i.user.id === interaction.user.id;
        const collector = panelMessage.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async i => {
            // Yedek kurma işlemi uzun sürdüğü için deferUpdate yapmıyoruz, diğerlerinde yapıyoruz.
            if (i.customId !== 'restoreStructure') await i.deferUpdate();

            if (i.customId === 'guardEnable') {
                await Safe.updateOne({ guildID: interaction.guild.id }, { $set: { guardEnabled: true } }, { upsert: true });
                return i.followUp({ content: "🟢 Guard sistemi başarıyla aktifleştirildi!", ephemeral: true });
            }

            if (i.customId === 'guardDisable') {
                await Safe.updateOne({ guildID: interaction.guild.id }, { $set: { guardEnabled: false } }, { upsert: true });
                return i.followUp({ content: "🔴 Guard sistemi devre dışı bırakıldı.", ephemeral: true });
            }

            if (i.customId === 'backupGuildStructure') {
                const backupData = {
                    guildID: interaction.guild.id,
                    roles: [],
                    channels: []
                };

                interaction.guild.roles.cache.filter(r => !r.managed && r.id !== interaction.guild.id).forEach(role => {
                    backupData.roles.push({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        permissions: role.permissions.bitfield.toString(),
                        position: role.position
                    });
                });

                interaction.guild.channels.cache.forEach(channel => {
                    backupData.channels.push({
                        name: channel.name,
                        type: channel.type,
                        parent: channel.parent?.name || null,
                        position: channel.rawPosition,
                        permissionOverwrites: channel.permissionOverwrites.cache.map(p => ({ id: p.id, allow: p.allow.bitfield.toString(), deny: p.deny.bitfield.toString(), type: p.type }))
                    });
                });

                const dir = path.join(__dirname, "../../backups");
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(path.join(dir, `structure-${interaction.guild.id}.json`), JSON.stringify(backupData, null, 2));

                return i.followUp({ content: "✅ Sunucu yapısı başarıyla yedeklendi! (By Swertcode Qnd Fox)", ephemeral: true });
            }

            if (i.customId === 'restoreStructure') {
                const filePath = path.join(__dirname, '../../backups', `structure-${interaction.guild.id}.json`);
                if (!fs.existsSync(filePath)) return i.reply({ content: "❌ Yedek dosyası bulunamadı!", ephemeral: true });

                await i.reply({ content: "🔄 İşlem başlatıldı, lütfen bekleyin... Kanallar ve roller yeniden inşa ediliyor.", ephemeral: true });
                const backup = JSON.parse(fs.readFileSync(filePath));

                for (const r of backup.roles) {
                    await interaction.guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, permissions: BigInt(r.permissions) }).catch(() => null);
                    await new Promise(res => setTimeout(res, 500));
                }

                for (const c of backup.channels) {
                    await interaction.guild.channels.create({
                        name: c.name,
                        type: c.type
                    }).catch(() => null);
                    await new Promise(res => setTimeout(res, 500));
                }

                return i.editReply({ content: "✅ Geri yükleme tamamlandı! (By Swertcode Qnd Fox)" });
            }

            if (i.customId === 'showSafeUsers') {
                const data = await Safe.findOne({ guildID: interaction.guild.id });
                const list = data?.safeUsers?.map(u => `<@${u.id}>`).join(", ") || "Liste boş.";
                return i.followUp({ content: `🛡️ **Güvenli Liste:** ${list}`, ephemeral: true });
            }
        });

        collector.on('end', () => {
            panelMessage.edit({ components: [] }).catch(() => { });
        });
    }
};
