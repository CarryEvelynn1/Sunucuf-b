/**
 * Guard Koruma Paneli
 * Developed By Swertcode and Fox
 */

const {
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
    aliases: ["guard", "koruma", "gpanel"],
    description: "Sunucunun güvenlik ayarlarını bu panelden yönetebilirsin.",

    async execute(client, message, args) {
        if (!conf.owners.includes(message.author.id))
            return message.reply({ content: "Bu komutu sadece sahibi kullanabilir.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle("🛡️ Guard Koruma Paneli")
            .setDescription(`

      `)
            .setColor("#0099ff")
            .setFooter({ text: `Developed By Swertcode and Fox | ${message.guild.name}`, iconURL: client.user.avatarURL() })
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

        const panelMessage = await message.reply({ embeds: [embed], components: [row1, row2, row3] });

        const filter = i => i.user.id === message.author.id;
        const collector = panelMessage.createMessageComponentCollector({ filter, time: 300000 }); // 5 Dakika

        collector.on('collect', async interaction => {
            
            if (interaction.customId !== 'restoreStructure') await interaction.deferUpdate();

            // guard aktif etme bu
            if (interaction.customId === 'guardEnable') {
                await Safe.updateOne({ guildID: message.guild.id }, { $set: { guardEnabled: true } }, { upsert: true });
                return interaction.followUp({ content: "🟢 Guard sistemi başarıyla aktifleştirildi!", ephemeral: true });
            }

            if (interaction.customId === 'guardDisable') {
                await Safe.updateOne({ guildID: message.guild.id }, { $set: { guardEnabled: false } }, { upsert: true });
                return interaction.followUp({ content: "🔴 Guard sistemi devre dışı bırakıldı.", ephemeral: true });
            }

            
            if (interaction.customId === 'backupGuildStructure') {
                const backupData = {
                    guildID: message.guild.id,
                    roles: [],
                    channels: []
                };

                
                message.guild.roles.cache.filter(r => !r.managed && r.id !== message.guild.id).forEach(role => {
                    backupData.roles.push({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        permissions: role.permissions.bitfield.toString(),
                        position: role.position
                    });
                });

               
                message.guild.channels.cache.forEach(channel => {
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
                fs.writeFileSync(path.join(dir, `structure-${message.guild.id}.json`), JSON.stringify(backupData, null, 2));

                return interaction.followUp({ content: "✅ Sunucu yapısı başarıyla yedeklendi! (By Swertcode and Fox)", ephemeral: true });
            }

            
            if (interaction.customId === 'restoreStructure') {
                const filePath = path.join(__dirname, '../../backups', `structure-${message.guild.id}.json`);
                if (!fs.existsSync(filePath)) return interaction.followUp({ content: "❌ Yedek dosyası bulunamadı!", ephemeral: true });

                await interaction.reply({ content: "🔄 İşlem başlatıldı, lütfen bekleyin... Kanallar ve roller yeniden inşa ediliyor.", ephemeral: true });
                const backup = JSON.parse(fs.readFileSync(filePath));

               
                const roleMap = {};
                for (const r of backup.roles) {
                    const newRole = await message.guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, permissions: BigInt(r.permissions) }).catch(() => null);
                    if (newRole) roleMap[r.name] = newRole.id;
                    await new Promise(res => setTimeout(res, 500)); // Hız limiti koruması
                }

                // Kanalları Yeniden Kurma mert
                for (const c of backup.channels) {
                    await message.guild.channels.create({
                        name: c.name,
                        type: c.type,
                        topic: c.topic,
                        nsfw: c.nsfw
                    }).catch(() => null);
                    await new Promise(res => setTimeout(res, 500));
                }

                return interaction.editReply({ content: "✅ Geri yükleme tamamlandı! (By Swertcode and Fox)" });
            }

            
            if (interaction.customId === 'showSafeUsers') {
                const data = await Safe.findOne({ guildID: message.guild.id });
                const list = data?.safeUsers?.map(u => `<@${u.id}>`).join(", ") || "Liste boş.";
                return interaction.followUp({ content: `🛡️ **Güvenli Liste:** ${list}`, ephemeral: true });
            }
        });

        collector.on('end', () => {
            panelMessage.edit({ components: [] }).catch(() => { });
        });
    }
};
