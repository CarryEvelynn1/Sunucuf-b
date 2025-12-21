/**
 * Web Panel Giriş (İPTAL EDİLDİ)
 * Developed By Swertcode and Fox
 *Mert ilerde webpanel yapacagımız yapıyı boş bıraktım.
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "webpanel",
  description: "Web panel giriş komutu (Devre Dışı).",

  execute: async (client, message) => {
    const embed = new EmbedBuilder()
      .setTitle("🚫 Web Panel Devre Dışı")
      .setDescription(`
Selam **${message.author.username}**,

Guard sistemi yönetimi tamamen Discord üzerinden yapılmaktadır..

🛡️ **Yönetim için:** \`.guardpanel\` veya \`.sistem\` komutlarını kullanabilirsin.
      `)
      .setColor("#ff0000")
      .setFooter({ text: "Developed By Swertcode and Fox " })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
