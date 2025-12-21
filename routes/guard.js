const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Safe = require("../schemas/safe");

module.exports = {
  name: "guard",
  description: "Guard sistemi ayarlarını yönetir.",
  async execute(client, message, args) {
    
    if (message.author.id !== message.guild.ownerId) return message.reply("Bu komutu sadece sunucu sahibi kullanabilir.");

    const secenek = args[0]; // ekle, sil, log, ac, kapat

    if (secenek === "ekle") {
      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) return message.reply("Lütfen geçerli bir kullanıcı belirtin.");

      await Safe.findOneAndUpdate(
        { guildID: message.guild.id },
        { $addToSet: { safeUsers: { id: target.id, addedAt: new Date() } } },
        { upsert: true }
      );
      return message.reply(`✅ **${target.tag}** güvenli listeye eklendi.`);
    }

    if (secenek === "sil") {
      const target = message.mentions.users.first() || { id: args[1] };
      await Safe.findOneAndUpdate(
        { guildID: message.guild.id },
        { $pull: { safeUsers: { id: target.id } } },
        { upsert: true }
      );
      return message.reply(`❌ Belirtilen kullanıcı güvenli listeden kaldırıldı.`);
    }

    if (secenek === "log") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("Lütfen bir log kanalı etiketleyin.");

      await Safe.findOneAndUpdate(
        { guildID: message.guild.id },
        { $set: { logChannelID: channel.id } },
        { upsert: true }
      );
      return message.reply(`✅ Log kanalı <#${channel.id}> olarak ayarlandı.`);
    }

    // Bilgi Embedı
    const data = await Safe.findOne({ guildID: message.guild.id }) || { safeUsers: [] };
    const embed = new EmbedBuilder()
      .setTitle("🛡️ Guard Sistem Ayarları")
      .setDescription(`
**Güvenli Kullanıcılar:**
${data.safeUsers.length > 0 ? data.safeUsers.map(u => `<@${u.id}>`).join(", ") : "Kimse eklenmemiş."}

**Log Kanalı:** ${data.logChannelID ? `<#${data.logChannelID}>` : "Ayarlanmamış."}

**Komutlar:**
\`.guard ekle @kullanıcı\`
\`.guard sil @kullanıcı\`
\`.guard log #kanal\`
      `)
      .setColor("Blue")
      .setFooter({ text: "Developer: Swertcode And Fox" })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
