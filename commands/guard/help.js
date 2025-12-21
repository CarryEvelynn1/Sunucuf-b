/**
 * Guard Yardım Menüsü
 * Developed By Swertcode and Fox
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: "guardhelp",
  description: "Guard bot komutlarını detaylı ve görsel anlatımlı gösterir.",

  async execute(client, interaction) {
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${client.user.username} Yardım Merkezi`, 
        iconURL: client.user.displayAvatarURL() 
      })
      .setTitle("🛡️ Guard Bot Komut Listesi")
      .setDescription(`
**Genel Komutlar:**
> </guardhelp> : Yardım menüsünü gösterir.
> </guardstatus> : Sunucu koruma durumunu raporlar.
> </guardpanel> : Gelişmiş koruma ve yedekleme panelini açar.

**Koruma Sistemleri:**
> 🛡️ **Sağ Tık Koruması:** Yetkisiz rol vermeleri engeller.
> 🛡️ **Kanal & Rol Koruması:** Silinenleri geri açar, yapanı cezalandırır.
> 🛡️ **Bot Koruması:** İzinsiz bot girişlerini engeller.
`)
      .setColor("#0099ff")
      .setImage('https://cdn.discordapp.com/attachments/1451546482703470610/1452255524577087499/Codr0356.gif?ex=694925da&is=6947d45a&hm=9296e09f909d2e25b7a0d606a6b668203f0bbdff2f13ce4bf373c5df46b7cf8f&')
      .setFooter({ 
        text: "Swertcode Qnd Fox", 
        iconURL: client.user.avatarURL() 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
