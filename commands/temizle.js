const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("temizle")
    .setDescription("Belirtilen sayıda mesajı siler")
    .addIntegerOption((option) =>
      option
        .setName("sayi")
        .setDescription("Silinecek mesaj sayısı (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName("kullanici")
        .setDescription("Sadece bu kullanıcının mesajlarını sil")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.reply({
        content:
          "❌ Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısınız!",
        ephemeral: true,
      });
    }
    const amount = interaction.options.getInteger("sayi");
    const targetUser = interaction.options.getUser("kullanici");
    try {
      await interaction.deferReply({ ephemeral: true });

      let messages;
      if (targetUser) {
        const fetchedMessages = await interaction.channel.messages.fetch({
          limit: 100,
        });
        messages = fetchedMessages
          .filter((msg) => msg.author.id === targetUser.id)
          .first(amount);
      } else {
        messages = await interaction.channel.messages.fetch({ limit: amount });
      }
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentMessages = messages.filter(
        (msg) => msg.createdTimestamp > twoWeeksAgo
      );

      if (recentMessages.size === 0) {
        return interaction.editReply({
          content:
            "❌ Silinecek mesaj bulunamadı! (14 günden eski mesajlar silinemez)",
        });
      }

      const deleted = await interaction.channel.bulkDelete(
        recentMessages,
        true
      );

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🗑️ Mesajlar Temizlendi")
        .addFields(
          {
            name: "Silinen Mesaj",
            value: `**${deleted.size}** adet`,
            inline: true,
          },
          {
            name: "Hedef Kullanıcı",
            value: targetUser ? `${targetUser}` : "Tüm kullanıcılar",
            inline: true,
          },
          { name: "Kanal", value: `${interaction.channel}`, inline: true },
          { name: "Yetkili", value: `${interaction.user}`, inline: false }
        )
        .setFooter({ text: "Mesaj Temizleme Sistemi" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {}
      }, 5000);
    } catch (error) {
      console.error("Temizle komutu hatası:", error);
      await interaction.editReply({
        content:
          "❌ Mesajları silerken bir hata oluştu! Botun gerekli izinlere sahip olduğundan emin olun.",
      });
    }
  },
};
