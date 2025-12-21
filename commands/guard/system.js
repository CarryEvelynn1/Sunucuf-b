/**
 * Guard Merkezi Sistem Yönetimi
 * Developed By Swertcode and Fox
 */

const { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require("discord.js");
const conf = require("../../config");
const panelSchema = require("../../schemas/Panel");

module.exports = {
  name: "sistem",
  description: "Guard koruma modüllerini anlık olarak yönetmeni sağlar.",
  default_member_permissions: PermissionFlagsBits.Administrator,

  async execute(client, interaction) {
    
    if (!conf.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "🚫 Bu paneli sadece bot sahipleri yönetebilir.", ephemeral: true });
    }

    // Veritabanından modül durumlarını çek
    let data = await panelSchema.findOne({ guildID: interaction.guild.id });
    if (!data) data = await panelSchema.create({ guildID: interaction.guild.id });

    // Embed oluşturucu fonksiyon
    const generateEmbed = (currentData) => {
      return new EmbedBuilder()
        .setAuthor({ 
          name: `${interaction.guild.name} - Guard Kontrol Merkezi`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
        })
        .setColor("#5865F2")
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`
🛡️ **Guard Modülleri Durum Paneli**
Aşağıdaki butonları kullanarak koruma modüllerini anlık olarak açıp kapatabilirsin.

📁 **Kanal Koruma:** ${currentData.kanalKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
🧩 **Rol Koruma:** ${currentData.rolKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
😃 **Emoji Koruma:** ${currentData.emojiKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
🔨 **Ban/Kick Koruma:** ${currentData.banKickKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}

*Değişiklik yapmak için butonlara dokun.*
    `)
        .setFooter({ 
          text: `Swertcode and Fox`, 
          iconURL: client.user.avatarURL() 
        })
        .setTimestamp();
    };

    
    const generateRow = (currentData) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kanalKoruma").setLabel("Kanal").setEmoji("📁").setStyle(currentData.kanalKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rolKoruma").setLabel("Rol").setEmoji("🧩").setStyle(currentData.rolKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("emojiKoruma").setLabel("Emoji").setEmoji("😃").setStyle(currentData.emojiKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("banKickKoruma").setLabel("Ban/Kick").setEmoji("🔨").setStyle(currentData.banKickKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("yenile").setLabel("Yenile").setEmoji("♻️").setStyle(ButtonStyle.Primary),
      );
    };

    const msg = await interaction.reply({ 
      embeds: [generateEmbed(data)], 
      components: [generateRow(data)],
      fetchReply: true 
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

    collector.on("collect", async (i) => {
      if (i.customId === "yenile") {
        await i.deferUpdate();
        return await interaction.editReply({ embeds: [generateEmbed(data)], components: [generateRow(data)] });
      }

      // Modül durumunu tersine çevir (true -> false / false -> true)
      data[i.customId] = !data[i.customId];
      await data.save();
      await i.deferUpdate();

      // Log kanalına bildirim gönder
      const logChan = interaction.guild.channels.cache.get(conf.logChannel);
      if (logChan) {
        logChan.send({
          embeds: [
            new EmbedBuilder()
              .setAuthor({ name: "Sistem Güncellendi", iconURL: i.user.displayAvatarURL() })
              .setDescription(`🛡️ **${i.customId}** modülü **${i.user.tag}** tarafından **${data[i.customId] ? "AKTİF" : "PASİF"}** hale getirildi.`)
              .setColor(data[i.customId] ? "Green" : "Red")
              .setFooter({ text: "Swertcode Qnd Fox" })
              .setTimestamp()
          ]
        });
      }

      // Paneli güncelle
      await interaction.editReply({ embeds: [generateEmbed(data)], components: [generateRow(data)] });
    });

    collector.on("end", () => {
        interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};
