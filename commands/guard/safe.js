/**
 * Gelişmiş Safe Sistemi
 * Developed By Swertcode and Fox
 */

const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ComponentType, AttachmentBuilder, StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require("discord.js");
const Safe = require("../../schemas/safe");
const config = require("../../config");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "safe",
  aliases: ["güvenli", "beyazliste"],
  async execute(client, message, args) {
    if (!config.owners.includes(message.author.id)) return;

    const sub = args[0];
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
    let data = await Safe.findOne({ guildID: message.guild.id }) || { safeUsers: [] };

    
    if (sub === "ekle") {
      if (!member) return message.reply("❗ Bir kullanıcı etiketlemeli veya ID belirtmelisin.");
      if (data.safeUsers.find(u => u.id === member.id)) return message.reply("❗ Bu kullanıcı zaten güvenli listede.");

      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      try {
        await message.author.send(`🔐 **Güvenli Liste Onayı**\n\nSunucu: **${message.guild.name}**\nEklenen: **${member.user.tag}**\n\nOnay kodunuz: \`${verificationCode}\` \n*Kodun süresi 60 saniyedir.*`);
      } catch {
        return message.reply("❌ DM kutun kapalı olduğu için onay kodu gönderilemedi.");
      }

      message.reply("📩 Onay kodu DM kutuna gönderildi, lütfen buraya yaz.");

      const filter = m => m.author.id === message.author.id && m.content === String(verificationCode);
      const collector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on("collect", async () => {
        data.safeUsers.push({ id: member.id, addedAt: new Date() });
        await Safe.updateOne({ guildID: message.guild.id }, data, { upsert: true });
        return message.channel.send(`✅ **${member.user.tag}** başarıyla güvenli listeye eklendi. (By Swertcode and Fox)`);
      });

      return;
    }

    
    if (sub === "liste") {
      const users = data.safeUsers || [];
      if (users.length === 0) return message.reply("🚫 Güvenli listesi şu an boş.");

      
      async function createSafeCanvas(userList) {
        const canvas = createCanvas(800, 150 + userList.length * 80);
        const ctx = canvas.getContext("2d");

        
        ctx.fillStyle = "#0f0f13";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = "bold 40px Sans";
        ctx.fillStyle = "#00ffcc";
        ctx.fillText("🛡️ Güvenli Liste", 30, 70);

        let y = 140;
        for (const u of userList) {
          const user = await client.users.fetch(u.id).catch(() => null);
          if (!user) continue;

         
          try {
            const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 64 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(65, y - 15, 30, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, 35, y - 45, 60, 60);
            ctx.restore();
          } catch(e) {}

          ctx.font = "24px Sans";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`${user.username} (${user.id})`, 120, y);
          y += 80;
        }
        return canvas;
      }

      const canvas = await createSafeCanvas(users);
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "safe-list.png" });

      const embed = new EmbedBuilder()
        .setTitle("🔐 Güvenli Liste Yönetimi")
        .setDescription("Aşağıdaki listedeki kullanıcılar guard korumasından muaftır.")
        .setImage("https://cdn.discordapp.com/attachments/1451546482703470610/1452255524577087499/Codr0356.gif?ex=694925da&is=6947d45a&hm=9296e09f909d2e25b7a0d606a6b668203f0bbdff2f13ce4bf373c5df46b7cf8f&")
        .setColor("#00ffcc")
        .setFooter({ text: "Developed By Swertcode and Fox", iconURL: client.user.avatarURL() });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("show_details").setLabel("📋 Detaylar").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("delete_user").setLabel("🗑️ Kullanıcı Sil").setStyle(ButtonStyle.Danger)
      );

      const msg = await message.channel.send({ embeds: [embed], files: [attachment], components: [buttons] });

      
      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) return i.reply({ content: "Bu işlemi sadece komutu kullanan yapabilir.", ephemeral: true });

        
        if (i.customId === "show_details") {
          const menu = new StringSelectMenuBuilder().setCustomId("detail_menu").setPlaceholder("Detayını görmek istediğin kişi...");
          users.forEach(u => {
            menu.addOptions({ label: u.id, value: u.id });
          });
          await i.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
        }

        
        if (i.customId === "delete_user") {
          const menu = new StringSelectMenuBuilder().setCustomId("delete_menu").setPlaceholder("Silmek istediğin kişi...");
          users.forEach(u => {
            menu.addOptions({ label: u.id, value: u.id });
          });
          await i.reply({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
        }
      });
      
      return;
    }

    return message.reply("❔ Kullanım: `.safe ekle/çıkar/liste @üye` (Developed By Swertcode and Fox)");
  }
};
