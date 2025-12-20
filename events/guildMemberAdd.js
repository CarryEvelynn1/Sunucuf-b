const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    const client = member.client;
    const guild = member.guild;
    client.db.get(
      "SELECT * FROM guild_settings WHERE guild_id = ?",
      [guild.id],
      async (err, row) => {
        if (err) {
          console.error("Veritabanı hatası:", err);
          return;
        }

        if (!row || !row.channel_id) return;

        const channel = guild.channels.cache.get(row.channel_id);
        if (!channel) return;

        const messageType = row.message_type || "canvas";

        if (messageType === "canvas") {
          const attachment = await createWelcomeImage(member, "welcome");
          await channel.send({ files: [attachment] });
        } else {
          const embedData = await createWelcomeEmbed(member, "welcome");
          await channel.send(embedData);
        }
      }
    );
  },
};

async function getUserColor(member) {
  try {
    if (member.user.bannerURL()) {
      return member.user.accentColor || "#3B82F6";
    }
    const highestRole = member.roles.highest;
    if (highestRole && highestRole.color !== 0) {
      return `#${highestRole.color.toString(16).padStart(6, "0")}`;
    }
    return "#3B82F6";
  } catch (error) {
    console.error("Renk alma hatası:", error);
    return "#3B82F6";
  }
}

async function getUserBadges(member) {
  const badges = [];
  const badgesPath = path.join(__dirname, "..", "SwordAndFox");

  try {
  //  mert burası bot kontrolü
    if (member.user.bot) {
      const botBadge = path.join(badgesPath, "bot.png");
      if (fs.existsSync(botBadge)) badges.push(botBadge);
    }

 //    bot kontrolü 2
    if (member.user.bot && member.user.flags?.has("VerifiedBot")) {
      const verifiedBotBadge = path.join(badgesPath, "boost.png");
      if (fs.existsSync(verifiedBotBadge)) badges.push(verifiedBotBadge);
    }

    // HypeSquad
    if (member.user.flags?.has("Hypesquad")) {
      const hypesquadBadge = path.join(badgesPath, "hypesquad.png");
      if (fs.existsSync(hypesquadBadge)) badges.push(hypesquadBadge);
    }
    // Active Developer
    if (member.user.flags?.has("ActiveDeveloper")) {
      const activeDeveloperBadge = path.join(
        badgesPath,
        "active-developer.png"
      );
      if (fs.existsSync(activeDeveloperBadge))
        badges.push(activeDeveloperBadge);
    }

    // Nitro rozeti
    if (member.user.flags?.has("PremiumEarlySupporter")) {
      const nitroBadge = path.join(badgesPath, "PremiumEarlySupporter.png");
      if (fs.existsSync(nitroBadge)) badges.push(nitroBadge);
    }

    // Sunucu destekçisi rozeti
    const supporterBadge = path.join(badgesPath, "supporter.png");
    if (fs.existsSync(supporterBadge)) badges.push(supporterBadge);
  } catch (error) {
    console.error("Rozet yükleme hatası:", error);
  }

  return badges;
}

function getBannerURL(user, size = 1024) {
  if (!user.banner) return null;

  const format = user.banner.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format}?size=${size}`;
}

async function createWelcomeImage(member, type) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");

  try {
    const userColor = await getUserColor(member);
    let background;
    const bannerURL = getBannerURL(member.user);

    if (bannerURL) {
      try {
        background = await loadImage(bannerURL);
      } catch (error) {
        console.log("Banner yüklenemedi, avatar kullanılıyor:", error.message);
        const avatarURL = member.user.displayAvatarURL({
          extension: "png",
          size: 1024,
        });
        background = await loadImage(avatarURL);
      }
    } else {
      const avatarURL = member.user.displayAvatarURL({
        extension: "png",
        size: 1024,
      });
      background = await loadImage(avatarURL);
    }
    ctx.filter = "blur(2px)";
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.6)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = userColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 15);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(15, 15, canvas.width - 30, canvas.height - 30, 10);
    ctx.stroke();
    const bannerGradient = ctx.createLinearGradient(0, 0, 200, 0);
    bannerGradient.addColorStop(0, userColor);
    bannerGradient.addColorStop(1, userColor + "99");
    ctx.fillStyle = bannerGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 200, 60, [0, 0, 15, 0]);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("HOŞ GELDİN", 15, 38);
    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 512 })
    );
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 170, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 70, 90, 160, 160);
    ctx.restore();
    ctx.strokeStyle = userColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(150, 170, 83, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(150, 170, 80, 0, Math.PI * 2);
    ctx.stroke();
    const username = member.user.username;
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "center";
    const usernameWidth = ctx.measureText(username).width;
    const usernameGradient = ctx.createLinearGradient(
      250,
      120,
      250 + usernameWidth + 40,
      165
    );
    usernameGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    usernameGradient.addColorStop(1, userColor + "40");
    ctx.fillStyle = usernameGradient;
    ctx.beginPath();
    ctx.roundRect(250, 120, usernameWidth + 40, 45, 12);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(250, 120, usernameWidth + 40, 45, 12);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(username, 270 + usernameWidth / 2, 150);

    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = userColor;
    ctx.fillText("KATILAN ÜYE", 270 + usernameWidth / 2, 180);

    const currentMembers = member.guild.memberCount;
    const targetMembers = Math.ceil(currentMembers / 100) * 100;
    const remaining = targetMembers - currentMembers;
    const memberInfo = `Hedef: ${targetMembers.toLocaleString(
      "tr-TR"
    )} | Üye Sayısı: ${currentMembers.toLocaleString(
      "tr-TR"
    )} | Kalan: ${remaining}`;

    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    const memberInfoWidth = ctx.measureText(memberInfo).width;

    const memberGradient = ctx.createLinearGradient(
      250,
      200,
      250 + memberInfoWidth + 30,
      235
    );
    memberGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    memberGradient.addColorStop(1, userColor + "30");
    ctx.fillStyle = memberGradient;
    ctx.beginPath();
    ctx.roundRect(250, 200, memberInfoWidth + 30, 35, 10);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(250, 200, memberInfoWidth + 30, 35, 10);
    ctx.stroke();

    ctx.fillStyle = userColor;
    ctx.textAlign = "left";
    ctx.fillText(memberInfo, 265, 222);
    const badges = await getUserBadges(member);
    if (badges.length > 0) {
      let badgeX = canvas.width - 90; 
      let badgeY = 70; 

      for (let i = 0; i < Math.min(badges.length, 3); i++) {
        try {
          const badge = await loadImage(badges[i]);
          const badgeGradient = ctx.createRadialGradient(
            badgeX,
            badgeY + 32,
            0,
            badgeX,
            badgeY + 32,
            40
          );
          badgeGradient.addColorStop(0, userColor + "60");
          badgeGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
          ctx.fillStyle = badgeGradient;
          ctx.beginPath();
          ctx.roundRect(badgeX - 50, badgeY, 100, 100, 18);  
          ctx.fill();
          ctx.strokeStyle = userColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
        ctx.roundRect(badgeX - 50, badgeY, 100, 100, 18);

          ctx.stroke();
          ctx.drawImage(badge, badgeX - 54, badgeY - 4, 108, 108);

          badgeX -= 75; 
          if (badgeX < canvas.width - 450) {
            badgeX = canvas.width - 90;
            badgeY += 75;
          }
        } catch (badgeError) {
          console.error("Rozet yükleme hatası:", badgeError);
        }
      }
    }
    const createdDate = member.user.createdAt.toLocaleDateString("tr-TR");
    const createdTime = member.user.createdAt.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateText = `OLUŞTURULMA TARİHİ | ${createdDate}`;
    const timeText = `${createdTime}`;
    const daysOld = Math.floor(
      (Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageText = `${daysOld} gün önce`;

    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    const dateWidth = Math.max(
      ctx.measureText(dateText).width,
      ctx.measureText(timeText).width,
      ctx.measureText(ageText).width
    );
    const dateGradient = ctx.createLinearGradient(
      20,
      300,
      20 + dateWidth + 30,
      380
    );
    dateGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    dateGradient.addColorStop(1, userColor + "40");
    ctx.fillStyle = dateGradient;
    ctx.beginPath();
    ctx.roundRect(20, 300, dateWidth + 30, 80, 10);
    ctx.fill();
    ctx.strokeStyle = userColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 300, dateWidth + 30, 80, 10);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(dateText, 35, 320);
    ctx.fillStyle = userColor;
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(timeText, 35, 340);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillText(ageText, 35, 360);

    const currentDate = new Date().toLocaleDateString("tr-TR");
    const currentTime = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    const currentDateWidth = Math.max(
      ctx.measureText(currentDate).width,
      ctx.measureText(currentTime).width
    );

    const currentDateGradient = ctx.createLinearGradient(
      canvas.width - currentDateWidth - 50,
      320,
      canvas.width - 20,
      370
    );
    currentDateGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    currentDateGradient.addColorStop(1, userColor + "40");
    ctx.fillStyle = currentDateGradient;
    ctx.beginPath();
    ctx.roundRect(
      canvas.width - currentDateWidth - 50,
      320,
      currentDateWidth + 30,
      50,
      10
    );
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      canvas.width - currentDateWidth - 50,
      320,
      currentDateWidth + 30,
      50,
      10
    );
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(currentDate, canvas.width - currentDateWidth - 35, 340);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentTime, canvas.width - currentDateWidth - 35, 355);

    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    const idGradient = ctx.createLinearGradient(
      canvas.width / 2 - 80,
      375,
      canvas.width / 2 + 80,
      395
    );
    idGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    idGradient.addColorStop(0.5, userColor + "30");
    idGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    ctx.fillStyle = idGradient;
    ctx.textAlign = "center";
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 80, 375, 160, 20, 8);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 80, 375, 160, 20, 8);
    ctx.stroke();

    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(`ID: ${member.id}`, canvas.width / 2, 387);

    return new AttachmentBuilder(canvas.toBuffer(), { name: "welcome.png" });
  } catch (error) {
    console.error("Canvas hatası:", error);

    ctx.fillStyle = "#36393f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Hoşgeldin!", 400, 180);
    ctx.fillText(`@${member.user.username}`, 400, 220);

    return new AttachmentBuilder(canvas.toBuffer(), { name: "welcome.png" });
  }
}

async function createWelcomeEmbed(member, type) {
  const guild = member.guild;
  const isWelcome = type === "welcome";

  const accountAge = Date.now() - member.user.createdAt.getTime();
  const daysOld = Math.floor(accountAge / (1000 * 60 * 60 * 24));

  let riskLevel = "Düşük";
  if (daysOld < 7) riskLevel = "Çok Yüksek";
  else if (daysOld < 30) riskLevel = "Yüksek";
  else if (daysOld < 90) riskLevel = "Orta";
  const currentMembers = guild.memberCount;
  const targetMembers = Math.ceil(currentMembers / 100) * 100;
  const userColor = await getUserColor(member);

  const embed = new EmbedBuilder()
    .setColor(userColor)
    .setTitle(`${member.user.username} | ${member.id}`)
    .setDescription(
      isWelcome ? "**Sunucuya katıldı!**" : "**Sunucudan ayrıldı!😭**"
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "• Kullanıcı:", value: `<@${member.id}>`, inline: true },
      { name: "• Risk Seviyesi:", value: riskLevel, inline: true },
      {
        name: "• Sunucudaki Üye Sayısı:",
        value: currentMembers.toString(),
        inline: true,
      },
      {
        name: "• Hedeflenen Üye Sayısı:",
        value: `${currentMembers}/${targetMembers}`,
        inline: true,
      },
      {
        name: "• Hesap Oluşturulma Tarihi:",
        value: `${member.user.createdAt.toLocaleDateString(
          "tr-TR"
        )} | ${Math.floor(
          (Date.now() - member.user.createdAt.getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        )} yıl önce`,
        inline: false,
      }
    );
  const canvas = createCanvas(500, 250);
  const ctx = canvas.getContext("2d");

  try {
    let background;
    const bannerURL = getBannerURL(member.user);

    if (bannerURL) {
      try {
        background = await loadImage(bannerURL);
      } catch (error) {
        const avatarURL = member.user.displayAvatarURL({
          extension: "png",
          size: 1024,
        });
        background = await loadImage(avatarURL);
      }
    } else {
      const avatarURL = member.user.displayAvatarURL({
        extension: "png",
        size: 1024,
      });
      background = await loadImage(avatarURL);
    }
    ctx.filter = "blur(1px)";
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = userColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(3, 3, canvas.width - 6, canvas.height - 6, 12);
    ctx.stroke();

    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 256 })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 75, 75, 100, 100);
    ctx.restore();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(125, 125, 53, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(125, 125, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("Hoşgeldin", 200, 90);

    const username = member.user.username;
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    const usernameWidth = ctx.measureText(username).width;

    const usernameGradient = ctx.createLinearGradient(
      195,
      100,
      195 + usernameWidth + 20,
      135
    );
    usernameGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    usernameGradient.addColorStop(1, userColor + "50");
    ctx.fillStyle = usernameGradient;
    ctx.beginPath();
    ctx.roundRect(195, 100, usernameWidth + 20, 35, 8);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(195, 100, usernameWidth + 20, 35, 8);
    ctx.stroke();

    ctx.fillStyle = "#7b9febff";
    ctx.fillText(username, 205, 125);

    const memberText = `Üye Sayısı: ${currentMembers}/${targetMembers}`;
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    const memberTextWidth = ctx.measureText(memberText).width;

    const memberGradient = ctx.createLinearGradient(
      195,
      145,
      195 + memberTextWidth + 20,
      175
    );
    memberGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    memberGradient.addColorStop(1, userColor + "40");
    ctx.fillStyle = memberGradient;
    ctx.beginPath();
    ctx.roundRect(195, 145, memberTextWidth + 20, 30, 8);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(195, 145, memberTextWidth + 20, 30, 8);
    ctx.stroke();

    ctx.fillStyle = userColor;
    ctx.fillText(memberText, 205, 165);

    const dateText = new Date().toLocaleDateString("tr-TR");
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    const dateTextWidth = ctx.measureText(dateText).width;

    const dateGradient = ctx.createLinearGradient(
      350,
      200,
      350 + dateTextWidth + 20,
      225
    );
    dateGradient.addColorStop(0, "rgba(0, 0, 0, 0.9)");
    dateGradient.addColorStop(1, userColor + "30");
    ctx.fillStyle = dateGradient;
    ctx.beginPath();
    ctx.roundRect(350, 200, dateTextWidth + 20, 25, 6);
    ctx.fill();

    ctx.strokeStyle = userColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(350, 200, dateTextWidth + 20, 25, 6);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(dateText, 360, 218);

    const imageAttachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "SwordAndFox.png",
    });
    embed.setImage("attachment://SwordAndFox.png");

    return { embeds: [embed], files: [imageAttachment] };
  } catch (error) {
    console.error("Embed canvas hatası:", error);
    return { embeds: [embed] };
  }
}
