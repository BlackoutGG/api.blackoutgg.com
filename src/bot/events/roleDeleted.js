"use strict";
const DiscordRole = require("$models/DiscordRole");
const redis = require("$services/redis");
module.exports = {
  name: "roleDeleted",
  async execute(role) {
    const { _id } = role;
    await redis.del("discord");
    await DiscordRole.query().where("discord_role_id", _id).del();
  },
};
