"use strict";
const guard = require("express-validator");
const Settings = require("$models/Settings");

const { VIEW_ALL_ADMIN, VIEW_ALL_ROLES } = require("$util/policies");
const { getDiscordRoles } = require("$util");

const _getDiscordRoles = async (req, res, next) => {
  if (await req.redis.exists("discord")) {
    const results = JSON.parse(await req.redis.get("discord"));
    return res.status(200).send(results);
  }

  const { bot_server_id } = await Settings.query()
    .select("bot_server_id")
    .first();

  const results = await getDiscordRoles(req.redis, bot_server_id);

  res.status(200).send(results);
};

module.exports = {
  path: "/discord",
  method: "GET",
  middleware: [guard.check([VIEW_ALL_ADMIN, VIEW_ALL_ROLES])],
  handler: _getDiscordRoles,
};
