const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  InteractionType
} = require("discord.js");

const express = require("express");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const app = express();
app.get("/", (_, res) => res.send("Bot running"));
app.listen(3000);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "Fuze AC Updates", type: 3 }],
    status: "online"
  });
});

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "pushupdate") return;

    // 🔒 Only allow this specific user ID
    if (interaction.user.id !== "1476497805358006346") {
      return interaction.reply({
        content: "❌ You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("pushupdateModal")
      .setTitle("Push Resource Update");

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

  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId !== "pushupdateModal") return;

    const version = interaction.fields.getTextInputValue("version");
    const changes = interaction.fields.getTextInputValue("changes");

    const role = interaction.guild.roles.cache.find(r => r.name === "Client");

    const embed = new EmbedBuilder()
      .setColor("#f53131ff")
      .setTitle("<:fuze:1455337674369138761> Fuze Anti-Cheat")
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

    await interaction.reply({ content: "✅ Update posted.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);