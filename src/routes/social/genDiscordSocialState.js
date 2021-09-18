"use strict";
const { nanoid } = require("nanoid");
const User = require("$models/User");
const redis = require("$services/redis");

const genStateForDiscordSocialAccountLink = async (req, res, next) => {
  const user = await User.query()
    .where("id", req.user.id)
    .whereNull("discord_id")
    .first();

  if (!user) {
    return res.status(400).send({ message: "User is already linked." });
  }

  const stateString = nanoid(10);

  const state = `link:${stateString}`;

  await redis.set(state, req.user.id, "NX", "EX", 120);

  res.status(200).send(stateString);
};

module.exports = {
  path: "/discord/state",
  method: "GET",
  handler: genStateForDiscordSocialAccountLink,
};
