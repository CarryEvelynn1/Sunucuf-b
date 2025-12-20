const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yaz")
    .setDescription("Bota bir şey yazdır")
    .addStringOption((option) =>
      option
        .setName("mesaj")
        .setDescription("Yazdırılacak mesaj")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Mesajın gönderileceği kanal (isteğe bağlı)")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return await interaction.reply({
        content: "❌ Bu komutu sadece sunucu yöneticileri kullanabilir!",
        ephemeral: true,
      });
    }

    const message = interaction.options.getString("mesaj");
    const targetChannel =
      interaction.options.getChannel("kanal") || interaction.channel;

    try {
      await targetChannel.send(message);

      await interaction.reply({
        content: `✅ Mesaj ${targetChannel} kanalına gönderildi!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Yaz komutu hatası:", error);
      await interaction.reply({
        content: `❌ Mesaj gönderilirken hata: \`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};
