const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giris-cikis")
    .setDescription("Giriş-çıkış kanalını ayarla")
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Giriş-çıkış mesajlarının gönderileceği kanal")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tip")
        .setDescription("Mesaj tipi seçin")
        .setRequired(true)
        .addChoices(
          { name: "SwordAndFox", value: "V1" },
          { name: "Embed", value: "embed" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channel = interaction.options.getChannel("kanal");
    const messageType = interaction.options.getString("tip");
    const guildId = interaction.guild.id;
    if (channel.type !== 0) {
      return interaction.reply({
        content: "❌ Lütfen bir text kanalı seçin!",
        ephemeral: true,
      });
    }
    const client = interaction.client;
    client.db.run(
      "INSERT OR REPLACE INTO guild_settings (guild_id, channel_id, message_type) VALUES (?, ?, ?)",
      [guildId, channel.id, messageType],
      function (err) {
        if (err) {
          console.error("Veritabanı hatası:", err);
          return interaction.reply({
            content: "❌ Ayarlar kaydedilirken bir hata oluştu!",
            ephemeral: true,
          });
        }
        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("✅ Giriş-Çıkış Ayarları")
          .addFields(
            { name: "Kanal", value: `<#${channel.id}>`, inline: true },
            {
              name: "Mesaj Tipi",
              value: messageType === "SwordAndFox" ? "V1" : "Embed",
              inline: true,
            }
          )
          .setTimestamp();

        interaction.reply({ embeds: [embed] });
      }
    );
  },
};
