const config = require("../config");
const { EmbedBuilder } = require("discord.js");
const CustomCommand = require("../schemas/customCommand");

module.exports = {
  name: "messageCreate",
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;

    const content = message.content.trim().toLowerCase();

    // Özel komut kontrolü
    const ozel = await CustomCommand.findOne({
      guildID: message.guild.id,
      command: content
    });

    if (ozel) {
      try {
        if (ozel.type === 'text') {
          await message.channel.send(ozel.response);
        } else if (ozel.type === 'image') {
          await message.channel.send({
            content: ozel.response || '',
            files: ozel.imageUrl ? [ozel.imageUrl] : []
          });
        } else if (ozel.type === 'embed') {
          const embed = new EmbedBuilder()
            .setDescription(ozel.response || 'Mesaj bulunamadı.')
            .setColor(ozel.embedColor || '#5865f2')
            .setFooter({ text: "Developer: Swertcode And Fox" }) // İmza eklendi
            .setTimestamp();

          if (ozel.embedTitle) embed.setTitle(ozel.embedTitle);
          if (ozel.embedFooter) embed.setFooter({ text: ozel.embedFooter });

          await message.channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error("Özel komut gönderilirken hata:", err);
      }
      return; 
    }

    // Normal komut işleyişi
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const cmd = client.commands.get(cmdName) || client.commands.find(c => c.aliases && c.aliases.includes(cmdName));
    
    if (!cmd) return;

    try {
      await cmd.execute(client, message, args);
    } catch (e) {
      console.error(e);
      message.reply({ 
        content: "Komut çalıştırılırken bir hata oluştu!", 
        allowedMentions: { repliedUser: false } 
      });
    }
  }
};
