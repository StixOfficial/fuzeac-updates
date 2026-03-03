const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  InteractionType,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const express = require("express");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ===================== EXPRESS KEEP ALIVE ===================== */

const app = express();
app.get("/", (_, res) => res.send("Bot running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Web server running on port ${PORT}`)
);

/* ===================== REGISTER SLASH COMMAND ===================== */

const commands = [
  new SlashCommandBuilder()
    .setName("pushupdate")
    .setDescription("Post an anti-cheat update")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash command...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash command registered instantly.");
  } catch (err) {
    console.error(err);
  }
})();

/* ===================== BOT READY ===================== */

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "Fuze AC Updates", type: 3 }],
    status: "online"
  });
});

/* ===================== INTERACTIONS ===================== */

client.on("interactionCreate", async interaction => {

  /* Slash Command */
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "pushupdate") return;

    // 🔒 Role restriction
    if (
      !interaction.inGuild() ||
      !interaction.member.roles.cache.has("1476497805358006346")
    ) {
      return interaction.reply({
        content: "❌ You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("pushupdateModal")
      .setTitle("Push Anti-Cheat Update");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("version")
          .setLabel("Version")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("changes")
          .setLabel("Changes Made")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }

  /* Modal Submit */
  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId !== "pushupdateModal") return;

    const version = interaction.fields.getTextInputValue("version");
    const changes = interaction.fields.getTextInputValue("changes");

    const role = interaction.guild.roles.cache.find(r => r.name === "Client");

    const embed = new EmbedBuilder()
      .setColor("#f53131")
      .setTitle("Fuze Anti-Cheat Updates")
      .addFields(
        { name: "Version", value: version, inline: true },
        { name: "Changes Made", value: `\`\`\`${changes}\`\`\`` }
      )
      .setFooter({ text: "Fuze Anti-Cheat" })
      .setTimestamp();

    await interaction.channel.send({
      content: role ? `<@&${role.id}>` : "",
      embeds: [embed]
    });

    await interaction.reply({
      content: "✅ Update posted.",
      ephemeral: true
    });
  }
});

/* ===================== LOGIN ===================== */

client.login(process.env.DISCORD_TOKEN);
