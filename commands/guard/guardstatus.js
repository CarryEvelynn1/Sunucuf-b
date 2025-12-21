/**
 * Guard Durum Raporu
 * Developed By Swertcode and Fox
 */

const { EmbedBuilder } = require('discord.js');
const Safe = require('../../schemas/safe');
const Log = require('../../schemas/logchannel');
const config = require("../../config");

module.exports = {
  name: "guardstatus",
  description: "Sunucu güvenlik durumu ve guard özet raporu.",
  aliases: ["güvenlikraporu", "guardraporu", "gsorgu"],

  async execute(client, message, args) {
    
    if (!config.owners.includes(message.author.id))
      return message.reply("🚫 Bu komutu sadece bot sahibi kullanabilir.");

    
    const data = await Safe.findOne({ guildID: message.guild.id }) || {};
    const logData = await Log.findOne({ guildID: message.guild.id }) || {};

    
    const guardDurum = data.guardEnabled ? "🟢 **Aktif**" : "🔴 **Pasif**";
    const logKanal = logData?.channelID ? `<#${logData.channelID}>` : "❌ *Ayarlanmamış*";
    const safeCount = data.safeUsers ? data.safeUsers.length : 0;
    const bannedCount = data.bannedCount || 0;

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${message.guild.name} Koruma Sistemi`, 
        iconURL: message.guild.iconURL({ dynamic: true }) 
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
        text: `Developed By Swertcode and Fox `, 
        iconURL: client.user.avatarURL() 
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
