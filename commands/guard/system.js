/**
 * Guard Merkezi Sistem Yönetimi
 * Developed By Swertcode and Fox
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const conf = require("../../config");
const panelSchema = require("../../schemas/Panel");

module.exports = {
  name: "sistem",
  aliases: ["setup", "ayarlar", "config"],
  execute: async (client, message) => {
    
    if (!conf.owners.includes(message.author.id)) return;

    
    let data = await panelSchema.findOne({ guildID: message.guild.id });
    if (!data) data = await panelSchema.create({ guildID: message.guild.id });

    
    const generateEmbed = (data) => {
      return new EmbedBuilder()
        .setAuthor({ 
          name: `${message.guild.name} - Guard Kontrol Merkezi`, 
          iconURL: message.guild.iconURL({ dynamic: true }) 
        })
        .setColor("#5865F2")
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`
🛡️ **Guard Modülleri Durum Paneli**
Aşağıdaki butonları kullanarak koruma modüllerini anlık olarak açıp kapatabilirsin.

📁 **Kanal Koruma:** ${data.kanalKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
🧩 **Rol Koruma:** ${data.rolKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
🤭 **Emoji Koruma:** ${data.emojiKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}
🔨 **Ban/Kick Koruma:** ${data.banKickKoruma ? "🟢 `Aktif`" : "🔴 `Kapalı`"}

*Modül durumunu değiştirmek için ilgili butona dokun.*
    `)
        .setFooter({ 
          text: `Developed By Swertcode and Fox `, 
          iconURL: client.user.avatarURL() 
        })
        .setTimestamp();
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kanalKoruma").setLabel("Kanal").setEmoji("📁").setStyle(data.kanalKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("rolKoruma").setLabel("Rol").setEmoji("🧩").setStyle(data.rolKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("emojiKoruma").setLabel("Emoji").setEmoji("😃").setStyle(data.emojiKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("banKickKoruma").setLabel("Ban/Kick").setEmoji("🔨").setStyle(data.banKickKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("yenile").setLabel("Yenile").setEmoji("♻️").setStyle(ButtonStyle.Primary),
    );

    const msg = await message.reply({ embeds: [generateEmbed(data)], components: [row] });

    const filter = (i) => i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 120000 }); // 2 Dakika

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      
      if (i.customId === "yenile") {
        return await msg.edit({ embeds: [generateEmbed(data)], components: [row] });
      }

      
      data[i.customId] = !data[i.customId];
      await data.save();

      
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kanalKoruma").setLabel("Kanal").setEmoji("📁").setStyle(data.kanalKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rolKoruma").setLabel("Rol").setEmoji("🧩").setStyle(data.rolKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("emojiKoruma").setLabel("Emoji").setEmoji("😃").setStyle(data.emojiKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("banKickKoruma").setLabel("Ban/Kick").setEmoji("🔨").setStyle(data.banKickKoruma ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("yenile").setLabel("Yenile").setEmoji("♻️").setStyle(ButtonStyle.Primary),
      );

      
      const logChan = client.channels.cache.get(conf.guardLogChannel);
      if (logChan) {
        logChan.send({
          embeds: [
            new EmbedBuilder()
              .setAuthor({ name: "Sistem Güncellendi", iconURL: i.user.displayAvatarURL() })
              .setDescription(`🛡️ **${i.customId}** modülü **${i.user.tag}** tarafından **${data[i.customId] ? "AKTİF" : "PASİF"}** hale getirildi.`)
              .setColor(data[i.customId] ? "Green" : "Red")
              .setFooter({ text: "By Swertcode and Fox" })
              .setTimestamp()
          ]
        });
      }

      await msg.edit({ embeds: [generateEmbed(data)], components: [updatedRow] });
    });

    collector.on("end", () => {
        msg.edit({ components: [] }).catch(() => {});
    });
  }
};
