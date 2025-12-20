const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ayarlar")
    .setDescription("Mevcut giriş-çıkış ayarlarını göster")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const client = interaction.client;

    client.db.get(
      "SELECT * FROM guild_settings WHERE guild_id = ?",
      [guildId],
      (err, row) => {
        if (err) {
          console.error("Veritabanı hatası:", err);
          return interaction.reply({
            content: "❌ Ayarlar kontrol edilirken bir hata oluştu!",
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor("#0099FF")
          .setTitle("⚙️ Mevcut Ayarlar")
          .setTimestamp();

        if (!row || !row.channel_id) {
          embed.setDescription(
            "❌ Henüz hiçbir kanal ayarlanmamış.\n`/giris-cikis` komutuyla ayarlayabilirsiniz."
          );
        } else {
          const channel = interaction.guild.channels.cache.get(row.channel_id);
          const channelName = channel
            ? `<#${channel.id}>`
            : "❌ Kanal bulunamadı";
          const messageType =
            row.message_type === "SwordAndFox" ? "CYA" : "Embed";

          embed.addFields(
            {
              name: "<:kanal:1393615347193741556> Kanal",
              value: channelName,
              inline: true,
            },
            {
              name: "<:tarih:1373689438655217759> Mesaj Tipi",
              value: messageType,
              inline: true,
            },
            { name: "📊 Durum", value: "✅ Aktif", inline: true }
          );
        }
        interaction.reply({ embeds: [embed] });
      }
    );
  },
};
