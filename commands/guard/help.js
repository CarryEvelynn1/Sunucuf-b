/**
 * Guard Yardım Menüsü
 * Developed By Swertcode and Fox
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "guardhelp",
  aliases: ["yardım", "help", "ghelp"],
  description: "Guard bot komutlarını detaylı ve görsel anlatımlı gösterir.",

  execute: async (client, message) => {
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `${client.user.username} Yardım Merkezi`, 
        iconURL: client.user.displayAvatarURL() 
      })
      .setTitle("🛡️ Guard Bot Komut Listesi")
      .setDescription(`

`)
      .setColor("#0099ff")
      .setImage('https://cdn.discordapp.com/attachments/1451546482703470610/1452255524577087499/Codr0356.gif?ex=694925da&is=6947d45a&hm=9296e09f909d2e25b7a0d606a6b668203f0bbdff2f13ce4bf373c5df46b7cf8f&')
      .setFooter({ 
        text: "Developed By Swertcode and Fox ", 
        iconURL: client.user.avatarURL() 
      })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
