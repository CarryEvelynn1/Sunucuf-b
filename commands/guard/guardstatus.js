/**
 * Guard Durum Raporu
 * Developed By Swertcode and Fox
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Safe = require('../../schemas/safe');
const Log = require('../../schemas/logchannel');
const config = require("../../config");

module.exports = {
  name: "guardstatus",
  description: "Sunucu güvenlik durumu ve guard özet raporu.",
  // Sadece yönetici yetkisi olanların komutu görmesini sağlar
  default_member_permissions: PermissionFlagsBits.Administrator,

  async execute(client, interaction) {
    // Sahip kontrolü
    if (!config.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: "🚫 Bu komutu sadece bot sahibi kullanabilir.", ephemeral: true });
    }

    // Veritabanı verilerini çekme
    const data = await Safe.findOne({ guildID: interaction.guild.id }) || {};
    const logData = await Log.findOne({ guildID: interaction.guild.id }) || {};

    // Durum hesaplamaları
    const guardDurum = data.guardEnabled ? "🟢 **Aktif**" : "🔴 **Pasif**";
    const logKanal = logData?.channelID ? `<#${logData.channelID}>` : "❌ *Ayarlanmamış*";
    const safeCount = data.safeUsers ? data.safeUsers.length : 0;
    const bannedCount = data.bannedCount || 0;

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${interaction.guild.name} Koruma Sistemi`, 
        iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setTitle(`🛡️ Guard Özet Raporu`)
      .setDescription(`Sunucunun mevcut güvenlik ayarları ve istatistikleri aşağıda belirtilmiştir.`)
      .addFields(
        { name: "🔒 Guard Modu", value: guardDurum, inline: true },
        { name: "📜 Log Kanalı", value: logKanal, inline: true },
        { name: "\u200B", value: "\u200B", inline: true }, 
        { name: "👤 Güvenli Liste", value: `\`${safeCount}\` Kullanıcı`, inline: true },
        { name: "🚫 Engellenenler", value: `\`${bannedCount}\` Tehdit`, inline: true },
        { name: "🛰️ Bot Durumu", value: `🟢 Stabil`, inline: true }
      )
      .setColor(data.guardEnabled ? "#2ecc71" : "#e74c3c")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ 
        text: `Swertcode Qnd Fox`, 
        iconURL: client.user.avatarURL() 
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
