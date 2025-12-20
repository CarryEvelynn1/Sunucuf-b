const { REST, Routes } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`${client.user.tag} aktif!`);
        const commands = [];
        for (const command of client.commands.values()) {
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(client.config.token);

        try {
            console.log(`${commands.length} slash komutu  kaydediliyor...`);

            const data = await rest.put(
                Routes.applicationCommands(client.config.clientId),
                { body: commands },
            );

            console.log(`${data.length} slash komutu başarıyla  kaydedildi!`);
        } catch (error) {
            console.error('Slash komutları kaydedilirken hata:', error);
        }
    },
};