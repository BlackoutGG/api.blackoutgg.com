"use strict";
const DiscordRole = require("$models/DiscordRole");
const redis = require("$services/redis");
module.exports = {
  name: "roleCreated",
  async execute(role) {
    const { _id, name } = role;
    await redis.del("discord");
    await DiscordRole.query()
      .whereNot("discord_role_id", _id)
      .insert({ discord_role_id: _id, name });
  },
};
