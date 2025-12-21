const { Client, Collection, GatewayIntentBits, ActivityType, REST, Routes } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// --- KOMUT VE SLASH KAYIT HAZIRLIĞI ---
client.commands = new Collection();
const slashCommands = [];

fs.readdirSync("./commands").forEach(dir => {
  const commandFiles = fs.readdirSync(`./commands/${dir}`).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    const cmd = require(`./commands/${dir}/${file}`);
    
    // Klasik komutlar için collection'a ekle
    client.commands.set(cmd.name, cmd);
    
    // Slash komut verisini hazırla
    slashCommands.push({
      name: cmd.name,
      description: cmd.description || "Açıklama belirtilmemiş.",
      options: cmd.options || []
    });
  }
});

// --- EVENT YÜKLEYİCİ ---
fs.readdirSync("./events").filter(file => file.endsWith(".js")).forEach(file => {
  const evt = require(`./events/${file}`);
  if (!evt.name || typeof evt.execute !== "function") return;
  client.on(evt.name, evt.execute.bind(null, client));
});

// --- ACTIVITY (DURUM) AYARI ---
const activities = [
  { name: 'SwertCode💜FOX Guard', type: ActivityType.Playing },
  { name: 'Swertcode and Fox ❤️', type: ActivityType.Watching },
  { name: 'Sunucunu koruyor 🛡️', type: ActivityType.Competing },
  { name: '/yardım komutlarıma bak!', type: ActivityType.Listening },
];

let index = 0;
setInterval(() => {
  if (!client.user) return;
  const activity = activities[index % activities.length];
  client.user.setActivity(activity.name, { type: activity.type });
  index++;
}, 10000);

// --- MONGOOSE VE BOT GİRİŞ ---
mongoose.connect(config.mongoUrl)
  .then(() => console.log("✅ MongoDB bağlantısı başarılı."))
  .catch(err => console.error("❌ MongoDB hatası:", err));

client.login(config.token).then(() => {
    // Bot giriş yaptıktan sonra Slash komutlarını kaydet
    const rest = new REST({ version: '10' }).setToken(config.token);
    (async () => {
        try {
            console.log("⏳ Slash komutları Discord'a gönderiliyor...");
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, config.guildID),
                { body: slashCommands }
            );
            console.log("✅ Slash komutları tüm sunucular için güncellendi!");
        } catch (error) {
            console.error("❌ Slash komut yükleme hatası:", error);
        }
    })();
}).catch(err => {
  console.error("❌ Bot giriş yapamadı, tokeni kontrol et!");
});

// --- SLASH KOMUT ÇALIŞTIRICI ---
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(client, interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
    }
});
