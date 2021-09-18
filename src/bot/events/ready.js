"use strict";
const DiscordRole = require("$models/DiscordRole");
const Settings = require("$models/Settings");
const { getDiscordRoles } = require("$util");

const isMatch = (item) => (item2) =>
  item.discord_role_id === item2.discord_role_id;

module.exports = {
  name: "ready",
  once: true,
  async execute(_, client) {
    try {
      const settings = await Settings.query().select("bot_server_id").first();

      const roles = await getDiscordRoles(settings.bot_server_id);

      const currentTableItems = await DiscordRole.query();

      const inserts = roles.reduce((output, role) => {
        const match = currentTableItems.findIndex(isMatch(role));

        if (match === -1) output.push(role);
        return output;
      }, []);

      if (inserts && inserts.length) {
        await DiscordRole.query()
          .insert(inserts)
          .then(() => console.log("\u2713", "Discord roles loaded."))
          .catch((err) => console.log("\u2717", err.message));
      }

      console.log("\u2713", "Discord bot ready.");
    } catch (err) {
      console.log("\u2717", err.message);
    }
  },
};
