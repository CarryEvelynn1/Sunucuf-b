const { EmbedBuilder } = require("discord.js");
const Log = require("../schemas/logchannel");

module.exports = {
  name: "messageUpdate",
  async execute(client, oldMessage, newMessage) {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

    const logData = await Log.findOne({ guildID: oldMessage.guild.id });
    const logChannel = client.channels.cache.get(logData?.channelID);
    
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Mesaj Düzenlendi", iconURL: oldMessage.author.displayAvatarURL() })
        .setDescription(`
📝 **Kanal:** <#${oldMessage.channel.id}> (\`${oldMessage.channel.id}\`)
👤 **Kullanıcı:** <@${oldMessage.author.id}> (\`${oldMessage.author.id}\`)

**Eski Mesaj:** \`\`\`${oldMessage.content || "Mesaj içeriği bulunamadı."}\`\`\`
**Yeni Mesaj:** \`\`\`${newMessage.content || "Mesaj içeriği bulunamadı."}\`\`\`
      `)
      .setColor("#FFD700")
      .setFooter({ text: "Developer: Swertcode And Fox", iconURL: client.user.avatarURL() })
      .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  }
};
