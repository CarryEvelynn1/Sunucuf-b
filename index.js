const { Client, Collection, GatewayIntentBits, ActivityType } = require("discord.js");
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


client.commands = new Collection();
fs.readdirSync("./commands").forEach(dir => {
  const commandFiles = fs.readdirSync(`./commands/${dir}`).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    const cmd = require(`./commands/${dir}/${file}`);
    client.commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      cmd.aliases.forEach(alias => client.commands.set(alias, cmd));
    }
  }
});


fs.readdirSync("./events").filter(file => file.endsWith(".js")).forEach(file => {
  const evt = require(`./events/${file}`);
  if (!evt.name || typeof evt.execute !== "function") return;
  client.on(evt.name, evt.execute.bind(null, client));
});


const activities = [
  { name: 'SwertCode💜FOX Guard', type: ActivityType.Playing },
  { name: 'Swertcode and Fox ❤️', type: ActivityType.Watching },
  { name: 'Sunucunu koruyor 🛡️', type: ActivityType.Competing },
  { name: '.help komutlarıma bak!', type: ActivityType.Listening },
];

let index = 0;
setInterval(() => {
  if (!client.user) return;
  const activity = activities[index % activities.length];
  client.user.setActivity(activity.name, { type: activity.type });
  index++;
}, 10000);


mongoose.connect(config.mongoUrl)
  .then(() => console.log("✅ MongoDB bağlantısı başarılı."))
  .catch(err => console.error("❌ MongoDB hatası:", err));

client.login(config.token).catch(err => {
  console.error("❌ Bot giriş yapamadı, tokeni kontrol et!");
});
