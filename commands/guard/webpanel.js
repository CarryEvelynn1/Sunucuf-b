/**
 * Web Panel Giriş (İPTAL EDİLDİ)
 * Developed By Swertcode and Fox
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: "webpanel",
  description: "Web panel giriş komutu hakkında bilgi verir.",

  async execute(client, interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🚫 Web Panel Devre Dışı")
      .setDescription(`
Selam **${interaction.user.username}**,

Guard sistemi yönetimi şu anda tamamen Discord üzerinden sağlanmaktadır. Web panel yapısı ilerleyen güncellemeler için askıya alınmıştır.

🛡️ **Sistemi yönetmek için aşağıdaki komutları kullanabilirsin:**
> </guardpanel> : Genel koruma ve yedekleme ayarları.
> </sistem> : Modülleri (Kanal, Rol, Emoji vb.) açıp kapatma paneli.
      `)
      .setColor("#ff0000")
      .setFooter({ text: "Swertcode and Fox" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
