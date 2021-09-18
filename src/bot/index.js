"use strict";
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");
const path = require("path");

const createBot = function (isEnabled = true) {
  if (!client.isReady) {
    const eventFiles = fs
      .readdirSync(path.join(__dirname, "events"))
      .filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const event = require(`./events/${file}`);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }

    if (isEnabled) client.login(process.env.DISCORD_BOT_TOKEN);
  }
};

module.exports = { createBot, client };
